import { LeadLogEntry, LeadStore, StoreHealth } from './types'

// Using Upstash Redis (REST) if env vars provided
// We lazy import to avoid build error if dependency missing before install
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
  } catch (e) {
    return null
  }
}

const LIST_KEY = 'leads:recent'
const MAX_LENGTH = Number(process.env.LEADS_LIST_MAX || 500)

export function createRedisStore(): LeadStore {
  return {
    async saveLead(entry: LeadLogEntry) {
      const client = getRedis()
      if (!client) throw new Error('redis not configured')
      await client.lpush(LIST_KEY, JSON.stringify(entry))
      // Trim list to cap size
      await client.ltrim(LIST_KEY, 0, MAX_LENGTH - 1)
    },
    async listLeads(limit = 100) {
      const client = getRedis()
      if (!client) throw new Error('redis not configured')
      const items: string[] = await client.lrange(LIST_KEY, 0, limit - 1)
      return items.map(i => {
        try { return JSON.parse(i) as LeadLogEntry } catch { return null }
      }).filter(Boolean) as LeadLogEntry[]
    },
    async health(): Promise<StoreHealth> {
      const client = getRedis()
      if (!client) return { driver: 'redis', ok: false, message: 'not configured' }
      try {
        await client.ping()
        return { driver: 'redis', ok: true }
      } catch (e: any) {
        return { driver: 'redis', ok: false, message: e?.message || 'ping failed' }
      }
    }
  }
}
