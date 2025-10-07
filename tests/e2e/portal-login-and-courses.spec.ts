import { test, expect, Page } from '@playwright/test'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

let serverProcess: ReturnType<typeof spawn> | null = null

async function ensureEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync('.env.local.example', '.env.local')
  }
  const content = fs.readFileSync(envPath,'utf8')
  if (!content.includes('EMPLOYEE_SESSION_SECRET=')) fs.appendFileSync(envPath,'\nEMPLOYEE_SESSION_SECRET=playwright_secret')
  if (!content.includes('EMPLOYEE_SEED_JSON=')) fs.appendFileSync(envPath,'\nEMPLOYEE_SEED_JSON=[]')
}

async function startIfNeeded() {
  if (process.env.PLAYWRIGHT_BASE_URL) return // assume external server
  await ensureEnv()
  await runCmd('pnpm demo:all')
  serverProcess = spawn('pnpm dev', { shell:true, stdio:'inherit' })
  await new Promise(r => setTimeout(r, 7000))
}

async function stopIfStarted() {
  if (serverProcess) serverProcess.kill('SIGINT')
}

function runCmd(cmd: string) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, { shell: true, stdio: 'inherit' })
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(cmd + ' exited ' + code)))
  })
}

test.describe('Portal Login & Courses', () => {
  test.beforeAll(async () => {
    await startIfNeeded()
  })

  test.afterAll(async () => {
    await stopIfStarted()
  })

  test('login, complete first module, view progress', async ({ page }: { page: Page }) => {
    await page.goto('/portal/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('adminpass')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL('**/portal/dashboard')

    // Navigate to Courses
    await page.goto('/portal/courses')
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()

    // Expect at least one course card (demo seed)
    const courseCards = page.locator('div').filter({ hasText: 'Version' })
    await expect(courseCards.first()).toBeVisible()

    // Open first course
    await page.getByRole('link', { name: 'Open' }).first().click()
    await expect(page.getByRole('heading')).toContainText(/Version/)  // heading includes version number line

    // Mark first module done (if button present)
    const markBtn = page.getByRole('button', { name: 'Mark Module Done' }).first()
    if (await markBtn.isVisible()) {
      await markBtn.click()
      // After refresh the page may reload; wait for Done badge
      await expect(page.getByText('Done').first()).toBeVisible()
    }

    // Progress page
    await page.goto('/portal/progress')
    await expect(page.getByRole('heading', { name: 'Training Progress' })).toBeVisible()
  })
})
