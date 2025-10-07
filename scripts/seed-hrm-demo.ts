#!/usr/bin/env ts-node
/**
 * HRM Demo Seed Script
 *
 * Adds a couple of demo courses (if none exist) so the portal pages have visible data.
 * Safe to run multiple times (idempotent: checks by exact title).
 */

import { listCourses, createCourse, enrollEmployee, listEnrollments } from '../lib/hrm/course-store'
import fs from 'fs'
import path from 'path'

async function main() {
  const existing = listCourses()
  const titles = new Set(existing.map(c => c.title))
  const planned = [
    {
      title: 'Fall Protection Basics',
      description: 'Core safety principles for working at height. Review before any elevated task.',
      mandatory: true,
      tags: ['safety','2025'],
      modules: [
        { title: 'Introduction', contentType: 'markdown', contentRef: '/training/fall/intro.md', estMinutes: 5 },
        { title: 'Equipment Checklist', contentType: 'link', contentRef: 'https://example.com/fall-checklist', estMinutes: 3 },
        { title: 'Short Quiz', contentType: 'markdown', contentRef: '/training/fall/quiz.md', estMinutes: 4 }
      ]
    },
    {
      title: 'Surface Prep & Materials',
      description: 'Covers surface preparation, priming, and material selection for consistent quality.',
      mandatory: false,
      tags: ['operations'],
      modules: [
        { title: 'Surface Assessment', contentType: 'markdown', contentRef: '/training/prep/assessment.md', estMinutes: 6 },
        { title: 'Primers Overview', contentType: 'markdown', contentRef: '/training/prep/primers.md', estMinutes: 5 },
        { title: 'Material Handling', contentType: 'markdown', contentRef: '/training/prep/handling.md', estMinutes: 5 }
      ]
    }
  ]

  let created = 0
  for (const p of planned) {
    if (!titles.has(p.title)) {
      createCourse(p as any)
      created++
      console.log('Created course:', p.title)
    } else {
      console.log('Skipped existing course:', p.title)
    }
  }

  if (created === 0) {
    console.log('No new courses created. (Already seeded)')
  } else {
    console.log(`Seed complete. Added ${created} course(s).`)
  }

  // Auto-enroll demo employees (if EMPLOYEE_SEED_JSON present in .env.local)
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const line = content.split(/\r?\n/).find(l => l.startsWith('EMPLOYEE_SEED_JSON='))
      if (line) {
        const jsonPart = line.substring('EMPLOYEE_SEED_JSON='.length)
        if (jsonPart && jsonPart !== '[]') {
          const arr = JSON.parse(jsonPart)
          const employeeIds: string[] = arr.map((e: any) => e.id).filter(Boolean)
          const coursesNow = listCourses()
            .filter(c => planned.some(p => p.title === c.title))
          let enrollCount = 0
            for (const empId of employeeIds) {
              for (const course of coursesNow) {
                const already = listEnrollments({ employeeId: empId, courseId: course.id })
                if (already.length === 0) {
                  try {
                    enrollEmployee(empId, course.id)
                    enrollCount++
                  } catch {/* ignore */}
                }
              }
            }
          if (enrollCount > 0) console.log(`Auto-enrolled demo employees in ${enrollCount} enrollment(s).`)
        }
      }
    }
  } catch (e) {
    console.warn('Auto-enroll step failed (non-fatal):', (e as Error).message)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
