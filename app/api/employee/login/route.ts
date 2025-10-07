import { NextResponse } from 'next/server'
import { createEmployeeSessionCookie, findSeedEmployeeByEmail, verifySeedPassword } from '@/lib/employee-auth'

// Simple in-memory attempt tracking (per IP)
const attempts: Record<string, { count: number; last: number }> = {}
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_TRIES = 7

function rateLimit(key: string) {
  const now = Date.now()
  const bucket = attempts[key] || { count: 0, last: now }
  if (now - bucket.last > WINDOW_MS) {
    bucket.count = 0
    bucket.last = now
  }
  bucket.count++
  attempts[key] = bucket
  return bucket.count <= MAX_TRIES
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    if (!rateLimit(ip)) {
      return NextResponse.json({ message: 'Too many attempts. Try later.' }, { status: 429 })
    }
    const body = await req.json().catch(()=>null)
    if (!body || !body.email || !body.password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 })
    }
    const record = findSeedEmployeeByEmail(body.email)
    if (!record || !record.active || !(await verifySeedPassword(record, body.password))) {
      // uniform delay to slow enumeration
      await new Promise(r=>setTimeout(r, 500))
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    await createEmployeeSessionCookie(record.id, record.role)
    return NextResponse.json({ success: true })
  } catch (e:any) {
    return NextResponse.json({ message: 'Auth failure' }, { status: 500 })
  }
}
