import { NextRequest, NextResponse } from 'next/server'
import { adjustBuyerCredit, getBuyer } from '@/lib/buyers/store'
import { recordFunding } from '@/lib/billing/transactions'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const buyer = getBuyer(params.id)
  if (!buyer) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const amountCents = Math.trunc(Number(body.amountCents))
  if (!amountCents || amountCents <= 0) return NextResponse.json({ error: 'amountCents must be > 0' }, { status: 400 })
  const updated = adjustBuyerCredit(buyer.id, amountCents)
  if (updated) recordFunding(buyer.id, amountCents, updated.creditCents, { note: body.note })
  return NextResponse.json({ buyer: updated })
}
