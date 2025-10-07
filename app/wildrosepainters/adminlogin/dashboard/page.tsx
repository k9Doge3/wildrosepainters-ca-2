import { Suspense } from 'react'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/admin-auth'

async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/wildrosepainters/adminlogin')
}

export default async function AdminDashboardPage() {
  await requireAuth()
  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Internal overview (scaffold)</p>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="text-sm underline text-red-600 hover:text-red-500" type="submit">Logout</button>
          </form>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Leads (preview)</h2>
            <Suspense fallback={<p className="text-sm">Loading...</p>}>
              <LeadsTable />
            </Suspense>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Reviews</h2>
            <p className="text-sm">Coming soon: manage displayed reviews.</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">System</h2>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Session cookie check only (needs hardening)</li>
              <li>Add HMAC + expiry token</li>
              <li>Protect API routes with same verification</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
