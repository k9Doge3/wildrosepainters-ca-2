import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/admin-auth'
import { listRecentEvents } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 100
  const events = await listRecentEvents(limit)
  return NextResponse.json({ events })
}
