import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeSession, roleSatisfies } from '@/lib/employee-auth'
import { updateLeadStatus } from '@/lib/leads/store'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getEmployeeSession()
  if (!session || !roleSatisfies(session.role, 'admin')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { status } = await req.json().catch(()=>({}))
  if (!status) return NextResponse.json({ error: 'missing status' }, { status: 400 })
  const updated = updateLeadStatus(params.id, status)
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ lead: updated })
}
