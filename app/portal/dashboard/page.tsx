import { redirect } from 'next/navigation'
import { getEmployeeSession, loadSeedEmployees } from '@/lib/employee-auth'
import { Progress } from '@/components/ui/progress'

async function fetchJSON(path: string) {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error('Request failed ' + res.status)
  return res.json()
}

async function requireEmployeeSession() {
  const session = await getEmployeeSession()
  if (!session) redirect('/portal/login')
  return session
}

export default async function PortalDashboardPage() {
  const session = await requireEmployeeSession()
  const directory = loadSeedEmployees()
  const emp = directory.find(e => e.id === session.sub)
  // Fetch enrollments & related courses for roll-up
  let enrollments: any[] = []
  let courses: any[] = []
  try {
    const enr = await fetchJSON('/api/hrm/enrollments')
    enrollments = enr.enrollments || []
  } catch {}
  try {
    const crs = await fetchJSON('/api/hrm/courses')
    courses = crs.courses || []
  } catch {}
  const courseFor = (id: string) => courses.find((c: any) => c.id === id)
  const enriched = enrollments.map(e => {
    const c = courseFor(e.courseId)
    const totalModules = (c?.modules?.length) || 0
    const completedModules = totalModules === 0 ? 0 : (e.completedAt ? totalModules : (e.moduleCompletions?.length || 0))
    const percent = totalModules === 0 ? 0 : Math.round((completedModules/totalModules)*100)
    return { enrollment: e, course: c, percent, completedModules, totalModules }
  })
  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contractor Portal</h1>
            <p className="text-muted-foreground">Welcome{emp ? `, ${emp.firstName || emp.email}` : ''}.</p>
          </div>
          <form action="/api/employee/logout" method="post">
            <button className="text-sm underline text-red-600 hover:text-red-500" type="submit">Logout</button>
          </form>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Training</h2>
              {enriched.length === 0 && <p className="text-sm">No enrollments yet. <a className="underline" href="/portal/courses">Browse courses</a>.</p>}
            </div>
            <div className="space-y-4">
              {enriched.map(item => (
                <div key={item.enrollment.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <a href={`/portal/courses/${item.course?.id}`} className="text-sm font-medium hover:underline truncate" title={item.course?.title}>{item.course?.title || 'Course'}</a>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.percent}%</span>
                  </div>
                  <Progress value={item.percent} aria-label={`Progress ${item.percent}% for ${item.course?.title || 'course'}`} role="progressbar" aria-valuenow={item.percent} aria-valuemin={0} aria-valuemax={100} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{item.completedModules}/{item.totalModules} modules</span>
                    {item.enrollment.completedAt && <span className="text-green-600">Completed</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Policies</h2>
            <p className="text-sm">Policy acknowledgments will appear here.</p>
          </div>
        </section>
        {session.role === 'admin' && (
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Admin View</h2>
            <p className="text-sm">You have elevated privileges. Future admin HRM console controls will be visible here.</p>
          </section>
        )}
      </div>
    </main>
  )
}
