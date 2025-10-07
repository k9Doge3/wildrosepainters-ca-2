import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { aggregateProgressAllEmployees, progressSummaryForEmployee } from '@/lib/hrm/course-store'

export async function GET(req: NextRequest) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const employeeId = url.searchParams.get('employeeId')
  if (employeeId) {
    if (employeeId !== session.sub && !roleSatisfies(session.role, 'admin')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    return NextResponse.json({ summary: progressSummaryForEmployee(employeeId) })
  }
  if (!roleSatisfies(session.role, 'admin')) {
    return NextResponse.json({ summary: progressSummaryForEmployee(session.sub) })
  }
  return NextResponse.json({ summaries: aggregateProgressAllEmployees() })
}
