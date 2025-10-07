import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { getCourse, updateCourse } from '@/lib/hrm/course-store'

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const course = getCourse(ctx.params.id)
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ course })
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!roleSatisfies(session.role, 'supervisor')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  try {
    const updated = updateCourse(ctx.params.id, {
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      mandatory: typeof body.mandatory === 'boolean' ? body.mandatory : undefined,
      tags: Array.isArray(body.tags) ? body.tags.slice(0,10) : undefined,
      modules: Array.isArray(body.modules) ? body.modules.map((m: any) => ({
        id: m.id,
        title: String(m.title || ''),
        contentType: m.contentType === 'html' ? 'html' : m.contentType === 'link' ? 'link' : 'markdown',
        contentRef: String(m.contentRef || ''),
        estMinutes: m.estMinutes ? Number(m.estMinutes) : undefined
      })) : undefined
    })
    if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ course: updated })
  } catch (e:any) {
    return NextResponse.json({ error: 'server_error', message: e?.message }, { status: 500 })
  }
}
