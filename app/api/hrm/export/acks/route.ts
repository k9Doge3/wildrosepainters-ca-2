import { NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { listAllAcknowledgments } from '@/lib/hrm/ack-store'

export async function GET() {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!roleSatisfies(session.role, 'admin')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const rows = listAllAcknowledgments()
  const header = ['id','employeeId','agreement','version','signedName','signedAt','ip','userAgent','pdfUrl','pdfHash']
  const lines = [header.join(',')] 
  for (const r of rows) {
    const vals = header.map(h => {
      const v = (r as any)[h]
      if (v == null) return ''
      const s = String(v).replace(/"/g,'""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    })
    lines.push(vals.join(','))
  }
  const csv = lines.join('\n') + '\n'
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contractor_acknowledgments.csv"`
    }
  })
}
