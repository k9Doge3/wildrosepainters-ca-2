// HRM domain model definitions (initial scaffold)

export type EmployeeRole = 'employee' | 'supervisor' | 'admin'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: EmployeeRole
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CourseModule {
  id: string
  title: string
  order: number
  contentType: 'markdown' | 'html' | 'link'
  contentRef: string // path or external URL
  estMinutes?: number
}

export interface Course {
  id: string
  title: string
  description?: string
  version: number
  mandatory: boolean
  tags?: string[]
  modules: CourseModule[]
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: string
  employeeId: string
  courseId: string
  assignedAt: string
  dueAt?: string
  completedAt?: string
  progress: number // 0..100
  versionAtEnrollment: number
}

export interface ModuleCompletion {
  id: string
  enrollmentId: string
  moduleId: string
  completedAt: string
}

export interface PolicyAcknowledgment {
  id: string
  employeeId: string
  policyKey: string
  acknowledgedAt: string
  version: string
}

// Key namespace helpers for Redis / store
export const HRMKeys = {
  employee: (id: string) => `hrm:emp:${id}`,
  employeesIndex: 'hrm:emp:index', // set of IDs
  course: (id: string) => `hrm:course:${id}`,
  coursesIndex: 'hrm:course:index',
  enrollment: (id: string) => `hrm:enroll:${id}`,
  enrollmentByEmp: (empId: string) => `hrm:enroll:emp:${empId}`, // set of enrollment IDs
  enrollmentByCourse: (courseId: string) => `hrm:enroll:course:${courseId}`,
  moduleCompletion: (id: string) => `hrm:modc:${id}`,
  completionByEnrollment: (enrollId: string) => `hrm:modc:enroll:${enrollId}`,
  policyAck: (id: string) => `hrm:ack:${id}`,
  policyAckIndex: (empId: string, policyKey: string) => `hrm:ack:${empId}:${policyKey}`
}

// Simple ID generator (can later swap for nanoid)
export function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2,10)}`
}
