export type LeadEventListener = (payload: any) => void

class LeadEmitter {
  private listeners: Set<LeadEventListener> = new Set()
  emit(payload: any) {
    for (const l of this.listeners) {
      try { l(payload) } catch { /* ignore */ }
    }
  }
  subscribe(listener: LeadEventListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  count() { return this.listeners.size }
}

export const leadEmitter = new LeadEmitter()
