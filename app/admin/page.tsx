"use client"
import { useEffect, useState } from 'react'

interface Buyer {
  id: string
  name: string
  contactEmail: string
  active: boolean
  minScore: number
  services: string[]
  dailyCap: number
  deliveredToday: number
  pricePerLeadCents: number
  creditCents: number
  lowBalanceThresholdCents?: number
}

interface HealthResp {
  ok: boolean
  redis: string
  storeDriver: string
  commit?: string
  env?: string
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string>("")
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthResp | null>(null)
  const [form, setForm] = useState({ name: '', email: '', price: '2500', credit: '20000' })
  const [fundAmount, setFundAmount] = useState<string>('5000')

  useEffect(() => {
    const stored = localStorage.getItem('adminKey')
    if (stored) setAdminKey(stored)
    load()
    loadHealth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/buyers', { headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' } })
      if (!res.ok) throw new Error('Failed buyers')
      const data = await res.json()
      setBuyers(data.buyers || [])
      setError(null)
    } catch (e: any) {
      setError(e.message || 'error')
    } finally { setLoading(false) }
  }

  async function loadHealth() {
    try {
      const res = await fetch('/api/health', { cache: 'no-cache' })
      if (res.ok) setHealth(await res.json())
    } catch { /* ignore */ }
  }

  function persistKey(v: string) {
    setAdminKey(v)
    if (v) localStorage.setItem('adminKey', v); else localStorage.removeItem('adminKey')
  }

  async function createBuyer(e: React.FormEvent) {
    e.preventDefault()
    try {
      const body = {
        name: form.name,
        contactEmail: form.email,
        minScore: 40,
        services: ['fence','deck','interior'],
        postalPrefixes: [],
        dailyCap: 25,
        pricePerLeadCents: parseInt(form.price, 10) || 2500,
        creditCents: parseInt(form.credit, 10) || 0
      }
      const res = await fetch('/api/buyers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      setForm({ name: '', email: '', price: '2500', credit: '20000' })
      await load()
    } catch (e: any) { alert(e.message) }
  }

  async function fund(buyerId: string) {
    try {
      const amt = parseInt(fundAmount, 10)
      if (!amt || amt <= 0) return alert('Enter amount in cents')
      const res = await fetch(`/api/buyers/${buyerId}/fund`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ amountCents: amt, note: 'Manual funding via UI' }) })
      if (!res.ok) throw new Error(await res.text())
      await load()
    } catch (e: any) { alert(e.message) }
  }

  async function toggleActive(buyer: Buyer) {
    try {
      const res = await fetch(`/api/buyers/${buyer.id}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ active: !buyer.active }) })
      if (!res.ok) throw new Error(await res.text())
      await load()
    } catch (e: any) { alert(e.message) }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <section className="space-y-2">
        <label className="block text-sm font-medium">Admin API Key</label>
        <input value={adminKey} onChange={e => persistKey(e.target.value)} placeholder="Enter x-admin-key" className="border px-2 py-1 rounded w-full max-w-md" />
        <p className="text-xs text-muted-foreground">Stored locally (localStorage). Needed for buyer & billing actions.</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-medium">Buyers</h2>
          <button onClick={load} className="text-sm px-3 py-1 rounded bg-blue-600 text-white">Refresh</button>
        </div>
        {loading && <p className="text-sm">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !buyers.length && <p className="text-sm text-muted-foreground">No buyers.</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buyers.map(b => (
            <div key={b.id} className="border rounded p-3 space-y-2 bg-white/50 dark:bg-neutral-900/40">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{b.name}</h3>
                <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-0.5 rounded ${b.active ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>{b.active ? 'Active' : 'Inactive'}</button>
              </div>
              <p className="text-xs break-all text-muted-foreground">{b.contactEmail}</p>
              <p className="text-xs">Score ≥ {b.minScore} • ${ (b.pricePerLeadCents/100).toFixed(2) }</p>
              <p className="text-xs">Credit: ${(b.creditCents/100).toFixed(2)}</p>
              <div className="flex gap-2 items-center">
                <input value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="border px-1 py-0.5 text-xs w-24" placeholder="cents" />
                <button onClick={() => fund(b.id)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Fund</button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={createBuyer} className="mt-4 border rounded p-4 space-y-3 max-w-md">
          <h3 className="font-medium text-sm">Create Buyer</h3>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="border px-2 py-1 w-full text-sm rounded" />
          <input required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Contact Email" className="border px-2 py-1 w-full text-sm rounded" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price cents" className="border px-2 py-1 text-sm rounded" />
            <input value={form.credit} onChange={e => setForm(f => ({ ...f, credit: e.target.value }))} placeholder="Initial credit" className="border px-2 py-1 text-sm rounded" />
          </div>
          <button className="text-sm px-3 py-1 rounded bg-green-600 text-white">Create</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">System Health</h2>
        {health ? (
          <div className="text-sm flex gap-4 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-green-600 text-white">ok</span>
            <span>redis: {health.redis}</span>
            <span>store: {health.storeDriver}</span>
            {health.commit && <span>commit: {health.commit}</span>}
            {health.env && <span>env: {health.env}</span>}
          </div>
        ) : <p className="text-sm text-muted-foreground">Loading health...</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Recent Leads (raw)</h2>
        <p className="text-xs text-muted-foreground">Open a second tab with the public form and submit to see new entries. (Full lead management UI can be added later.)</p>
        <iframe title="Leads" src="/api/leads/export?format=html&limit=25" className="w-full h-80 border rounded bg-white"></iframe>
      </section>
    </main>
  )
}
