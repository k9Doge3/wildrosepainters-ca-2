import { NextRequest, NextResponse } from 'next/server'
import { updateBuyer, getBuyer } from '@/lib/buyers/store'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const existing = getBuyer(params.id)
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = await req.json()
  const updated = updateBuyer(params.id, body)
  return NextResponse.json({ buyer: updated })
}
