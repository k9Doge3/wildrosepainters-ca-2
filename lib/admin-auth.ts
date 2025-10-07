import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET not set')
  return secret
}

export interface SessionPayload {
  iat: number // issued at (epoch seconds)
  exp: number // expiry (epoch seconds)
  v: number  // version for future invalidation
}

export function signSession(payload: SessionPayload) {
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json).toString('base64url')
  const hmac = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url')
  return `${b64}.${hmac}`
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [b64, sig] = parts
  const expected = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString()) as SessionPayload
    if (payload.exp < Math.floor(Date.now()/1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function createSessionCookie() {
  const now = Math.floor(Date.now()/1000)
  const payload: SessionPayload = { iat: now, exp: now + SESSION_TTL_SECONDS, v: 1 }
  const token = signSession(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export async function destroySessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return verifySession(token)
}
