import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeSession, roleSatisfies } from '@/lib/employee-auth'
import { listLeads } from '@/lib/leads/store'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getEmployeeSession()
  if (!session || !roleSatisfies(session.role, 'admin')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const lead = listLeads().find(l => l.id === params.id)
  if (!lead) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const draft = `Hi ${lead.name?.split(' ')[0] || 'there'},\n\nThanks for reaching out about your ${lead.service || 'painting'} project. Based on what you shared${lead.urgency ? ` and the ${lead.urgency} timeline` : ''}${lead.budgetBand ? ` (budget range: ${lead.budgetBand})` : ''}, we'd love to schedule a quick call to firm up scope and provide a detailed quote.\n\nAre you available later today or tomorrow? Feel free to reply with a couple time windows.\n\nBest,\nWildrose Painters`
  return NextResponse.json({ draft })
}
