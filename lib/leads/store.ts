import fs from 'fs'
import path from 'path'
import { redisEnabled, getRedis } from '@/lib/redis'

export interface EnrichedLead {
  id: string
  createdAt: string
  name: string
  email: string
  phone: string
  service: string
  message: string
  urgency?: string
  budgetBand?: string
  addons?: string[]
  utm?: Record<string,string | undefined>
  photos?: number
  consentShare?: boolean
  duplicateRecent?: boolean
  rawScore: number
  normalizedScore: number
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
}

const dataDir = path.join(process.cwd(), 'data')
const leadsFile = path.join(dataDir, 'enriched_leads.jsonl')

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

export async function appendLeadAsync(lead: EnrichedLead) {
  if (redisEnabled()) {
    const r = getRedis()
    // append JSON snapshot log list
    await r.rpush('leads:log', JSON.stringify(lead))
    // store latest snapshot
    await r.hset('leads:latest', { [lead.id]: JSON.stringify(lead) })
    return
  }
  ensureDir()
  fs.appendFileSync(leadsFile, JSON.stringify(lead) + '\n')
}

// Synchronous wrapper for legacy callers
export function appendLead(lead: EnrichedLead) {
  if (redisEnabled()) {
    // Fire and forget (no await) – acceptable for current usage; consider refactor to async upstream later
    appendLeadAsync(lead).catch(err => console.error('appendLeadAsync error', err))
    return
  }
  ensureDir(); fs.appendFileSync(leadsFile, JSON.stringify(lead) + '\n')
}

export async function listLeadsAsync(opts?: { status?: string; limit?: number; minScore?: number }): Promise<EnrichedLead[]> {
  let arr: EnrichedLead[] = []
  if (redisEnabled()) {
    const r = getRedis()
    const map = await r.hgetall<Record<string,string>>('leads:latest')
    if (map) {
      arr = Object.values(map).map(v => { try { return JSON.parse(v) as EnrichedLead } catch { return null as any } }).filter(Boolean)
    }
  } else {
    if (!fs.existsSync(leadsFile)) return []
    const lines = fs.readFileSync(leadsFile, 'utf8').split('\n').filter(Boolean)
    const parsed: Record<string, EnrichedLead> = {}
    for (const line of lines) {
      try { const obj = JSON.parse(line) as EnrichedLead; parsed[obj.id] = obj } catch {/* ignore */}
    }
    arr = Object.values(parsed)
  }
  if (opts?.status) arr = arr.filter(l => l.status === opts.status)
  if (typeof opts?.minScore === 'number') arr = arr.filter(l => l.normalizedScore >= (opts.minScore as number))
  arr.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  return opts?.limit ? arr.slice(0, opts.limit) : arr
}

export function listLeads(opts?: { status?: string; limit?: number; minScore?: number }): EnrichedLead[] {
  // For existing sync callers (admin pages, etc.) – if redis enabled this becomes async unsafe; prefer migrating callers.
  if (redisEnabled()) {
    console.warn('listLeads called synchronously with redis enabled – returns stale empty list until refactored to async.')
    // Could throw instead to force refactor; returning empty for now.
    return []
  }
  if (!fs.existsSync(leadsFile)) return []
  const lines = fs.readFileSync(leadsFile, 'utf8').split('\n').filter(Boolean)
  const parsed: Record<string, EnrichedLead> = {}
  for (const line of lines) {
    try { const obj = JSON.parse(line) as EnrichedLead; parsed[obj.id] = obj } catch {/* ignore */}
  }
  let arr = Object.values(parsed)
  if (opts?.status) arr = arr.filter(l => l.status === opts.status)
  if (typeof opts?.minScore === 'number') arr = arr.filter(l => l.normalizedScore >= (opts.minScore as number))
  arr.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  return opts?.limit ? arr.slice(0, opts.limit) : arr
}

export async function updateLeadStatusAsync(id: string, status: EnrichedLead['status']) {
  if (redisEnabled()) {
    const r = getRedis()
    const raw = await r.hget<string>('leads:latest', id)
    if (!raw) return null
    const parsed = JSON.parse(raw) as EnrichedLead
    const updated: EnrichedLead = { ...parsed, status }
    await appendLeadAsync(updated)
    return updated
  }
  const all = listLeads()
  const target = all.find(l => l.id === id)
  if (!target) return null
  const updated: EnrichedLead = { ...target, status }
  appendLead(updated)
  return updated
}

export function updateLeadStatus(id: string, status: EnrichedLead['status']) {
  if (redisEnabled()) {
    console.warn('updateLeadStatus sync used with redis enabled – consider migrating to async')
    return null
  }
  const all = listLeads()
  const target = all.find(l => l.id === id)
  if (!target) return null
  const updated: EnrichedLead = { ...target, status }
  appendLead(updated)
  return updated
}

export function saveLeadOverwrite(lead: EnrichedLead) { appendLead(lead) }
