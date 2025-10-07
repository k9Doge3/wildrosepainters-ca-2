import { NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { listEnrollments, listCourses, listCompletions } from '@/lib/hrm/course-store'

export async function GET() {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!roleSatisfies(session.role, 'admin')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const courses = listCourses().reduce<Record<string,string>>((acc,c)=>{acc[c.id]=c.title; return acc}, {})
  const enrollments = listEnrollments()
  const header = ['enrollmentId','employeeId','courseId','courseTitle','assignedAt','completedAt','progress','versionAtEnrollment','moduleCompletions']
  const lines = [header.join(',')]
  for (const e of enrollments) {
    const completions = listCompletions(e.id).sort((a,b)=>a.completedAt.localeCompare(b.completedAt))
    // Serialize module completions as moduleId:timestamp;moduleId:timestamp
    const mc = completions.map(c => `${c.moduleId}:${c.completedAt}`).join(';')
    const row = [
      e.id,
      e.employeeId,
      e.courseId,
      courses[e.courseId] || '',
      e.assignedAt,
      e.completedAt || '',
      String(e.progress),
      String(e.versionAtEnrollment),
      mc
    ].map(v => {
      const s = String(v).replace(/"/g,'""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    })
    lines.push(row.join(','))
  }
  const csv = lines.join('\n') + '\n'
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="training_progress.csv"'
    }
  })
}
