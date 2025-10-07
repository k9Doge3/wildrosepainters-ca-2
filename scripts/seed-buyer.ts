#!/usr/bin/env ts-node
import fs from 'fs'
import path from 'path'
import { genId } from '@/lib/hrm/models'
import { redisEnabled, getRedis } from '@/lib/redis'

interface BuyerSeed {
  id: string
  name: string
  contactEmail: string
  active: boolean
  minScore: number
  services: string[]
  postalPrefixes: string[]
  dailyCap: number
  deliveredToday: number
  lastDeliveryDate?: string
  webhookUrl?: string
  pricePerLeadCents: number
  creditCents: number
  lowBalanceThresholdCents?: number
  lastLowBalanceAlertAt?: string
  createdAt: string
  updatedAt: string
}

function buildBuyer(): BuyerSeed {
  const now = new Date().toISOString()
  return {
    id: 'buyer_default',
    name: 'Default Painting Partner',
    contactEmail: process.env.CONTACT_FORM_TO || 'owner@example.com',
    active: true,
    minScore: 40,
    services: ['fence','deck','interior'],
    postalPrefixes: [],
    dailyCap: 25,
    deliveredToday: 0,
    pricePerLeadCents: 2500,
    creditCents: 20000, // $200 starting credit
    lowBalanceThresholdCents: 5000,
    createdAt: now,
    updatedAt: now,
  }
}

async function seedRedis(buyer: BuyerSeed) {
  const r = getRedis()
  const exists = await r.hget('buyers:latest', buyer.id)
  if (exists) {
    console.log('Buyer already exists in Redis, skipping.')
    return
  }
  await r.rpush('buyers:log', JSON.stringify(buyer))
  await r.hset('buyers:latest', { [buyer.id]: JSON.stringify(buyer) })
  console.log('Seeded buyer into Redis:', buyer.id)
}

function seedFile(buyer: BuyerSeed) {
  const dataDir = path.join(process.cwd(), 'data')
  const file = path.join(dataDir, 'buyers.jsonl')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    if (lines.some(l => { try { return JSON.parse(l).id === buyer.id } catch { return false } })) {
      console.log('Buyer already exists in file, skipping.')
      return
    }
  }
  fs.appendFileSync(file, JSON.stringify(buyer) + '\n')
  console.log('Seeded buyer into file mode:', buyer.id)
}

async function main() {
  const buyer = buildBuyer()
  if (redisEnabled()) {
    await seedRedis(buyer)
  } else {
    seedFile(buyer)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
