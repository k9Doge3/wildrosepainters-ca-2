import fs from 'fs'
import path from 'path'
import { businessProfile } from '@/config/business-profile.example'
import type { StandardLeadPayload, CRMDispatchResult } from '../crm-dispatch'
import { getLeadStore } from '../store'
import { leadEmitter } from '../realtime/emitter'
import type { LeadLogEntry } from '../store/types'

// LeadLogEntry interface now lives in store/types.ts

const baseDir = path.join(process.cwd(), '.data', 'leads')
const store = getLeadStore()

function ensureDir() {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })
}

export async function logLead(payload: StandardLeadPayload, crmResult: CRMDispatchResult | null, meta?: { ip?: string; ua?: string }) {
  if (!businessProfile.leadLogging) return
  const entry: LeadLogEntry = {
    ts: new Date().toISOString(),
    brand: payload.brand || businessProfile.internalBrandKey,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    service: payload.service,
    messageLen: (payload.message || '').length,
    crm: crmResult ? { provider: crmResult.provider, id: crmResult.id, ok: crmResult.ok, skipped: crmResult.skipped, reason: crmResult.reason } : undefined,
    ip: meta?.ip,
    userAgent: meta?.ua,
  }
  // Fire-and-forget persistence attempts
  try {
    await store.saveLead(entry)
  } catch {
    // ignore store failure (will still append file below)
  }
  // Emit to in-process subscribers (SSE)
  try { leadEmitter.emit({ type: 'lead.new', data: entry }) } catch { /* ignore */ }
  try {
    ensureDir()
    const date = new Date().toISOString().slice(0, 10)
    const file = path.join(baseDir, `${date}.jsonl`)
    fs.appendFile(file, JSON.stringify(entry) + '\n', () => {})
  } catch {
    // silent fail to avoid impacting user flow
  }
}

export async function listStoredLeads(limit = 100) {
  try {
    return await store.listLeads(limit)
  } catch {
    return []
  }
}

