import { NextRequest, NextResponse } from 'next/server'
import { listBilling } from '@/lib/billing/transactions'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
  const buyerId = searchParams.get('buyerId') || undefined
  return NextResponse.json({ transactions: listBilling(limit, buyerId) })
}
