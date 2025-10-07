import { redirect } from 'next/navigation'
import { getEmployeeSession, loadSeedEmployees, roleSatisfies } from '@/lib/employee-auth'
import { cookies } from 'next/headers'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

// Reuse a small server-side fetch wrapper (session cookie forwarded implicitly)
async function fetchJSON(path: string) {
  const res = await fetch(path, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error('Request failed ' + res.status)
  return res.json()
}

interface ProgressSummary {
  employeeId: string
  totalEnrollments: number
  completedEnrollments: number
  completionRate: number
}

export const dynamic = 'force-dynamic'

export default async function ProgressPage() {
  const session = await getEmployeeSession()
  if (!session) redirect('/portal/login')
  const isAdmin = roleSatisfies(session.role, 'admin')
  let selfSummary: ProgressSummary | null = null
  let allSummaries: ProgressSummary[] = []
  try {
    const data = await fetchJSON('/api/hrm/progress')
    if ('summary' in data) selfSummary = data.summary
    if ('summaries' in data) {
      // Admin response: also include own summary (derive quickly)
      allSummaries = data.summaries
      const self = allSummaries.find(s => s.employeeId === session.sub)
      if (self) selfSummary = self
    }
  } catch {/* swallow for UI */}

  // Directory for friendly names
  const directory = loadSeedEmployees()
  const nameFor = (id: string) => {
    const e = directory.find(d => d.id === id)
    if (!e) return id
    return e.firstName ? `${e.firstName}${e.lastName ? ' ' + e.lastName : ''}` : (e.email || id)
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training Progress</h1>
          <p className="text-sm text-muted-foreground">Your enrollments and completion status</p>
        </div>
        <a href="/portal/courses" className="text-sm underline">Back to Courses</a>
      </header>
      <Separator/>
      {!selfSummary && (
        <p className="text-sm text-muted-foreground">No enrollments yet. Visit the courses page to enroll.</p>
      )}
      {selfSummary && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Your Summary</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Enrollments</p>
              <p className="font-medium">{selfSummary.totalEnrollments}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">{selfSummary.completedEnrollments}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completion Rate</p>
              <p className="font-medium">{selfSummary.completionRate}%</p>
            </div>
          </div>
        </section>
      )}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">All Employees</h2>
            <div className="flex gap-3 text-xs">
              <a href="/api/hrm/export/training" className="underline" target="_blank" rel="noopener noreferrer">Download Training CSV</a>
              <a href="/api/hrm/export/acks" className="underline" target="_blank" rel="noopener noreferrer">Download Acks CSV</a>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-2 font-medium">Employee</th>
                  <th className="p-2 font-medium">Enrollments</th>
                  <th className="p-2 font-medium">Completed</th>
                  <th className="p-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {allSummaries.sort((a,b) => nameFor(a.employeeId).localeCompare(nameFor(b.employeeId))).map(s => (
                  <tr key={s.employeeId} className="border-t">
                    <td className="p-2 whitespace-nowrap flex items-center gap-2">
                      <span>{nameFor(s.employeeId)}</span>
                      {s.completionRate === 100 && <Badge variant="secondary">Done</Badge>}
                    </td>
                    <td className="p-2">{s.totalEnrollments}</td>
                    <td className="p-2">{s.completedEnrollments}</td>
                    <td className="p-2">{s.completionRate}%</td>
                  </tr>
                ))}
                {allSummaries.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={4}>No enrollment data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
