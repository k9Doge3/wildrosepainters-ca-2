import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { getEnrollment, listCompletions } from '@/lib/hrm/course-store'

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const enrollment = getEnrollment(ctx.params.id)
  if (!enrollment) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (enrollment.employeeId !== session.sub && !roleSatisfies(session.role, 'admin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const completions = listCompletions(enrollment.id)
  return NextResponse.json({ completions })
}
