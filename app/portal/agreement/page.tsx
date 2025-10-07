"use client";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface StatusResp {
  acknowledged: boolean
  latest?: any
  config: { version: string; pdfUrl: string; pdfHash?: string }
}

export default function ContractorAgreementPage() {
  const [status, setStatus] = useState<StatusResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [signedName, setSignedName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const res = await fetch('/api/hrm/ack/contractor-agreement', { cache: 'no-store' })
    if (res.status === 401) { router.push('/portal/login'); return }
    const data = await res.json()
    setStatus(data)
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) return
    setError('')
    if (!signedName.trim()) { setError('Name required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/hrm/ack/contractor-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to sign')
      await load()
    } catch (err:any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6 text-sm">Loading agreement status...</div>
  if (!status) return <div className="p-6 text-sm">Unable to load status.</div>

  const { acknowledged, config } = status

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Contractor Agreement</h1>
          <p className="text-sm text-muted-foreground">Version {config.version}{config.pdfHash ? ` • Hash ${config.pdfHash.slice(0,12)}…` : ''}</p>
        </header>
        <section className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
          {config.pdfUrl ? (
            <p className="text-sm">Please review the full agreement: <a className="underline" href={config.pdfUrl} target="_blank" rel="noopener noreferrer">View PDF</a></p>
          ) : (
            <p className="text-sm text-red-600">Agreement PDF not configured.</p>
          )}
          {acknowledged ? (
            <div className="rounded-md border p-4 bg-emerald-50 text-sm">
              <p className="font-medium text-emerald-700">You have acknowledged the current version.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm">Type your full legal name below to confirm you have read and agree to the contractor agreement.</p>
              <div className="space-y-2">
                <label htmlFor="signedName" className="text-sm font-medium">Full Name (signature)</label>
                <Input id="signedName" value={signedName} onChange={e=>setSignedName(e.target.value)} required placeholder="Your full name" />
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <Button type="submit" disabled={submitting || !config.pdfUrl}>{submitting ? 'Submitting...' : 'Acknowledge & Sign'}</Button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
