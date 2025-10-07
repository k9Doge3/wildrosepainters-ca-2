import { NextRequest, NextResponse } from 'next/server'
import { listBuyers, createBuyer } from '@/lib/buyers/store'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ buyers: listBuyers() })
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const buyer = createBuyer({
    name: body.name,
    contactEmail: body.contactEmail,
    active: body.active ?? true,
    minScore: body.minScore ?? 0,
    services: body.services || [],
    postalPrefixes: body.postalPrefixes || [],
    dailyCap: body.dailyCap ?? 25,
    webhookUrl: body.webhookUrl,
    pricePerLeadCents: typeof body.pricePerLeadCents === 'number' ? body.pricePerLeadCents : 2500,
    creditCents: typeof body.creditCents === 'number' ? body.creditCents : 0
  })
  return NextResponse.json({ buyer })
}
