export interface LeadLogEntry {
  ts: string
  brand?: string
  name?: string
  email?: string
  phone?: string
  service?: string
  messageLen?: number
  crm?: { provider: string; id?: string; ok: boolean; skipped?: boolean; reason?: string }
  ip?: string
  userAgent?: string
}

export interface StoreHealth {
  driver: string
  ok: boolean
  degraded?: boolean
  message?: string
}

export interface LeadStore {
  saveLead(entry: LeadLogEntry): Promise<void>
  listLeads(limit?: number): Promise<LeadLogEntry[]>
  health(): Promise<StoreHealth>
}

export interface StoreFactoryOptions {
  driver?: string
}
