// Placeholder HRM store utilities (memory-first, later Redis integration)
import { Employee, Course, Enrollment, ModuleCompletion, PolicyAcknowledgment, genId } from './models'

interface MemoryDB {
  employees: Map<string, Employee>
  courses: Map<string, Course>
  enrollments: Map<string, Enrollment>
  completions: Map<string, ModuleCompletion>
  acks: Map<string, PolicyAcknowledgment>
}

const mem: MemoryDB = {
  employees: new Map(),
  courses: new Map(),
  enrollments: new Map(),
  completions: new Map(),
  acks: new Map()
}

export const hrmMemory = {
  createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const now = new Date().toISOString()
    const emp: Employee = { id: genId('emp'), createdAt: now, updatedAt: now, ...data }
    mem.employees.set(emp.id, emp)
    return emp
  },
  listEmployees(): Employee[] { return Array.from(mem.employees.values()) },
  createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Course {
    const now = new Date().toISOString()
    const c: Course = { id: genId('course'), version: 1, createdAt: now, updatedAt: now, ...data }
    mem.courses.set(c.id, c)
    return c
  },
  listCourses(): Course[] { return Array.from(mem.courses.values()) },
  enroll(employeeId: string, courseId: string): Enrollment {
    const course = mem.courses.get(courseId)
    if (!course) throw new Error('course not found')
    const now = new Date().toISOString()
    const e: Enrollment = { id: genId('enroll'), employeeId, courseId, assignedAt: now, progress: 0, versionAtEnrollment: course.version }
    mem.enrollments.set(e.id, e)
    return e
  }
}
