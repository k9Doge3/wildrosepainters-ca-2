"use client"
import { useEffect, useState, useRef } from 'react'

interface LeadRow {
  ts: string
  name?: string
  email?: string
  phone?: string
  service?: string
  messageLen?: number
  crm?: { provider: string; id?: string; ok: boolean; skipped?: boolean; reason?: string }
  ip?: string
}

export function LeadsTable() {
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/leads?limit=50', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setRows(data.leads || [])
      setError(null)
    } catch (e: any) {
      setError(e.message || 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let es: EventSource | null = null
    let fallbackTimer: any
    const start = async () => {
      await load() // initial
      try {
        es = new EventSource('/api/admin/leads/stream')
        es.addEventListener('init', (evt: MessageEvent) => {
          try {
            const data = JSON.parse(evt.data)
            if (Array.isArray(data.leads)) setRows(data.leads)
          } catch { /* ignore */ }
        })
        es.addEventListener('lead', (evt: MessageEvent) => {
          try {
            const item = JSON.parse(evt.data)
            setRows(prev => [item, ...prev].slice(0, 50))
          } catch { /* ignore */ }
        })
        es.onerror = () => {
          // fallback to polling on error
          if (es) es.close()
          if (!fallbackTimer) {
            fallbackTimer = setInterval(load, 15000)
          }
        }
      } catch {
        // immediate fallback
        fallbackTimer = setInterval(load, 15000)
      }
    }
    start()
    return () => {
      if (es) es.close()
      if (fallbackTimer) clearInterval(fallbackTimer)
    }
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading leads...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!rows.length) return <p className="text-sm text-muted-foreground">No leads yet.</p>

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/40 text-left">
            <th className="px-2 py-1 font-medium">When</th>
            <th className="px-2 py-1 font-medium">Name</th>
            <th className="px-2 py-1 font-medium">Service</th>
            <th className="px-2 py-1 font-medium">Message Len</th>
            <th className="px-2 py-1 font-medium">CRM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const d = new Date(r.ts)
            const ts = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            return (
              <tr key={r.ts + r.email} className="border-b last:border-none hover:bg-muted/20">
                <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{ts}</td>
                <td className="px-2 py-1">{r.name || '—'}</td>
                <td className="px-2 py-1">{r.service || '—'}</td>
                <td className="px-2 py-1 text-center">{r.messageLen ?? '—'}</td>
                <td className="px-2 py-1">
                  {r.crm ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${r.crm.ok && !r.crm.skipped ? 'bg-green-100 text-green-700' : r.crm.skipped ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}> 
                      {r.crm.provider}{r.crm.id ? `:${r.crm.id}` : ''}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">n/a</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
