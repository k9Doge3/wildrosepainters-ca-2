// CRM Dispatch Layer (Adapter-based)
// Supports: HubSpot (live), EspoCRM (scaffold). Easily extend with new adapters.

import { businessProfile } from '@/config/business-profile.example'

export interface StandardLeadPayload {
  name?: string
  email?: string
  phone?: string
  service?: string
  message?: string
  brand?: string
}

export interface CRMDispatchResult {
  ok: boolean
  provider: string
  id?: string
  raw?: any
  skipped?: boolean
  reason?: string
}

interface CRMAdapter {
  name: string
  enabled(): boolean
  createLead(payload: StandardLeadPayload): Promise<CRMDispatchResult>
}

// ---------------- HubSpot Adapter ----------------
class HubSpotAdapter implements CRMAdapter {
  name = 'hubspot'
  private token = process.env.HUBSPOT_PRIVATE_APP_TOKEN
  private pipeline = process.env.HUBSPOT_PIPELINE_ID
  private stage = process.env.HUBSPOT_STAGE_NEW_ID
  enabled() { return Boolean(this.token) }
  async createLead(p: StandardLeadPayload): Promise<CRMDispatchResult> {
    if (!this.enabled()) return { ok: false, provider: this.name, skipped: true, reason: 'missing token' }
    try {
      // Contact
      const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({ properties: {
          email: p.email,
          firstname: p.name?.split(' ')[0],
          lastname: p.name?.split(' ').slice(1).join(' ') || 'Lead',
          phone: p.phone,
          service_type: p.service,
          brand: p.brand,
          message_snippet: (p.message || '').slice(0, 180)
        } })
      })
      const contactJson = await contactRes.json().catch(()=>({}))
      // Deal (optional)
      if (this.pipeline && this.stage) {
        await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
          body: JSON.stringify({ properties: {
            dealname: `${p.name || 'Lead'} - ${p.service || 'Project'}`,
            pipeline: this.pipeline,
            dealstage: this.stage,
            amount: 0,
            service_type: p.service,
            brand: p.brand
          } })
        }).catch(()=>{})
      }
      if (!contactRes.ok) return { ok: false, provider: this.name, reason: JSON.stringify(contactJson) }
      return { ok: true, provider: this.name, id: contactJson.id, raw: contactJson }
    } catch (e: any) {
      return { ok: false, provider: this.name, reason: e?.message }
    }
  }
}

// ---------------- EspoCRM Adapter (Scaffold) ----------------
// Requires creating custom fields brand_c, service_c in Espo for full parity.
class EspoAdapter implements CRMAdapter {
  name = 'espo'
  private base = process.env.ESPOCRM_BASE_URL
  private apiKey = process.env.ESPOCRM_API_KEY
  enabled() { return Boolean(this.base && this.apiKey) }
  async createLead(p: StandardLeadPayload): Promise<CRMDispatchResult> {
    if (!this.enabled()) return { ok: false, provider: this.name, skipped: true, reason: 'missing base/api key' }
    try {
      const res = await fetch(`${this.base}/api/v1/Lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey as string },
        body: JSON.stringify({
          firstName: p.name, // adapt if splitting first/last
          description: p.message,
          phoneNumber: p.phone,
          emailAddress: p.email,
          leadSource: 'Website',
          brand_c: p.brand,
          service_c: p.service
        })
      })
      const json = await res.json().catch(()=>({}))
      if (!res.ok) return { ok: false, provider: this.name, reason: JSON.stringify(json) }
      return { ok: true, provider: this.name, id: json.id, raw: json }
    } catch (e: any) {
      return { ok: false, provider: this.name, reason: e?.message }
    }
  }
}

function pickAdapter(): CRMAdapter | null {
  const mode = businessProfile.crm || 'none'
  if (mode === 'hubspot') return new HubSpotAdapter()
  if (mode === 'espo') return new EspoAdapter()
  return null
}

export async function dispatchLeadToCRM(payload: StandardLeadPayload): Promise<CRMDispatchResult> {
  const adapter = pickAdapter()
  if (!adapter) return { ok: false, provider: 'none', skipped: true, reason: 'no crm configured' }
  if (!adapter.enabled()) return { ok: false, provider: adapter.name, skipped: true, reason: 'crm not enabled' }
  return adapter.createLead({ ...payload, brand: payload.brand || businessProfile.internalBrandKey })
}

// Utility: feature flag style check (optional future usage)
export function crmActive(): boolean {
  const adapter = pickAdapter()
  return Boolean(adapter && adapter.enabled())
}
