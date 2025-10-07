import { NextResponse } from 'next/server'
import { destroyEmployeeSessionCookie } from '@/lib/employee-auth'

export async function POST() {
  await destroyEmployeeSessionCookie()
  return NextResponse.redirect(new URL('/portal/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
