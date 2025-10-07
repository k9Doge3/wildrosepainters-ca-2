#!/usr/bin/env ts-node
/**
 * Basic HRM sanity test (direct function-level) - does not hit HTTP layer.
 */
import { createCourse, listCourses, enrollEmployee, listEnrollments, completeModule } from '../lib/hrm/course-store'

function log(title: string, data: any) {
  console.log('--- ' + title + ' ---')
  console.log(JSON.stringify(data, null, 2))
}

async function run() {
  // Create a quick ephemeral course
  const course = createCourse({
    title: 'Test Course ' + Date.now(),
    description: 'Ephemeral test',
    modules: [
      { title: 'M1', contentType: 'markdown', contentRef: '/m1.md', estMinutes: 1 },
      { title: 'M2', contentType: 'markdown', contentRef: '/m2.md', estMinutes: 1 }
    ]
  })
  log('Created Course', course)

  // Enroll fake employee
  const empId = 'emp_test_runner'
  const enrollment = enrollEmployee(empId, course.id)
  log('Enrollment', enrollment)

  // Complete modules
  const modules = course.modules
  for (const m of modules) {
    const result = completeModule(enrollment.id, m.id)
    log('Module Completed ' + m.title, { progress: result.enrollment.progress })
  }

  log('Enrollments Final', listEnrollments({ employeeId: empId }))
  console.log('HRM basic test finished OK.')
}

run().catch(e => { console.error(e); process.exit(1) })
