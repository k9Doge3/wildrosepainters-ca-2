import { NextResponse } from 'next/server'
import { createSessionCookie } from '@/lib/admin-auth'

const PASSWORD = process.env.ADMIN_PASSWORD || ''

// Simple in-memory attempt tracking (resets on server restart). For production consider durable store.
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
  if (!PASSWORD) return NextResponse.json({ message: 'Admin not configured' }, { status: 500 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (!rateLimit(ip)) {
    return NextResponse.json({ message: 'Too many attempts. Try later.' }, { status: 429 })
  }
  const { password } = await req.json().catch(()=>({}))
  if (!password || password !== PASSWORD) {
    await new Promise(r=>setTimeout(r, 500)) // slow brute force
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }
  try {
    await createSessionCookie()
  } catch (e: any) {
    return NextResponse.json({ message: 'Session creation failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
