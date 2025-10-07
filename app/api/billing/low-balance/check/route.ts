import { NextRequest, NextResponse } from 'next/server'
import { listBuyers, updateBuyer } from '@/lib/buyers/store'
import nodemailer from 'nodemailer'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const buyers = listBuyers()
  const now = Date.now()
  const alerted: string[] = []
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
  })
  for (const b of buyers) {
    const threshold = b.lowBalanceThresholdCents ?? 5000
    if (b.creditCents <= threshold) {
      const last = b.lastLowBalanceAlertAt ? new Date(b.lastLowBalanceAlertAt).getTime() : 0
      if (now - last > 24 * 60 * 60 * 1000) {
        alerted.push(b.id)
        // fire and forget email
        ;(async () => {
          try {
            await transporter.sendMail({
              from: `Billing Alerts <${process.env.SMTP_EMAIL}>`,
              to: b.contactEmail,
              subject: `Low Balance: $${(b.creditCents/100).toFixed(2)} remaining`,
              text: `Hi ${b.name},\n\nYour prepaid balance is low ($${(b.creditCents/100).toFixed(2)}). Please top up to avoid lead pauses.\nThreshold: $${(threshold/100).toFixed(2)}\n\nThanks`,
            })
            if (process.env.CONTACT_FORM_TO) {
              await transporter.sendMail({
                from: `Billing Alerts <${process.env.SMTP_EMAIL}>`,
                to: process.env.CONTACT_FORM_TO,
                subject: `Buyer Low Balance: ${b.name} $${(b.creditCents/100).toFixed(2)}`,
                text: `Buyer ${b.name} (id ${b.id}) balance $${(b.creditCents/100).toFixed(2)} <= threshold $${(threshold/100).toFixed(2)}`
              })
            }
          } catch (e) { console.error('low balance email failed', e) }
        })()
        updateBuyer(b.id, { lastLowBalanceAlertAt: new Date().toISOString() })
      }
    }
  }
  return NextResponse.json({ checked: buyers.length, alerted })
}