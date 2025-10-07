import { LeadLogEntry, LeadStore, StoreHealth } from './types'

const MAX_BUFFER = 500
let buffer: LeadLogEntry[] = []

export function createMemoryStore(): LeadStore {
  return {
    async saveLead(entry: LeadLogEntry) {
      buffer.unshift(entry)
      if (buffer.length > MAX_BUFFER) buffer = buffer.slice(0, MAX_BUFFER)
    },
    async listLeads(limit = 100) {
      return buffer.slice(0, limit)
    },
    async health(): Promise<StoreHealth> {
      return { driver: 'memory', ok: true }
    }
  }
}
