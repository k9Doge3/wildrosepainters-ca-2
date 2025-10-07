import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { env } from '../../../lib/env'
import { dispatchLeadToCRM } from '../../../lib/crm-dispatch'
import { logLead } from '../../../lib/logging/lead-logger'
import { trackEvent } from '@/lib/analytics'
import { businessProfile } from '@/config/business-profile.example'
import { scoreLead } from '@/lib/leads/scoring'
import { appendLead, EnrichedLead, listLeads } from '@/lib/leads/store'
import { enqueue } from '@/lib/leads/drip-queue'
import { genId } from '@/lib/hrm/models'
import { selectBuyerForLead } from '@/lib/leads/routing'
import { incrementDelivery, adjustBuyerCredit } from '@/lib/buyers/store'
import { logDelivery } from '@/lib/leads/deliveries'
import { recordLeadCharge } from '@/lib/billing/transactions'

// --- In-memory rate limiting (note: per-instance; may reset in serverless) ---
const RATE_LIMIT_MAX = 5 // requests
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const rateStore: Map<string, number[]> = new Map()

function rateLimit(ip: string): boolean {
  if (!ip) return false // allow if we cannot determine IP
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const arr = (rateStore.get(ip) || []).filter(ts => ts > windowStart)
  if (arr.length >= RATE_LIMIT_MAX) return true
  arr.push(now)
  rateStore.set(ip, arr)
  return false
}

// --- Basic spam heuristics ---
const BANNED_KEYWORDS = ['viagra','loan','crypto investment','escort','porn']
function spamCheck(message: string): string | null {
  const lower = message.toLowerCase()
  if (BANNED_KEYWORDS.some(k => lower.includes(k))) return 'contains prohibited terms'
  const urlMatches = message.match(/https?:\/\//gi)
  if (urlMatches && urlMatches.length > 3) return 'too many urls'
  if (message.length < 10) return 'message too short'
  if (message.length > 6000) return 'message too long'
  return null
}

interface IncomingAttachment { filename: string; mime: string; data: string }
interface RequestBody { 
  name: string; email: string; phone: string; service: string; message: string; 
  attachments?: IncomingAttachment[]; website?: string;
  urgency?: 'asap' | '30d' | 'planning';
  budgetBand?: 'under2k' | '2to5k' | '5to10k' | '10kplus';
  addons?: string[];
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  consentShare?: boolean;
}

export async function POST(request: NextRequest) {
  try {
  const body: RequestBody = await request.json()
  const { name, email, phone, service, message, attachments = [], website, urgency, budgetBand, addons = [], utm, consentShare } = body

    // Honeypot server-side check (if website field filled treat as success but ignore)
    const isBot = !!website

    // Determine IP early for rate limit / logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || ''
    if (!isBot && rateLimit(ip)) {
      trackEvent({ type: 'lead.rate_limited', meta: { ip } })
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a few minutes.' }, { status: 429 })
    }

    // Validate required fields
  if (!name || !email || !phone || !service || !message) {
      trackEvent({ type: 'lead.validation_error', meta: { missing: !name ? 'name' : !email ? 'email' : !phone ? 'phone' : !service ? 'service' : 'message' } })
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Require share consent to route to buyers (regulatory & trust). If absent treat as validation error.
    if (!consentShare) {
      return NextResponse.json({ error: 'Consent required to share project details with a contractor.' }, { status: 400 })
    }

    // Spam heuristics (skip if honeypot triggered — silently accept)
    if (!isBot) {
      const spamReason = spamCheck(message)
      if (spamReason) {
        trackEvent({ type: 'lead.spam_rejected', meta: { reason: spamReason } })
        return NextResponse.json({ error: 'Rejected as spam: ' + spamReason }, { status: 400 })
      }
    }

    // Validate & transform attachments (images only, <=3, <=5MB each)
    const safeAttachments = (attachments || []).slice(0,3).filter(att => {
      if (!att || !att.filename || !att.mime || !att.data) return false
      if (!att.mime.startsWith('image/')) return false
      // Rough size estimation from base64 length: 4 chars ~ 3 bytes
      const approxBytes = Math.ceil((att.data.length * 3) / 4)
      if (approxBytes > 5 * 1024 * 1024) return false
      return true
    }).map(att => ({ filename: att.filename, content: Buffer.from(att.data, 'base64'), contentType: att.mime }))

  const attachmentNote = safeAttachments.length ? `\n(Photos attached: ${safeAttachments.length})` : ''

  // Enrichment scoring (centralized util)
  const { raw: rawScore, normalized: normalizedScore } = scoreLead({ urgency, budgetBand, photos: safeAttachments.length, addonsCount: addons.length })

  // Duplicate detection (14d window by phone OR email)
  let duplicateRecent = false
  try {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000
    const recent = listLeads({})
      .filter(l => new Date(l.createdAt).getTime() >= cutoff)
      .filter(l => l.phone === phone || l.email.toLowerCase() === email.toLowerCase())
    if (recent.length) duplicateRecent = true
    if (duplicateRecent) {
      trackEvent({ type: 'lead.duplicate_detected', meta: { phone, email, recentCount: recent.length } })
    }
  } catch (e) {
    console.error('duplicate detection failed', e)
  }

  // Persist enriched lead (append-only JSONL)
  const leadId = genId('lead')
  const enriched: EnrichedLead = {
    id: leadId,
    createdAt: new Date().toISOString(),
    name, email, phone, service, message,
    urgency, budgetBand, addons, utm, photos: safeAttachments.length, consentShare,
    duplicateRecent,
    rawScore, normalizedScore,
    status: 'new'
  }
  if (!isBot) {
    try { appendLead(enriched) } catch (e) { console.error('appendLead failed', e) }
  }

  // Create email transporter early so buyer routing can reuse it
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  // Buyer routing (exclusive) – best effort; failure does not block user success response
  if (!isBot) {
    ;(async () => {
      try {
        const buyer = selectBuyerForLead(enriched, { postalCode: undefined })
        if (!buyer) {
          trackEvent({ type: 'lead.routing.none', meta: { leadId, score: normalizedScore } })
          return
        }
        // Deliver via email (webhook future)
        const start = Date.now()
        try {
          await transporter.sendMail({
            from: `Lead Dispatch <${env.SMTP_EMAIL}>`,
            to: buyer.contactEmail,
            subject: `[Lead] ${enriched.service} | Score ${normalizedScore} | ${enriched.name}`,
            text: `New lead\nName: ${enriched.name}\nPhone: ${enriched.phone}\nEmail: ${enriched.email}\nService: ${enriched.service}\nUrgency: ${urgency}\nBudget: ${budgetBand}\nScore: ${normalizedScore}\nMessage:\n${message}\n`,
            headers: { 'X-Lead-Id': leadId, 'X-Score': String(normalizedScore), 'X-Buyer-Id': buyer.id, 'X-Duplicate-Recent': String(!!enriched.duplicateRecent) }
          })
          incrementDelivery(buyer.id)
          // Deduct credit (guard: ensure fields exist)
          const price = (buyer as any).pricePerLeadCents ?? 0
          if (price > 0) {
            const updatedBuyer = adjustBuyerCredit(buyer.id, -price)
            if (updatedBuyer) {
              recordLeadCharge(buyer.id, price, updatedBuyer.creditCents, { leadId, score: normalizedScore })
            }
          }
          logDelivery({ id: genId('ldel'), leadId, buyerId: buyer.id, createdAt: new Date().toISOString(), method: 'email', status: 'sent', latencyMs: Date.now() - start })
          trackEvent({ type: 'lead.routing.delivered', meta: { leadId, buyerId: buyer.id, method: 'email' } })
        } catch (e) {
          console.error('buyer delivery failed', e)
          logDelivery({ id: genId('ldel'), leadId, buyerId: buyer.id, createdAt: new Date().toISOString(), method: 'email', status: 'failed', error: (e as any)?.message })
          trackEvent({ type: 'lead.routing.error', meta: { leadId, buyerId: buyer.id } })
        }
      } catch (e) {
        console.error('routing exception', e)
        trackEvent({ type: 'lead.routing.exception', meta: { leadId } })
      }
    })()
  }

  // Schedule drip follow-ups (fire-and-forget)
  if (!isBot) {
    try {
      const now = Date.now()
      const in24h = new Date(now + 24 * 60 * 60 * 1000).toISOString()
      const in72h = new Date(now + 72 * 60 * 60 * 1000).toISOString()
      enqueue({ id: genId('drip'), leadId, runAt: in24h, template: 'follow_24h' })
      enqueue({ id: genId('drip'), leadId, runAt: in72h, template: 'follow_72h' })
    } catch (e) { console.error('enqueue drip failed', e) }
  }

    // Professional email template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #ffffff; }
        .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; }
        .field-label { font-weight: bold; color: #1e293b; margin-bottom: 5px; }
        .field-value { color: #475569; }
        .message-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; }
        .logo { font-size: 24px; font-weight: bold; }
        .badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎨 WILDROSE PAINTERS</div>
          <p style="margin: 10px 0 0 0;">New Quote Request</p>
          <span class="badge">HIGH PRIORITY</span>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-bottom: 30px;">New Customer Inquiry</h2>
          
          <div class="field">
            <div class="field-label">👤 Customer Name:</div>
            <div class="field-value">${name}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📧 Email Address:</div>
            <div class="field-value">${email}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📱 Phone Number:</div>
            <div class="field-value">${phone}</div>
          </div>
          
          <div class="field">
            <div class="field-label">🎨 Service Requested:</div>
            <div class="field-value">${service}</div>
          </div>
          
          <div class="message-box">
            <div class="field-label">📝 Project Details:</div>
            <div class="field-value" style="white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">⚡ Quick Actions:</h3>
            <p style="margin: 5px 0; color: #1e40af;">
              📞 Call: <a href="tel:${phone}" style="color: #2563eb;">${phone}</a><br>
              📧 Email: <a href="mailto:${email}" style="color: #2563eb;">${email}</a><br>
              💼 Recommended response time: Within 1 hour for best conversion
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>🌐 Sent from wildrosepainters.ca contact form</p>
          <p>⏰ ${new Date().toLocaleString('en-US', { 
            timeZone: 'America/Edmonton',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} (Edmonton Time)</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Send email
  const companyName = env.COMPANY_NAME
  const companyPhone = env.COMPANY_PHONE
  const companyDomain = env.COMPANY_DOMAIN
  const contactTo = env.CONTACT_FORM_TO || env.SMTP_EMAIL

    if (!isBot) {
      await transporter.sendMail({
        from: `"${companyName} Website" <${env.SMTP_EMAIL}>`,
        to: contactTo,
  subject: `🎨 New Quote Request from ${name} - ${companyName}`,
  html: htmlTemplate + `<pre style=\"font-size:12px;color:#64748b;margin-top:16px;\">Raw Message Preview:\n${message}${attachmentNote}\n\nScore: ${normalizedScore} (raw ${rawScore})\nUrgency: ${urgency || '-'} | Budget: ${budgetBand || '-'} | Addons: ${addons.join(', ') || '-'}\nUTM: ${utm ? JSON.stringify(utm) : '-'}\n</pre>`,
        replyTo: email,
        headers: {
          'X-Company-Domain': companyDomain,
          'X-Source': 'contact-form'
        },
        attachments: safeAttachments
      })
    }

    // Optional: Send auto-reply to customer
    if (!isBot) {
      await transporter.sendMail({
        from: `"${companyName}" <${env.SMTP_EMAIL}>`,
        to: email,
        subject: `Thank you for your quote request - ${companyName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>🎨 Thank You!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hi ${name},</p>
            <p>We received your quote request for <strong>${service}</strong>. Our team will review the details and contact you within 24 hours.</p>
            <p><strong>Summary:</strong></p>
            <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:6px;font-size:12px;">${message}${attachmentNote}</pre>
            <p>Questions? Call us at <strong>${companyPhone}</strong> or just reply to this email.</p>
            <p>Best regards,<br>${companyName} Team</p>
            <p style="font-size:12px;color:#64748b;">Sent from ${companyDomain}</p>
          </div>
        </div>
        `,
      })
    }

    // Fire-and-forget CRM push & logging
    if (!isBot) {
      ;(async () => {
        const crmResult = await dispatchLeadToCRM({
          name,
          email,
          phone,
          service,
          message: message + attachmentNote,
          brand: businessProfile.internalBrandKey
        }).catch(() => ({ ok: false, provider: 'unknown', skipped: true, reason: 'dispatch error' }))

        const ua = request.headers.get('user-agent') || ''
        logLead({ name, email, phone, service, message: message + attachmentNote, brand: businessProfile.internalBrandKey }, crmResult as any, { ip, ua })
        trackEvent({ type: 'lead.crm_dispatch', meta: { provider: crmResult.provider, ok: crmResult.ok, skipped: crmResult.skipped, score: normalizedScore } })
      })()
    } else {
      trackEvent({ type: 'lead.bot_caught' })
    }

  trackEvent({ type: 'lead.submitted', meta: { service, hasPhotos: !!safeAttachments.length, urgency, budgetBand, addonsCount: addons.length, score: normalizedScore, leadId, consentShare: !!consentShare, duplicateRecent } })
    return NextResponse.json({
      success: true,
      message: isBot ? 'Thank you' : 'Quote request sent successfully'
    })

  } catch (error) {
    console.error('Contact form error:', error)
    trackEvent({ type: 'lead.error', meta: { message: (error as any)?.message || 'unknown' } })
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}