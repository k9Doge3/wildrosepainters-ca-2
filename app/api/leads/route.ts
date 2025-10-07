import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeSession, roleSatisfies } from '@/lib/employee-auth'
import { listLeads } from '@/lib/leads/store'

export async function GET(req: NextRequest) {
  const session = await getEmployeeSession()
  if (!session || !roleSatisfies(session.role, 'admin')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined
  const minScore = url.searchParams.get('minScore') ? Number(url.searchParams.get('minScore')) : undefined
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined
  const leads = listLeads({ status, limit, minScore })
  return NextResponse.json({ leads })
}
