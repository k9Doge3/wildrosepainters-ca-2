import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee, roleSatisfies } from '@/lib/employee-auth'
import { createCourse, listCourses } from '@/lib/hrm/course-store'

export async function GET() {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // Everyone can list courses
  const courses = listCourses()
  return NextResponse.json({ courses })
}

export async function POST(req: NextRequest) {
  const session = await requireEmployee()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!roleSatisfies(session.role, 'admin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'invalid_title' }, { status: 400 })
    }
    const course = createCourse({
      title: body.title,
      description: body.description,
      mandatory: !!body.mandatory,
      tags: Array.isArray(body.tags) ? body.tags.slice(0,10) : undefined,
      modules: Array.isArray(body.modules) ? body.modules.map((m: any) => ({
        title: String(m.title || ''),
        contentType: m.contentType === 'html' ? 'html' : m.contentType === 'link' ? 'link' : 'markdown',
        contentRef: String(m.contentRef || ''),
        estMinutes: m.estMinutes ? Number(m.estMinutes) : undefined
      })) : []
    })
    return NextResponse.json({ course }, { status: 201 })
  } catch (e:any) {
    return NextResponse.json({ error: 'server_error', message: e?.message }, { status: 500 })
  }
}
