import { NextResponse } from 'next/server'
import { destroySessionCookie } from '@/lib/admin-auth'

export async function POST() {
  await destroySessionCookie()
  return NextResponse.redirect(new URL('/wildrosepainters/adminlogin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
