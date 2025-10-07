import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { enrollEmployee, getCourse } from '@/lib/hrm/course-store'

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const course = getCourse(ctx.params.id)
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  let targetEmployeeId = session.sub
  // Allow admin to enroll someone else via body { employeeId }
  if (roleSatisfies(session.role, 'admin')) {
    try {
      const body = await req.json()
      if (body.employeeId && typeof body.employeeId === 'string') targetEmployeeId = body.employeeId
    } catch {/* ignore body parse */}
  }
  try {
    const enrollment = enrollEmployee(targetEmployeeId, course.id)
    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (e:any) {
    if (e.message === 'course_not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ error: 'server_error', message: e?.message }, { status: 500 })
  }
}
