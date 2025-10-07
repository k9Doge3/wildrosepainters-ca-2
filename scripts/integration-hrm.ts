#!/usr/bin/env ts-node
/**
 * Integration test: spins up Next dev server, seeds demo data, performs login + HRM flows via HTTP.
 * NOTE: Simplified for MVP. Not a replacement for full test framework.
 */
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const root = process.cwd()

function wait(ms:number){ return new Promise(r=>setTimeout(r,ms)) }

async function ensureEnv() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(root, '.env.local.example'), envPath)
  }
  // Guarantee required secrets & empty seed array baseline (seeds will fill it)
  const existing = fs.readFileSync(envPath,'utf8')
  const lines = existing.split(/\r?\n/)
  const setLine = (key:string,val:string)=>{
    const idx = lines.findIndex(l=>l.startsWith(key+'='))
    if (idx === -1) {
      lines.push(`${key}=${val}`)
    } else {
      lines[idx] = `${key}=${val}`
    }
  }
  setLine('EMPLOYEE_SESSION_SECRET','integration_secret')
  if (!lines.some(l=>l.startsWith('EMPLOYEE_SEED_JSON='))) lines.push('EMPLOYEE_SEED_JSON=[]')
  fs.writeFileSync(envPath, lines.join('\n'))
}

async function runSeeds() {
  await execP('pnpm seed:employees')
  await execP('pnpm seed:hrm')
}

function execP(cmd:string){
  return new Promise<void>((resolve,reject)=>{
    const child = spawn(cmd, { shell:true, stdio:'inherit' })
    child.on('exit',code=> code===0?resolve():reject(new Error(cmd+" exited "+code)))
  })
}

async function startServer():Promise<{proc:ReturnType<typeof spawn>; base:string}> {
  const proc = spawn('pnpm dev', { shell:true, cwd:root, stdio:'inherit' })
  // Crude wait; could poll localhost:3000
  await wait(8000)
  return { proc, base: 'http://localhost:3000' }
}

async function fetchJson(url:string, init?:RequestInit, cookieJar?:string[]):Promise<{json:any; headers:Record<string,string>; cookies:string[]}> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init?.headers||{}),
      ...(cookieJar?.length? { 'Cookie': cookieJar.join('; ') }: {})
    }
  })
  const txt = await res.text()
  let j:any
  try { j = JSON.parse(txt) } catch { j = { raw: txt } }
  const set = res.headers.getSetCookie?.() || []
  return { json: j, headers: Object.fromEntries([...res.headers.entries()]), cookies: set }
}

function extractSession(cookies:string[], name:string){
  const jar: string[] = []
  for (const c of cookies) {
    jar.push(c.split(';')[0])
  }
  return jar.filter(c=>c.startsWith(name+'='))
}

async function main() {
  await ensureEnv()
  await runSeeds()
  const { proc, base } = await startServer()
  let fail = false
  try {
    // Login (employee: admin)
    const login = await fetchJson(base + '/api/employee/login', { method:'POST', body: JSON.stringify({ email:'admin@example.com', password:'adminpass' }) })
    if (!login.cookies.length) throw new Error('No cookies on login')
    const sessionCookies = extractSession(login.cookies, 'emp_session')
    if (!sessionCookies.length) throw new Error('Missing emp_session cookie')

    // List courses
    const courses = await fetchJson(base + '/api/hrm/courses', {}, sessionCookies)
    if (!Array.isArray(courses.json.courses)) throw new Error('Courses list malformed')

    // Enroll admin into first course (should already be enrolled via auto-enroll but safe)
    const first = courses.json.courses[0]
    if (first) {
      await fetchJson(base + `/api/hrm/courses/${first.id}/enroll`, { method:'POST' }, sessionCookies)
      // Get progress
      const progress = await fetchJson(base + '/api/hrm/progress', {}, sessionCookies)
      if (!(progress.json.summary || progress.json.summaries)) throw new Error('Progress response unexpected')
    }

    console.log('\nIntegration HRM test SUCCESS')
  } catch (e:any) {
    fail = true
    console.error('Integration test failure:', e.message)
  } finally {
    proc.kill('SIGINT')
  }
  if (fail) process.exit(1)
}

main().catch(e=>{ console.error(e); process.exit(1) })
