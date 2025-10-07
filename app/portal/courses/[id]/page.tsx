import { redirect } from 'next/navigation'
import { getEmployeeSession, roleSatisfies } from '@/lib/employee-auth'
import { cookies } from 'next/headers'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import React from 'react'

async function fetchJSON(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, cache: 'no-store' })
  if (!res.ok) throw new Error('Request failed ' + res.status)
  return res.json()
}

interface CourseModule { id: string; title: string; order: number; contentType: string; contentRef: string; estMinutes?: number }
interface Course { id: string; title: string; description?: string; version: number; mandatory: boolean; modules: CourseModule[] }

export const dynamic = 'force-dynamic'

// Client admin editor component (hoisted earlier so TS sees it before usage)
import { useState } from 'react'
function AdminModuleEditor({ course }: { course: any }) {
  'use client'
  const [modules, setModules] = useState<any[]>(course.modules || [])
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  function update(idx: number, patch: any) { setModules(ms => ms.map((m,i) => i===idx ? { ...m, ...patch } : m)) }
  function remove(idx: number) { setModules(ms => ms.filter((_,i)=>i!==idx)) }
  function move(idx: number, dir: -1|1) { setModules(ms => { const arr=[...ms]; const ni=idx+dir; if(ni<0||ni>=arr.length) return ms; const tmp=arr[idx]; arr[idx]=arr[ni]; arr[ni]=tmp; return arr }) }
  function add() { setModules(ms => [...ms,{ id: undefined, title: 'New Module', contentType: 'text', contentRef: 'REF', estMinutes: 5 }]) }
  async function save() { setSaving(true); try { const body={ modules: modules.map(m=>({ id:m.id, title:m.title, contentType:m.contentType, contentRef:m.contentRef, estMinutes:m.estMinutes })) }; const res=await fetch(`/api/hrm/courses/${course.id}`,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}); if(!res.ok) throw new Error('Save failed'); toast({ title:'Course updated', description:'Modules saved. Version incremented.' }); router.refresh(); } catch(e:any){ toast({ title:'Update failed', description:e.message||'Could not save modules', variant:'destructive' }) } finally { setSaving(false) } }
  return (
    <div className="space-y-3 border rounded-md p-4 bg-muted/30" aria-label="Admin module editor">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin: Modules</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
          <Button type="button" size="sm" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {modules.map((m,i)=>(
          <div key={i} className="flex flex-col gap-1 border rounded p-2 bg-background" aria-label={`Module row ${i+1}`}> 
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[10px] text-muted-foreground" aria-hidden>{i+1}</span>
              <input aria-label="Module title" title="Module title" className="flex-1 bg-transparent border px-1 py-0.5 rounded text-xs" value={m.title} onChange={e=>update(i,{ title:e.target.value })} />
              <input aria-label="Content type" title="Content type" className="w-24 bg-transparent border px-1 py-0.5 rounded text-xs" value={m.contentType} onChange={e=>update(i,{ contentType:e.target.value })} />
              <input aria-label="Content reference" title="Content reference" className="w-32 bg-transparent border px-1 py-0.5 rounded text-xs" value={m.contentRef} onChange={e=>update(i,{ contentRef:e.target.value })} />
              <input aria-label="Estimated minutes" title="Estimated minutes" className="w-20 bg-transparent border px-1 py-0.5 rounded text-xs" type="number" value={m.estMinutes ?? ''} onChange={e=>update(i,{ estMinutes:Number(e.target.value)||undefined })} />
            </div>
            <div className="flex gap-1 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={()=>move(i,-1)} disabled={i===0}>Up</Button>
              <Button type="button" variant="outline" size="sm" onClick={()=>move(i,1)} disabled={i===modules.length-1}>Down</Button>
              <Button type="button" variant="destructive" size="sm" onClick={()=>remove(i)}>Remove</Button>
            </div>
          </div>
        ))}
        {modules.length===0 && <p className="text-xs text-muted-foreground">No modules. Add one.</p>}
      </div>
    </div>
  )
}

export default async function CourseDetail({ params }: { params: { id: string } }) {
  const session = await getEmployeeSession()
  if (!session) redirect('/portal/login')
  let course: Course | null = null
  let enrollment: any = null
  let completions: string[] = []
  try {
    const data = await fetchJSON(`/api/hrm/courses/${params.id}`)
    course = data.course
    const enrollments = await fetchJSON(`/api/hrm/enrollments?courseId=${params.id}`)
    enrollment = (enrollments.enrollments || [])[0] || null
    if (enrollment) {
      try {
        const comp = await fetchJSON(`/api/hrm/enrollments/${enrollment.id}/completions`)
        completions = (comp.completions || []).map((c:any)=>c.moduleId)
      } catch {/* ignore */}
    }
  } catch {}
  if (!course) {
    return <div className="p-8 max-w-3xl mx-auto"><p className="text-sm text-muted-foreground">Course not found.</p></div>
  }
  const isAdmin = roleSatisfies(session.role, 'admin')
  const inProgress = enrollment && !enrollment.completedAt
  const completed = enrollment && !!enrollment.completedAt
  const totalModules = course.modules.length
  const completedModules = course.modules.filter(m => (enrollment?.completedAt ? true : completions.includes(m.id))).length
  const percent = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100)
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">{course.title}{course.mandatory && <Badge variant="destructive">Mandatory</Badge>}</h1>
          <p className="text-sm text-muted-foreground">Version {course.version}</p>
          {course.description && <p className="mt-2 text-sm leading-relaxed">{course.description}</p>}
          {totalModules > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{completedModules}/{totalModules} modules • {percent}%</span>
              </div>
              <Progress value={percent} aria-label={`Course progress ${percent}%`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!enrollment && <EnrollButton courseId={course.id} />}
          {inProgress && <CompleteCourseButton courseId={course.id} enrollmentId={enrollment.id} />}
          {completed && <Badge variant="secondary">Completed</Badge>}
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        {course.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules defined yet.</p>}
        {course.modules.map(m => {
          const done = completions.includes(m.id) || (enrollment?.completedAt ? true : false)
          return (
            <Card key={m.id} className={done ? 'border-green-400' : ''}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-muted-foreground">{m.order}.</span> {m.title}
                  {done ? <Badge variant="secondary">Done</Badge> : <Badge variant="outline" className="opacity-70">Not Done</Badge>}
                </CardTitle>
                <CardDescription className="text-xs">{m.contentType} • {m.contentRef}{m.estMinutes ? ` • ~${m.estMinutes}m` : ''}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={done ? 100 : 0} className="h-2" aria-label={`Module ${m.title} progress ${done?100:0}%`} role="progressbar" aria-valuenow={done?100:0} aria-valuemin={0} aria-valuemax={100} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">{done ? '100%' : '0%'}</span>
                </div>
              </CardContent>
              <CardFooter className="py-3 flex justify-end gap-2">
                {!done && enrollment && <CompleteModuleButton courseId={course.id} moduleId={m.id} />}
                {done && <span className="text-xs text-muted-foreground">Completed</span>}
              </CardFooter>
            </Card>
          )
        })}
      </div>
      {isAdmin && <AdminModuleEditor course={course} />}
    </div>
  )
}

// moduleDone helper removed (now rely on fetched completions)

// Client components
import { useTransition } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

function EnrollButton({ courseId }: { courseId: string }) {
  'use client'
  const [pending, start] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  return <Button size="sm" disabled={pending} onClick={() => start(async () => {
    try {
      const res = await fetch(`/api/hrm/courses/${courseId}/enroll`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Enrolled', description: 'You are now enrolled in the course.' })
      router.refresh()
    } catch (e:any) {
      toast({ title: 'Enroll failed', description: e.message || 'Could not enroll', variant: 'destructive' })
    }
  })}>Enroll</Button>
}

function CompleteModuleButton({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  'use client'
  const [pending, start] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  return <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => {
    try {
      const res = await fetch(`/api/hrm/courses/${courseId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId }) })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Module completed', description: 'Marked module as done.' })
      router.refresh()
    } catch (e:any) {
      toast({ title: 'Action failed', description: e.message || 'Could not complete module', variant: 'destructive' })
    }
  })}>Mark Module Done</Button>
}

function CompleteCourseButton({ courseId, enrollmentId }: { courseId: string; enrollmentId: string }) {
  'use client'
  const [pending, start] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => {
    try {
      const res = await fetch(`/api/hrm/courses/${courseId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Course completed', description: 'All modules marked complete.' })
      router.refresh()
    } catch (e:any) {
      toast({ title: 'Action failed', description: e.message || 'Could not complete course', variant: 'destructive' })
    }
  })}>Complete Course</Button>
}
