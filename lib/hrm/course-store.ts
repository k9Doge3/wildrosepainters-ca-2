import fs from 'fs'
import path from 'path'
import { Course, CourseModule, Enrollment, ModuleCompletion, genId } from './models'

// JSONL file paths (append-only). Future: migrate to Redis/DB.
const dataDir = path.join(process.cwd(), 'data')
const coursesFile = path.join(dataDir, 'hrm_courses.jsonl')
const enrollmentsFile = path.join(dataDir, 'hrm_enrollments.jsonl')
const completionsFile = path.join(dataDir, 'hrm_completions.jsonl')

interface Indexes {
  courses: Map<string, Course>
  enrollments: Map<string, Enrollment>
  enrollmentsByEmployee: Map<string, Set<string>>
  enrollmentsByCourse: Map<string, Set<string>>
  completions: Map<string, ModuleCompletion>
  completionsByEnrollment: Map<string, Set<string>>
}

const idx: Indexes = {
  courses: new Map(),
  enrollments: new Map(),
  enrollmentsByEmployee: new Map(),
  enrollmentsByCourse: new Map(),
  completions: new Map(),
  completionsByEnrollment: new Map()
}

let loaded = false

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

function appendLine(file: string, obj: any) {
  ensureDir()
  fs.appendFileSync(file, JSON.stringify(obj) + '\n')
}

function loadFile(file: string, cb: (o: any) => void) {
  if (!fs.existsSync(file)) return
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
  for (const line of lines) {
    try { cb(JSON.parse(line)) } catch {/* skip */}
  }
}

function indexCourse(c: Course) {
  const existing = idx.courses.get(c.id)
  if (!existing || existing.updatedAt < c.updatedAt) idx.courses.set(c.id, c)
}

function indexEnrollment(e: Enrollment) {
  const existing = idx.enrollments.get(e.id)
  if (!existing || existing.assignedAt < e.assignedAt) idx.enrollments.set(e.id, e)
  if (!idx.enrollmentsByEmployee.has(e.employeeId)) idx.enrollmentsByEmployee.set(e.employeeId, new Set())
  if (!idx.enrollmentsByCourse.has(e.courseId)) idx.enrollmentsByCourse.set(e.courseId, new Set())
  idx.enrollmentsByEmployee.get(e.employeeId)!.add(e.id)
  idx.enrollmentsByCourse.get(e.courseId)!.add(e.id)
}

function indexCompletion(c: ModuleCompletion) {
  const existing = idx.completions.get(c.id)
  if (!existing || existing.completedAt < c.completedAt) idx.completions.set(c.id, c)
  if (!idx.completionsByEnrollment.has(c.enrollmentId)) idx.completionsByEnrollment.set(c.enrollmentId, new Set())
  idx.completionsByEnrollment.get(c.enrollmentId)!.add(c.id)
}

export function ensureLoaded() {
  if (loaded) return
  loadFile(coursesFile, indexCourse)
  loadFile(enrollmentsFile, indexEnrollment)
  loadFile(completionsFile, indexCompletion)
  loaded = true
}

// Courses
export function listCourses(): Course[] { ensureLoaded(); return Array.from(idx.courses.values()) }
export function getCourse(id: string): Course | null { ensureLoaded(); return idx.courses.get(id) || null }

export function createCourse(input: { title: string; description?: string; mandatory?: boolean; tags?: string[]; modules?: Omit<CourseModule,'id'|'order'>[] }) {
  ensureLoaded()
  const now = new Date().toISOString()
  const modules: CourseModule[] = (input.modules || []).map((m,i) => ({ id: genId('mod'), order: i+1, ...m }))
  const course: Course = {
    id: genId('course'),
    title: input.title,
    description: input.description,
    mandatory: !!input.mandatory,
    tags: input.tags,
    modules,
    version: 1,
    createdAt: now,
    updatedAt: now
  }
  appendLine(coursesFile, course)
  indexCourse(course)
  return course
}

export function updateCourse(id: string, patch: Partial<Pick<Course,'title'|'description'|'mandatory'|'tags'|'modules'>>) {
  ensureLoaded()
  const existing = idx.courses.get(id)
  if (!existing) return null
  let version = existing.version
  let modules = existing.modules
  let modulesChanged = false
  if (patch.modules) {
    modulesChanged = true
    modules = patch.modules.map((m,i) => ({ id: m.id ?? genId('mod'), order: i+1, title: m.title, contentType: m.contentType, contentRef: m.contentRef, estMinutes: m.estMinutes }))
  }
  if (modulesChanged) version += 1
  const updated: Course = {
    ...existing,
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    mandatory: patch.mandatory ?? existing.mandatory,
    tags: patch.tags ?? existing.tags,
    modules,
    version,
    updatedAt: new Date().toISOString()
  }
  appendLine(coursesFile, updated)
  indexCourse(updated)
  return updated
}

// Enrollments
export function listEnrollments(opts?: { employeeId?: string; courseId?: string }): Enrollment[] {
  ensureLoaded()
  const all = Array.from(idx.enrollments.values())
  return all.filter(e => (!opts?.employeeId || e.employeeId === opts.employeeId) && (!opts?.courseId || e.courseId === opts.courseId))
}

export function getEnrollment(id: string): Enrollment | null { ensureLoaded(); return idx.enrollments.get(id) || null }

export function findActiveEnrollment(employeeId: string, courseId: string): Enrollment | null {
  ensureLoaded()
  const ids = idx.enrollmentsByEmployee.get(employeeId)
  if (!ids) return null
  for (const id of ids) {
    const e = idx.enrollments.get(id)
    if (e && e.courseId === courseId && !e.completedAt) return e
  }
  return null
}

export function enrollEmployee(employeeId: string, courseId: string) {
  ensureLoaded()
  const course = idx.courses.get(courseId)
  if (!course) throw new Error('course_not_found')
  const existing = findActiveEnrollment(employeeId, courseId)
  if (existing) return existing
  const now = new Date().toISOString()
  const enrollment: Enrollment = {
    id: genId('enroll'),
    employeeId,
    courseId,
    assignedAt: now,
    progress: 0,
    versionAtEnrollment: course.version
  }
  appendLine(enrollmentsFile, enrollment)
  indexEnrollment(enrollment)
  return enrollment
}

// Completions / progress
export function listCompletions(enrollmentId: string): ModuleCompletion[] {
  ensureLoaded()
  const ids = idx.completionsByEnrollment.get(enrollmentId)
  if (!ids) return []
  return Array.from(ids).map(id => idx.completions.get(id)!).filter(Boolean)
}

function calcProgress(course: Course, enrollmentId: string): number {
  if (!course.modules.length) return 100
  const done = listCompletions(enrollmentId).length
  return Math.min(100, Math.round((done / course.modules.length) * 100))
}

export function completeModule(enrollmentId: string, moduleId: string) {
  ensureLoaded()
  const enrollment = idx.enrollments.get(enrollmentId)
  if (!enrollment) throw new Error('enrollment_not_found')
  const course = idx.courses.get(enrollment.courseId)
  if (!course) throw new Error('course_not_found')
  if (!course.modules.find(m => m.id === moduleId)) throw new Error('module_not_found')
  // Already completed this module?
  const existing = listCompletions(enrollmentId).find(c => c.moduleId === moduleId)
  if (existing) return { enrollment, completion: existing }
  const completion: ModuleCompletion = { id: genId('modc'), enrollmentId, moduleId, completedAt: new Date().toISOString() }
  appendLine(completionsFile, completion)
  indexCompletion(completion)
  // Recompute progress
  const progress = calcProgress(course, enrollmentId)
  let updatedEnrollment = enrollment
  if (progress !== enrollment.progress || (progress === 100 && !enrollment.completedAt)) {
    updatedEnrollment = { ...enrollment, progress, completedAt: progress === 100 ? new Date().toISOString() : enrollment.completedAt }
    appendLine(enrollmentsFile, updatedEnrollment)
    indexEnrollment(updatedEnrollment)
  }
  return { enrollment: updatedEnrollment, completion }
}

export function markEnrollmentComplete(enrollmentId: string) {
  ensureLoaded()
  const enrollment = idx.enrollments.get(enrollmentId)
  if (!enrollment) throw new Error('enrollment_not_found')
  if (enrollment.completedAt) return enrollment
  const updated: Enrollment = { ...enrollment, progress: 100, completedAt: new Date().toISOString() }
  appendLine(enrollmentsFile, updated)
  indexEnrollment(updated)
  return updated
}

export function progressSummaryForEmployee(employeeId: string) {
  ensureLoaded()
  const enrollments = listEnrollments({ employeeId })
  const total = enrollments.length
  const completed = enrollments.filter(e => e.completedAt).length
  return {
    employeeId,
    totalEnrollments: total,
    completedEnrollments: completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  }
}

export function aggregateProgressAllEmployees() {
  ensureLoaded()
  const byEmp = new Map<string, ReturnType<typeof progressSummaryForEmployee>>()
  for (const e of idx.enrollments.values()) {
    if (!byEmp.has(e.employeeId)) byEmp.set(e.employeeId, progressSummaryForEmployee(e.employeeId))
  }
  return Array.from(byEmp.values())
}
