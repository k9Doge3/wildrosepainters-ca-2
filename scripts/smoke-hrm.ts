/*
  Minimal smoke test for HRM & acknowledgment endpoints.
  Assumes dev server running on http://localhost:3000 and an admin employee seed exists.
  You can run with:  pnpm ts-node scripts/smoke-hrm.ts  (if ts-node installed) or compile via ts-node/register.
  To avoid adding deps, this is TypeScript but can be converted to JS easily.
*/

// Note: Keeping this lightweight; does not assert strongly, just logs outcomes.

const BASE = process.env.SMOKE_BASE || 'http://localhost:3000'

async function main() {
  console.log('HRM Smoke Test Starting ->', BASE)
  // Anonymous: list courses should fail (401)
  let res = await fetch(BASE + '/api/hrm/courses')
  console.log('Anon list courses status', res.status)

  // (Manual step) You would login via portal to establish cookie; programmatic login not included to avoid embedding credentials.
  console.log('NOTE: For full automated smoke, extend script to perform login and reuse Set-Cookie header.')
}

main().catch(e => { console.error(e); process.exit(1) })
