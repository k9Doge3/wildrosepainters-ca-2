import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { listEnrollments } from '@/lib/hrm/course-store'

export async function GET(req: NextRequest) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const employeeId = url.searchParams.get('employeeId')
  const courseId = url.searchParams.get('courseId')
  // Non-admin can only see own enrollments regardless of query
  const filterEmployee = roleSatisfies(session.role, 'admin') && employeeId ? employeeId : session.sub
  const enrollments = listEnrollments({ employeeId: filterEmployee, courseId: courseId || undefined })
  return NextResponse.json({ enrollments })
}
