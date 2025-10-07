import { Buyer, listBuyers } from '@/lib/buyers/store'
import { EnrichedLead } from '@/lib/leads/store'

export interface RoutingContext {
  postalCode?: string
}

interface Candidate extends Buyer { priorityScore: number }

export function selectBuyerForLead(lead: EnrichedLead, ctx: RoutingContext = {}): Buyer | null {
  const buyers = listBuyers()
  const today = new Date().toISOString().slice(0,10)
  const serviceKey = normalizeService(lead.service)

  const candidates: Candidate[] = []
  for (const b of buyers) {
    if (!b.active) continue
    if (lead.normalizedScore < b.minScore) continue
    if (b.services.length && !b.services.includes(serviceKey)) continue
    if (b.dailyCap && b.deliveredToday >= b.dailyCap && b.lastDeliveryDate === today) continue
    // Ensure buyer has sufficient credit for one more lead (monetization gate)
    if (typeof (b as any).pricePerLeadCents === 'number' && typeof (b as any).creditCents === 'number') {
      if ((b as any).creditCents < (b as any).pricePerLeadCents) continue
    }
    if (ctx.postalCode && b.postalPrefixes.length) {
      const match = b.postalPrefixes.some(p => ctx.postalCode!.toUpperCase().startsWith(p.toUpperCase()))
      if (!match) continue
    }
    // Simple priority: higher minScore buyer gets preference, then lower deliveredToday (spread evenly)
    const priorityScore = b.minScore * 100 - (b.deliveredToday || 0)
    candidates.push({ ...b, priorityScore })
  }
  if (!candidates.length) return null
  candidates.sort((a,b) => b.priorityScore - a.priorityScore)
  return candidates[0]
}

function normalizeService(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g,'_')
}
