import { createMemoryStore } from './memory'
import { createRedisStore } from './redis'
import type { LeadStore } from './types'

let storeInstance: LeadStore | null = null

export function getLeadStore(): LeadStore {
  if (storeInstance) return storeInstance
  const driver = (process.env.STORE_DRIVER || '').toLowerCase()
  if (driver === 'redis') {
    try {
      storeInstance = createRedisStore()
      return storeInstance
    } catch {
      // fall through to memory
    }
  }
  storeInstance = createMemoryStore()
  return storeInstance
}
