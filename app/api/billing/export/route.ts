import { NextRequest, NextResponse } from 'next/server'
import { listBilling } from '@/lib/billing/transactions'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ? Date.parse(searchParams.get('from')!) : null
  const to = searchParams.get('to') ? Date.parse(searchParams.get('to')!) : null
  const buyerId = searchParams.get('buyerId') || undefined
  let txs = listBilling(undefined, buyerId)
  if (from) txs = txs.filter(t => Date.parse(t.createdAt) >= from)
  if (to) txs = txs.filter(t => Date.parse(t.createdAt) <= to)
  const headers = ['id','createdAt','buyerId','type','amountCents','balanceAfterCents','meta']
  const lines = [headers.join(',')]
  for (const t of txs) {
    const row = [
      t.id,
      t.createdAt,
      t.buyerId,
      t.type,
      String(t.amountCents),
      String(t.balanceAfterCents),
      JSON.stringify(t.meta || {})
    ]
    lines.push(row.map(v => maybeQuote(v)).join(','))
  }
  const csv = lines.join('\n')
  return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="billing_${Date.now()}.csv"` } })
}

function maybeQuote(val: string) {
  if (/[",\n]/.test(val)) return '"' + val.replace(/"/g, '""') + '"'
  return val
}