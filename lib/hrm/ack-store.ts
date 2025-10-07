import fs from 'fs'
import path from 'path'
import { getEmployeeSession } from '@/lib/employee-auth'

export interface AgreementAckRecord {
  id: string
  employeeId: string
  agreement: 'contractor-agreement'
  version: string
  signedName: string
  signedAt: string
  ip: string
  userAgent?: string
  pdfUrl: string
  pdfHash?: string
}

// Simple in-memory index keyed by employeeId -> latest version ack'd
const latestByEmployee: Map<string, AgreementAckRecord> = new Map()
const ALL: AgreementAckRecord[] = []
const filePath = path.join(process.cwd(), 'data', 'contractor_agreement_acks.jsonl')

function ensureDir() {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function appendRecord(rec: AgreementAckRecord) {
  ensureDir()
  fs.appendFileSync(filePath, JSON.stringify(rec) + '\n')
}

export function loadExistingAcks() {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)
  for (const line of lines) {
    try {
      const rec = JSON.parse(line) as AgreementAckRecord
      ALL.push(rec)
      const existing = latestByEmployee.get(rec.employeeId)
      if (!existing || existing.signedAt < rec.signedAt) latestByEmployee.set(rec.employeeId, rec)
    } catch {
      // skip malformed
    }
  }
}

let loaded = false
function ensureLoaded() { if (!loaded) { loadExistingAcks(); loaded = true } }

export function getLatestAckForEmployee(empId: string) {
  ensureLoaded()
  return latestByEmployee.get(empId) || null
}

// For compliance export: returns all acknowledgment records (append-only history)
export function listAllAcknowledgments(): AgreementAckRecord[] {
  ensureLoaded()
  return [...ALL]
}

export async function recordAck(opts: { employeeId: string; version: string; signedName: string; ip: string; userAgent?: string; pdfUrl: string; pdfHash?: string }) {
  ensureLoaded()
  const rec: AgreementAckRecord = {
    id: `ack_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    agreement: 'contractor-agreement',
    employeeId: opts.employeeId,
    version: opts.version,
    signedName: opts.signedName,
    ip: opts.ip,
    userAgent: opts.userAgent,
    signedAt: new Date().toISOString(),
    pdfUrl: opts.pdfUrl,
    pdfHash: opts.pdfHash
  }
  ALL.push(rec)
  latestByEmployee.set(rec.employeeId, rec)
  appendRecord(rec)
  return rec
}

export async function requireEmployeeId() {
  const session = await getEmployeeSession()
  if (!session) return null
  return session.sub
}
