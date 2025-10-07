import EnrollButton from './EnrollButton';
import { redirect } from 'next/navigation'
import { getEmployeeSession, roleSatisfies } from '@/lib/employee-auth'
import React from 'react'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Helper server-side fetch using existing session cookie
async function fetchJSON(path: string, init?: RequestInit) {
  const cookieStore = await cookies()
  const res = await fetch(path, {
    ...init,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      // Forward cookies automatically handled by Next fetch
    },
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Request failed ' + res.status)
  return res.json()
}

interface CourseSummary {
  id: string
  title: string
  version: number
  mandatory: boolean
  description?: string
}

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const session = await getEmployeeSession()
  if (!session) redirect('/portal/login')
  let courses: CourseSummary[] = []
  let enrollments: any[] = []
  try {
    const data = await fetchJSON(process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL + '/api/hrm/courses' : '/api/hrm/courses')
    courses = data.courses || []
    const enrollData = await fetchJSON('/api/hrm/enrollments')
    enrollments = enrollData.enrollments || []
  } catch (e) {
    // swallow for UI friendliness
  }
  const enrollmentMap = new Map<string, any>()
  enrollments.forEach(e => { enrollmentMap.set(e.courseId, e) })
  const isAdmin = roleSatisfies(session.role, 'admin')
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">Training & compliance modules</p>
        </div>
        {isAdmin && <CreateCourseDialog/>}
      </header>
      <Separator/>
      {courses.length === 0 && (
        <p className="text-sm text-muted-foreground">No courses yet.</p>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {courses.map(c => {
          const enr = enrollmentMap.get(c.id)
          const status = enr ? (enr.completedAt ? 'Completed' : `${enr.progress}%`) : null
          return (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {c.title}
                  {c.mandatory && <Badge variant="destructive">Mandatory</Badge>}
                </CardTitle>
                <CardDescription>Version {c.version}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm line-clamp-3">{c.description || 'No description provided.'}</p>
              </CardContent>
              <CardFooter className="flex gap-2 justify-between">
                <a href={`/portal/courses/${c.id}`} className="text-sm underline">Open</a>
                <div className="flex gap-2 items-center">
                  {status && <Badge variant={enr?.completedAt ? 'secondary' : 'outline'}>{status}</Badge>}
                  {!enr && <EnrollButton courseId={c.id}/>}            
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Client Components
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

function EnrollButton({ courseId }: { courseId: string }) {
  'use client'
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <Button size="sm" disabled={pending} onClick={() => {
      start(async () => {
        const res = await fetch(`/api/hrm/courses/${courseId}/enroll`, { method: 'POST' })
        if (res.ok) router.refresh()
      })
    }}>Enroll</Button>
  )
}

function CreateCourseDialog() {
  'use client'
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [mandatory, setMandatory] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New Course</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={e => {
          e.preventDefault()
          start(async () => {
            const res = await fetch('/api/hrm/courses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, description: desc, mandatory, modules: [] })
            })
            if (res.ok) {
              setOpen(false)
              setTitle(''); setDesc(''); setMandatory(false)
              router.refresh()
            }
          })
        }}>
          <div className="space-y-2">
            <Label htmlFor="course-title">Title<span className="sr-only"> (required)</span></Label>
            <Input id="course-title" name="title" aria-required="true" aria-label="Course title" placeholder="e.g. Safety Orientation" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-desc">Description</Label>
            <Textarea id="course-desc" name="description" aria-label="Course description" placeholder="Brief course description" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input id="mandatory" name="mandatory" type="checkbox" checked={mandatory} aria-label="Mandatory course" onChange={e => setMandatory(e.target.checked)} className="h-4 w-4" />
            <Label htmlFor="mandatory">Mandatory</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !title}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
