"use client";
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({message:'Login failed'}))
        throw new Error(data.message || 'Login failed')
      }
      router.push('/portal/dashboard')
    } catch (err:any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 space-y-6 border">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Contractor Login</h1>
          <p className="text-sm text-muted-foreground">Access training & assignments</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Checking...' : 'Login'}</Button>
      </form>
    </div>
  )
}
