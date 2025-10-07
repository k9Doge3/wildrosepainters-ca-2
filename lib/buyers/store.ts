import fs from 'fs'
import path from 'path'
import { genId } from '@/lib/hrm/models'
import { redisEnabled, getRedis } from '@/lib/redis'

export interface Buyer {
  id: string
  name: string
  contactEmail: string
  active: boolean
  minScore: number
  services: string[] // e.g. ['fence','deck','interior']
  postalPrefixes: string[] // e.g. ['T5A','T5B'] partial match (startsWith)
  dailyCap: number
  deliveredToday: number
  lastDeliveryDate?: string // for resetting counters
  webhookUrl?: string
  // Monetization fields
  pricePerLeadCents: number // charged per exclusive delivered lead
  creditCents: number // remaining pre-paid balance
  lowBalanceThresholdCents?: number // alert if credit <= threshold
  lastLowBalanceAlertAt?: string // ISO timestamp of last alert (24h guard)
  createdAt: string
  updatedAt: string
}

const dataDir = path.join(process.cwd(), 'data')
const buyersFile = path.join(dataDir, 'buyers.jsonl')

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) }

async function readAllAsync(): Promise<Record<string, Buyer>> {
  if (redisEnabled()) {
    const r = getRedis()
    const raw = await r.hgetall<Record<string,string>>('buyers:latest')
    const map: Record<string, Buyer> = {}
    if (raw) {
      for (const [k,v] of Object.entries(raw)) {
        try { map[k] = JSON.parse(v) as Buyer } catch {/*ignore*/}
      }
    }
    return map
  }
  if (!fs.existsSync(buyersFile)) return {}
  const lines = fs.readFileSync(buyersFile, 'utf8').split('\n').filter(Boolean)
  const map: Record<string, Buyer> = {}
  for (const line of lines) { try { const b = JSON.parse(line) as Buyer; map[b.id] = b } catch { } }
  return map
}

function readAllSync(): Record<string, Buyer> {
  if (!fs.existsSync(buyersFile)) return {}
  const lines = fs.readFileSync(buyersFile, 'utf8').split('\n').filter(Boolean)
  const map: Record<string, Buyer> = {}
  for (const line of lines) { try { const b = JSON.parse(line) as Buyer; map[b.id] = b } catch { } }
  return map
}

async function writeSnapshotAsync(b: Buyer) {
  if (redisEnabled()) {
    const r = getRedis()
    await r.rpush('buyers:log', JSON.stringify(b))
    await r.hset('buyers:latest', { [b.id]: JSON.stringify(b) })
    return
  }
  ensureDir(); fs.appendFileSync(buyersFile, JSON.stringify(b) + '\n')
}

function writeSnapshot(b: Buyer) {
  if (redisEnabled()) { writeSnapshotAsync(b).catch(err => console.error('writeSnapshotAsync buyer', err)); return }
  ensureDir(); fs.appendFileSync(buyersFile, JSON.stringify(b) + '\n')
}

export function listBuyers(): Buyer[] {
  if (redisEnabled()) {
    console.warn('listBuyers sync with redis enabled – returns empty array (migrate to async).')
    return []
  }
  return Object.values(readAllSync()).sort((a,b) => a.name.localeCompare(b.name))
}

export async function listBuyersAsync(): Promise<Buyer[]> {
  const map = await readAllAsync()
  return Object.values(map).sort((a,b) => a.name.localeCompare(b.name))
}

export function getBuyer(id: string): Buyer | undefined { return redisEnabled() ? undefined : readAllSync()[id] }
export async function getBuyerAsync(id: string): Promise<Buyer | undefined> { const map = await readAllAsync(); return map[id] }

export function createBuyer(input: Omit<Buyer,'id'|'createdAt'|'updatedAt'|'deliveredToday'|'lastDeliveryDate'>): Buyer {
  const now = new Date().toISOString()
  const buyer: Buyer = { 
    id: genId('buyer'), 
    deliveredToday: 0, 
    lastDeliveryDate: undefined, 
    createdAt: now, 
    updatedAt: now,
    ...input,
    pricePerLeadCents: (input as any).pricePerLeadCents ?? 2500, // $25 default
    creditCents: (input as any).creditCents ?? 0,
    lowBalanceThresholdCents: (input as any).lowBalanceThresholdCents ?? 5000, // default alert at $50
    lastLowBalanceAlertAt: undefined,
  }
  writeSnapshot(buyer)
  return buyer
}

export function updateBuyer(id: string, patch: Partial<Omit<Buyer,'id'|'createdAt'|'deliveredToday'>>): Buyer | null {
  const existing = getBuyer(id)
  if (!existing) return null
  const now = new Date().toISOString()
  const updated: Buyer = { 
    ...existing, 
    ...patch, 
    // ensure required monetization fields present even for legacy rows
  pricePerLeadCents: typeof (patch as any).pricePerLeadCents === 'number' ? (patch as any).pricePerLeadCents : (existing.pricePerLeadCents ?? 2500),
  creditCents: typeof (patch as any).creditCents === 'number' ? (patch as any).creditCents : (existing.creditCents ?? 0),
  lowBalanceThresholdCents: typeof (patch as any).lowBalanceThresholdCents === 'number' ? (patch as any).lowBalanceThresholdCents : (existing.lowBalanceThresholdCents ?? 5000),
  lastLowBalanceAlertAt: (patch as any).lastLowBalanceAlertAt ?? existing.lastLowBalanceAlertAt,
    updatedAt: now 
  }
  writeSnapshot(updated)
  return updated
}

export function incrementDelivery(id: string): Buyer | null {
  const existing = getBuyer(id)
  if (!existing) return null
  const today = new Date().toISOString().slice(0,10)
  let deliveredToday = existing.deliveredToday
  if (existing.lastDeliveryDate !== today) deliveredToday = 0
  deliveredToday += 1
  const updated = { ...existing, deliveredToday, lastDeliveryDate: today, updatedAt: new Date().toISOString() }
  writeSnapshot(updated)
  return updated
}

export function adjustBuyerCredit(id: string, deltaCents: number): Buyer | null {
  const existing = getBuyer(id)
  if (!existing) return null
  const newCredit = (existing.creditCents ?? 0) + deltaCents
  const updated: Buyer = { ...existing, creditCents: newCredit, updatedAt: new Date().toISOString(), pricePerLeadCents: existing.pricePerLeadCents ?? 2500 }
  writeSnapshot(updated)
  return updated
}
