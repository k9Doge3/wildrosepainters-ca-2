import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis env vars missing (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)')
  }
  _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _redis
}

export function redisEnabled(): boolean {
  return process.env.STORE_DRIVER === 'redis'
}