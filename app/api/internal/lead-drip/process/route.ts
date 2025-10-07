import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { listPending, markSent } from '@/lib/leads/drip-queue'
import { listLeads, updateLeadStatus } from '@/lib/leads/store'
import { env } from '@/lib/env'
import { trackEvent } from '@/lib/analytics'
import { genId } from '@/lib/hrm/models'

// TODO: replace with real auth/role check. For now simple shared secret header.
function isAuthorized(req: NextRequest) {
  const secret = req.headers.get('x-internal-key')
  return !!secret && secret === process.env.INTERNAL_TASK_KEY
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const pending = listPending()
  if (!pending.length) return NextResponse.json({ processed: 0, message: 'no due events' })

  const leadsById = new Map(listLeads().map(l => [l.id, l]))

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
  })

  let sentCount = 0
  for (const ev of pending) {
    const lead = leadsById.get(ev.leadId)
    if (!lead) { markSent(ev.id); continue }

    try {
      const subject = ev.template === 'follow_24h' ? `Following up on your ${lead.service} project` : `Still interested in a quote for ${lead.service}?`
      const body = ev.template === 'follow_24h'
        ? `Hi ${lead.name},\n\nJust a quick follow-up on your ${lead.service} project inquiry. Happy to answer any questions or schedule a quick call.\n\nThanks!\n${env.COMPANY_NAME}`
        : `Hi ${lead.name},\n\nChecking back regarding your ${lead.service} project. If you're still exploring quotes we can usually get you a firm estimate fast. Just reply here and we can move forward.\n\n${env.COMPANY_NAME}`

      await transporter.sendMail({
        from: `${env.COMPANY_NAME} <${process.env.SMTP_EMAIL}>`,
        to: lead.email,
        subject,
        text: body,
        headers: { 'X-Drip-Event': ev.template }
      })

      markSent(ev.id)
      sentCount++
      trackEvent({ type: 'lead.drip_sent', meta: { template: ev.template, leadId: lead.id, score: lead.normalizedScore } })

      // Optional status bump: mark lead as contacted if still new
      if (lead.status === 'new') updateLeadStatus(lead.id, 'contacted')
    } catch (e) {
      console.error('drip send failed', ev.id, e)
      trackEvent({ type: 'lead.drip_error', meta: { id: ev.id, leadId: ev.leadId } })
    }
  }

  return NextResponse.json({ processed: pending.length, sent: sentCount })
}
