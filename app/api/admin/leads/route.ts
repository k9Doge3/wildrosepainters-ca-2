import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/admin-auth'
import { listStoredLeads } from '@/lib/logging/lead-logger'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(500, Math.max(1, limitParam ? parseInt(limitParam, 10) : 100))
  const leads = await listStoredLeads(limit)
  return NextResponse.json({ leads })
}
