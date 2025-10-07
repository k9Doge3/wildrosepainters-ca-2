#!/usr/bin/env ts-node
/**
 * Demo Employee Seed Script
 *
 * Ensures .env.local contains a populated EMPLOYEE_SEED_JSON with demo users.
 * Will append or replace the EMPLOYEE_SEED_JSON line. Other lines left untouched.
 * Idempotent: if all demo IDs already present, it does nothing.
 */

import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '.env.local')

interface DemoEmployee { id:string; email:string; firstName:string; lastName:string; role:string; password?:string }
const demoEmployees: DemoEmployee[] = [
  { id: 'emp_admin', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'admin', password: 'adminpass' },
  { id: 'emp_super', email: 'supervisor@example.com', firstName: 'Sue', lastName: 'Pervisor', role: 'supervisor', password: 'superpass' },
  { id: 'emp_worker', email: 'worker@example.com', firstName: 'Will', lastName: 'Worker', role: 'employee', password: 'workerpass' }
]

function run() {
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found. Create it from .env.local.example first.')
    process.exit(1)
  }
  const raw = fs.readFileSync(envPath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const seedLineIndex = lines.findIndex(l => l.startsWith('EMPLOYEE_SEED_JSON='))
  let current: DemoEmployee[] = []
  if (seedLineIndex !== -1) {
    const val = lines[seedLineIndex].substring('EMPLOYEE_SEED_JSON='.length).trim()
    try {
      if (val && val !== '[]') current = JSON.parse(val)
    } catch {/* ignore parse errors */}
  }
  const currentIds = new Set(current.map(e => e.id))
  let added = 0
  for (const d of demoEmployees) {
    if (!currentIds.has(d.id)) {
      current.push(d)
      added++
    }
  }
  if (added === 0) {
    console.log('All demo employees already present. No changes.')
    return
  }
  const newValue = 'EMPLOYEE_SEED_JSON=' + JSON.stringify(current)
  if (seedLineIndex === -1) {
    lines.push(newValue)
  } else {
    lines[seedLineIndex] = newValue
  }
  fs.writeFileSync(envPath, lines.join('\n'))
  console.log(`Updated .env.local with ${added} new demo employee(s).`) }

run()
