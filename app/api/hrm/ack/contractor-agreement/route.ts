import { NextResponse } from 'next/server'
import { getLatestAckForEmployee, requireEmployeeId } from '@/lib/hrm/ack-store'

function getEnvConfig() {
  return {
    version: process.env.CONTRACTOR_AGREEMENT_VERSION || 'unset',
    pdfUrl: process.env.CONTRACTOR_AGREEMENT_URL || '',
    pdfHash: process.env.CONTRACTOR_AGREEMENT_PDF_SHA256 || ''
  }
}

export async function GET() {
  const empId = await requireEmployeeId()
  if (!empId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const cfg = getEnvConfig()
  const latest = getLatestAckForEmployee(empId)
  const acknowledged = !!latest && latest.version === cfg.version
  return NextResponse.json({ acknowledged, latest, config: cfg })
}

// Signing handled via POST below (same route) for clarity
export async function POST(req: Request) {
  const { recordAck, getLatestAckForEmployee } = await import('@/lib/hrm/ack-store')
  const empId = await requireEmployeeId()
  if (!empId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const cfg = getEnvConfig()
  if (!cfg.pdfUrl || cfg.version === 'unset') {
    return NextResponse.json({ message: 'Agreement not configured' }, { status: 500 })
  }
  const body = await req.json().catch(()=>null)
  if (!body || !body.signedName || typeof body.signedName !== 'string') {
    return NextResponse.json({ message: 'signedName required' }, { status: 400 })
  }
  const latest = getLatestAckForEmployee(empId)
  if (latest && latest.version === cfg.version) {
    return NextResponse.json({ message: 'Already acknowledged current version' }, { status: 409 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const ua = req.headers.get('user-agent') || ''
  const rec = await recordAck({ employeeId: empId, version: cfg.version, signedName: body.signedName.trim(), ip, userAgent: ua, pdfUrl: cfg.pdfUrl, pdfHash: cfg.pdfHash })
  return NextResponse.json({ success: true, record: rec })
}
