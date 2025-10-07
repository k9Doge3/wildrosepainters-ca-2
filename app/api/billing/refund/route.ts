import { NextRequest, NextResponse } from 'next/server'
import { adjustBuyerCredit, getBuyer } from '@/lib/buyers/store'
import { recordRefund } from '@/lib/billing/transactions'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const buyerId = body.buyerId
  const amountCents = Math.trunc(Number(body.amountCents))
  if (!buyerId || !amountCents || amountCents <= 0) return NextResponse.json({ error: 'buyerId & positive amountCents required' }, { status: 400 })
  const existing = getBuyer(buyerId)
  if (!existing) return NextResponse.json({ error: 'buyer not found' }, { status: 404 })
  const updated = adjustBuyerCredit(buyerId, amountCents)
  if (updated) recordRefund(buyerId, amountCents, updated.creditCents, { note: body.note, referenceLeadId: body.leadId })
  return NextResponse.json({ buyer: updated })
}