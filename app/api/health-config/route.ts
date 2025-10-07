import { NextResponse } from 'next/server'
import { envStatus } from '../../../lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = envStatus()
    return NextResponse.json({
      service: 'config-health',
      timestamp: new Date().toISOString(),
      env: status,
      allSet: status.every((e) => e.set),
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to generate health status', message: e?.message },
      { status: 500 }
    )
  }
}
