import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { getCourse, findActiveEnrollment, completeModule, markEnrollmentComplete } from '@/lib/hrm/course-store'

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const course = getCourse(ctx.params.id)
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const moduleId = body.moduleId ? String(body.moduleId) : null
  // Enrollment must belong to employee unless admin
  const enrollment = findActiveEnrollment(session.sub, course.id)
  if (!enrollment && !roleSatisfies(session.role, 'admin')) {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 400 })
  }
  try {
    if (moduleId) {
      const { enrollment: updatedEnrollment, completion } = completeModule(enrollment!.id, moduleId)
      return NextResponse.json({ enrollment: updatedEnrollment, completion })
    } else {
      const updated = markEnrollmentComplete(enrollment!.id)
      return NextResponse.json({ enrollment: updated })
    }
  } catch (e:any) {
    const msg = e?.message
    if (msg === 'module_not_found') return NextResponse.json({ error: 'module_not_found' }, { status: 404 })
    if (msg === 'enrollment_not_found') return NextResponse.json({ error: 'enrollment_not_found' }, { status: 404 })
    return NextResponse.json({ error: 'server_error', message: msg }, { status: 500 })
  }
}
