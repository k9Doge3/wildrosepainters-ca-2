export interface ScoreInput {
  urgency?: 'asap' | '30d' | 'planning'
  budgetBand?: 'under2k' | '2to5k' | '5to10k' | '10kplus'
  photos?: number
  addonsCount?: number
}

export interface ScoreResult { raw: number; normalized: number; breakdown: Record<string, number> }

function scoreUrgency(u?: string) { return u === 'asap' ? 40 : u === '30d' ? 25 : u === 'planning' ? 10 : 0 }
function scoreBudget(b?: string) { return b === '10kplus' ? 40 : b === '5to10k' ? 30 : b === '2to5k' ? 15 : b === 'under2k' ? 5 : 0 }

export function scoreLead(input: ScoreInput): ScoreResult {
  const photoScore = Math.min(24, (input.photos || 0) * 8)
  const addonScore = Math.min(20, (input.addonsCount || 0) * 5)
  const urgencyScore = scoreUrgency(input.urgency)
  const budgetScore = scoreBudget(input.budgetBand)
  const raw = urgencyScore + budgetScore + photoScore + addonScore
  const normalized = Math.min(100, Math.round(raw / 1.24))
  return { raw, normalized, breakdown: { urgency: urgencyScore, budget: budgetScore, photos: photoScore, addons: addonScore } }
}
