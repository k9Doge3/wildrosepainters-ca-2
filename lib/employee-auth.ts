import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { EmployeeRole } from './hrm/models'

const COOKIE_NAME = 'emp_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours

export interface EmployeeSessionPayload {
  iat: number
  exp: number
  v: number
  sub: string        // employee id
  role: EmployeeRole // role at time of issuance
}

function getSecret() {
  const secret = process.env.EMPLOYEE_SESSION_SECRET
  if (!secret) throw new Error('EMPLOYEE_SESSION_SECRET not set')
  return secret
}

export function signEmployeeSession(payload: EmployeeSessionPayload) {
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json).toString('base64url')
  const hmac = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url')
  return `${b64}.${hmac}`
}

export function verifyEmployeeSession(token: string | undefined | null): EmployeeSessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [b64, sig] = parts
  const expected = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString()) as EmployeeSessionPayload
    if (payload.exp < Math.floor(Date.now()/1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function createEmployeeSessionCookie(empId: string, role: EmployeeRole) {
  const now = Math.floor(Date.now()/1000)
  const payload: EmployeeSessionPayload = { iat: now, exp: now + SESSION_TTL_SECONDS, v: 1, sub: empId, role }
  const token = signEmployeeSession(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export async function destroyEmployeeSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

export async function getEmployeeSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return verifyEmployeeSession(token)
}

// --- Seed directory (DEV / early stage) ---
export interface SeedEmployeeRecord {
  id: string
  email: string
  // Either plain password (dev only) OR bcrypt hash (preferred). If both provided, passwordHash wins.
  password?: string
  passwordHash?: string
  firstName?: string
  lastName?: string
  role: EmployeeRole
  active: boolean
}

let seedDirectory: SeedEmployeeRecord[] | null = null

export function loadSeedEmployees(): SeedEmployeeRecord[] {
  if (seedDirectory) return seedDirectory
  const raw = process.env.EMPLOYEE_SEED_JSON
  if (!raw) { seedDirectory = []; return seedDirectory }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      seedDirectory = parsed.filter(r => r && r.id && r.email && (r.password || r.passwordHash))
    } else {
      seedDirectory = []
    }
  } catch {
    seedDirectory = []
  }
  return seedDirectory
}

export function findSeedEmployeeByEmail(email: string) {
  const list = loadSeedEmployees()
  return list.find(e => e.email.toLowerCase() === email.toLowerCase()) || null
}

// Validate a submitted password against seed record (supports bcrypt)
export async function verifySeedPassword(record: SeedEmployeeRecord, submitted: string) {
  if (record.passwordHash) {
    try {
      const bcrypt = await import('bcryptjs')
      return bcrypt.compareSync(submitted, record.passwordHash)
    } catch {
      return false
    }
  }
  if (record.password) {
    return record.password === submitted
  }
  return false
}

// Role hierarchy for RBAC
const roleRank: Record<EmployeeRole, number> = {
  employee: 1,
  supervisor: 2,
  admin: 3
}

export function roleSatisfies(actual: EmployeeRole, required: EmployeeRole) {
  return roleRank[actual] >= roleRank[required]
}

export async function requireEmployee(minRole: EmployeeRole | null = null) {
  const session = await getEmployeeSession()
  if (!session) return null
  if (minRole && !roleSatisfies(session.role, minRole)) return null
  return session
}
