import fs from 'fs'
import path from 'path'
import { genId } from '@/lib/hrm/models'
import { redisEnabled, getRedis } from '@/lib/redis'

export interface BillingTransaction {
  id: string
  createdAt: string
  buyerId: string
  type: 'fund' | 'lead_charge' | 'refund'
  amountCents: number // positive for funds added, negative for charges
  balanceAfterCents: number
  meta?: Record<string, any>
}

const dataDir = path.join(process.cwd(), 'data')
const file = path.join(dataDir, 'billing_transactions.jsonl')

function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }) }

export async function appendBillingAsync(tx: BillingTransaction) {
  if (redisEnabled()) {
    const r = getRedis()
    await r.rpush('billing:log', JSON.stringify(tx))
    return
  }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(tx) + '\n')
}

export function appendBilling(tx: BillingTransaction) {
  if (redisEnabled()) { appendBillingAsync(tx).catch(e => console.error('appendBillingAsync', e)); return }
  ensureDir(); fs.appendFileSync(file, JSON.stringify(tx) + '\n')
}

export async function listBillingAsync(limit?: number, buyerId?: string): Promise<BillingTransaction[]> {
  let arr: BillingTransaction[] = []
  if (redisEnabled()) {
  const r = getRedis()
  const lines = await r.lrange('billing:log', 0, -1)
    for (const line of lines) { try { arr.push(JSON.parse(line) as BillingTransaction) } catch {} }
  } else {
    if (!fs.existsSync(file)) return []
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    for (const line of lines) { try { arr.push(JSON.parse(line) as BillingTransaction) } catch {} }
  }
  if (buyerId) arr = arr.filter(t => t.buyerId === buyerId)
  arr.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  return limit ? arr.slice(0, limit) : arr
}

export function listBilling(limit?: number, buyerId?: string): BillingTransaction[] {
  if (redisEnabled()) { console.warn('listBilling sync used with redis enabled'); return [] }
  if (!fs.existsSync(file)) return []
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
  const arr: BillingTransaction[] = []
  for (const line of lines) { try { arr.push(JSON.parse(line) as BillingTransaction) } catch {} }
  if (buyerId) arr.splice(0, arr.length, ...arr.filter(t => t.buyerId === buyerId))
  arr.sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  return limit ? arr.slice(0, limit) : arr
}

export function recordFunding(buyerId: string, amountCents: number, balanceAfterCents: number, meta?: Record<string, any>) {
  appendBilling({ id: genId('bill'), createdAt: new Date().toISOString(), buyerId, type: 'fund', amountCents, balanceAfterCents, meta })
}

export function recordLeadCharge(buyerId: string, amountCents: number, balanceAfterCents: number, meta?: Record<string, any>) {
  appendBilling({ id: genId('bill'), createdAt: new Date().toISOString(), buyerId, type: 'lead_charge', amountCents: -Math.abs(amountCents), balanceAfterCents, meta })
}

export function recordRefund(buyerId: string, amountCents: number, balanceAfterCents: number, meta?: Record<string, any>) {
  appendBilling({ id: genId('bill'), createdAt: new Date().toISOString(), buyerId, type: 'refund', amountCents: Math.abs(amountCents), balanceAfterCents, meta })
}