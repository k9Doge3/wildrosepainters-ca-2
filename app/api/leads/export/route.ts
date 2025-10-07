import { NextRequest, NextResponse } from 'next/server'
import { listLeads } from '@/lib/leads/store'

function auth(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  return key && key === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ? Date.parse(searchParams.get('from')!) : null
  const to = searchParams.get('to') ? Date.parse(searchParams.get('to')!) : null
  const serviceFilter = searchParams.get('service')?.toLowerCase()
  let leads = listLeads()
  if (from) leads = leads.filter(l => Date.parse(l.createdAt) >= from)
  if (to) leads = leads.filter(l => Date.parse(l.createdAt) <= to)
  if (serviceFilter) leads = leads.filter(l => l.service.toLowerCase() === serviceFilter)
  const headers = [
    'id','createdAt','name','email','phone','service','urgency','budgetBand','addons','photos','rawScore','normalizedScore','status','consentShare','duplicateRecent'
  ]
  const lines = [headers.join(',')]
  for (const l of leads) {
    const row = [
      l.id,
      l.createdAt,
      escapeCsv(l.name),
      l.email,
      l.phone,
      escapeCsv(l.service),
      l.urgency || '',
      l.budgetBand || '',
      (l.addons || []).join('|'),
      String(l.photos || 0),
      String(l.rawScore),
      String(l.normalizedScore),
      l.status,
      String(!!l.consentShare),
      String(!!l.duplicateRecent)
    ]
    lines.push(row.map(v => maybeQuote(v)).join(','))
  }
  const csv = lines.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.csv"`
    }
  })
}

function escapeCsv(val: string) {
  return val.replace(/"/g, '""')
}
function maybeQuote(val: string) {
  if (/[",\n]/.test(val)) return '"' + val.replace(/"/g, '""') + '"'
  return val
}