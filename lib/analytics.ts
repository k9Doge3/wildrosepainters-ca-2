// Lightweight analytics event stub (hybrid: Redis if available, memory fallback)
// Purpose: non-blocking capture of key funnel + operational events.

export interface AnalyticsEvent {
  ts: string
  type: string
  meta?: Record<string, any>
}

const KEY = 'analytics:events'
const MAX_EVENTS = Number(process.env.ANALYTICS_MAX || 1000)
let memoryBuffer: AnalyticsEvent[] = []

let redisClient: any | null = null
function getRedis() {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN
  if (!url || !token) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis')
    redisClient = new Redis({ url, token })
    return redisClient
  } catch {
    return null
  }
}

export async function trackEvent(input: { type: string; meta?: Record<string, any> }) {
  const ev: AnalyticsEvent = { ts: new Date().toISOString(), type: input.type, meta: input.meta }
  // Memory first (always succeed)
  memoryBuffer.unshift(ev)
  if (memoryBuffer.length > MAX_EVENTS) memoryBuffer = memoryBuffer.slice(0, MAX_EVENTS)
  // Attempt Redis (non-blocking failure)
  try {
    const r = getRedis()
    if (r) {
      await r.lpush(KEY, JSON.stringify(ev))
      await r.ltrim(KEY, 0, MAX_EVENTS - 1)
    }
  } catch {
    // ignore
  }
}

export async function listRecentEvents(limit = 100): Promise<AnalyticsEvent[]> {
  const lim = Math.min(limit, MAX_EVENTS)
  const r = getRedis()
  if (!r) return memoryBuffer.slice(0, lim)
  try {
    const raw: string[] = await r.lrange(KEY, 0, lim - 1)
    return raw.map(s => { try { return JSON.parse(s) as AnalyticsEvent } catch { return null } }).filter(Boolean) as AnalyticsEvent[]
  } catch {
    return memoryBuffer.slice(0, lim)
  }
}
