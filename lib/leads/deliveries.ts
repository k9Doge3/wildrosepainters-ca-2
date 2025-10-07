import fs from 'fs'
import path from 'path'
import { redisEnabled, getRedis } from '@/lib/redis'

export interface LeadDelivery {
  id: string
  leadId: string
  buyerId: string
  createdAt: string
  method: 'email' | 'webhook'
  status: 'sent' | 'failed'
  latencyMs?: number
  error?: string
}

const dataDir = path.join(process.cwd(), 'data')
const file = path.join(dataDir, 'lead_deliveries.jsonl')

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) }

export async function logDeliveryAsync(event: LeadDelivery) {
  if (redisEnabled()) {
    const r = getRedis()
    await r.rpush('lead_deliveries:log', JSON.stringify(event))
    return
  }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(event) + '\n')
}

export function logDelivery(event: LeadDelivery) {
  if (redisEnabled()) { logDeliveryAsync(event).catch(e => console.error('logDeliveryAsync', e)); return }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(event) + '\n')
}

export async function listDeliveriesAsync(leadId?: string): Promise<LeadDelivery[]> {
  let events: LeadDelivery[] = []
  if (redisEnabled()) {
    const r = getRedis()
    const lines = await r.lrange('lead_deliveries:log', 0, -1)
    for (const line of lines) { try { events.push(JSON.parse(line) as LeadDelivery) } catch {} }
  } else if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    for (const line of lines) { try { events.push(JSON.parse(line) as LeadDelivery) } catch {} }
  }
  if (leadId) events = events.filter(e => e.leadId === leadId)
  events.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  return events
}
