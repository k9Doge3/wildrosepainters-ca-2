import fs from 'fs'
import path from 'path'
import { redisEnabled, getRedis } from '@/lib/redis'

export interface DripEvent {
  id: string
  leadId: string
  runAt: string // ISO timestamp
  template: 'follow_24h' | 'follow_72h'
  sent?: string // ISO timestamp when processed
}

const dataDir = path.join(process.cwd(), 'data')
const file = path.join(dataDir, 'lead_drip_queue.jsonl')

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) }

export async function enqueueAsync(event: DripEvent) {
  if (redisEnabled()) {
    const r = getRedis()
    await r.rpush('drip:queue', JSON.stringify(event))
    return
  }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(event) + '\n')
}

export function enqueue(event: DripEvent) {
  if (redisEnabled()) { enqueueAsync(event).catch(e => console.error('enqueueAsync', e)); return }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(event) + '\n')
}

async function readAllAsync(): Promise<DripEvent[]> {
  let arr: DripEvent[] = []
  if (redisEnabled()) {
    const r = getRedis()
    const lines = await r.lrange('drip:queue', 0, -1)
    for (const l of lines) { try { arr.push(JSON.parse(l) as DripEvent) } catch {} }
    return arr
  }
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) as DripEvent } catch { return null } }).filter(Boolean) as DripEvent[]
}

function readAll(): DripEvent[] {
  if (redisEnabled()) { console.warn('readAll sync called with redis enabled'); return [] }
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) as DripEvent } catch { return null } }).filter(Boolean) as DripEvent[]
}

export async function listPendingAsync(now = new Date()): Promise<DripEvent[]> {
  const all = await readAllAsync()
  return all.filter(e => !e.sent && new Date(e.runAt) <= now)
}

export function listPending(now = new Date()): DripEvent[] {
  const all = readAll()
  return all.filter(e => !e.sent && new Date(e.runAt) <= now)
}

export async function markSentAsync(id: string) {
  if (redisEnabled()) {
    const r = getRedis()
    const lines = await r.lrange('drip:queue', 0, -1)
    const arr: DripEvent[] = []
    for (const l of lines) { try { arr.push(JSON.parse(l) as DripEvent) } catch {} }
    const target = arr.find(e => e.id === id)
    if (!target) return
    target.sent = new Date().toISOString()
    await r.del('drip:queue')
    if (arr.length) await r.rpush('drip:queue', ...arr.map(e => JSON.stringify(e)))
    return
  }
  const all = readAll()
  const target = all.find(e => e.id === id)
  if (!target) return
  target.sent = new Date().toISOString()
  ensureDir(); fs.appendFileSync(file, JSON.stringify(target) + '\n')
}

export function markSent(id: string) {
  if (redisEnabled()) { markSentAsync(id).catch(e => console.error('markSentAsync', e)); return }
  const all = readAll()
  const target = all.find(e => e.id === id)
  if (!target) return
  target.sent = new Date().toISOString()
  ensureDir(); fs.appendFileSync(file, JSON.stringify(target) + '\n')
}
