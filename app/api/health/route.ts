import { NextResponse } from 'next/server'
import { redisEnabled, getRedis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function GET() {
  let redisStatus: 'ok' | 'disabled' | 'error' = 'disabled'
  let pingLatencyMs: number | undefined
  if (redisEnabled()) {
    try {
      const start = Date.now()
      const r = getRedis()
      await r.ping()
      pingLatencyMs = Date.now() - start
      redisStatus = 'ok'
    } catch (e) {
      console.error('health redis error', e)
      redisStatus = 'error'
    }
  }

  // Optionally expose commit hash if provided by Vercel (set it as env var in build settings)
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  const env = process.env.VERCEL_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development')

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    env,
    commit,
    redis: redisStatus,
    redisPingMs: pingLatencyMs,
    storeDriver: process.env.STORE_DRIVER || 'file',
    nodeVersion: process.version,
  })
}
