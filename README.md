# Wildrose Painters - Residential Painting & Internal Platform

A modern, conversion-focused Next.js application for Wildrose Painters (Greater Edmonton Area) plus an evolving internal admin + contractor (HRM) foundation.

🌐 **Site**: <https://www.wildrosepainters.ca>

---

## 🎨 Core Services

- Fence Painting & Staining
- Deck Staining & Sealing
- Interior Residential Painting

## 🧩 Tech Stack

- Next.js 14 (App Router)
- TypeScript / Tailwind CSS / shadcn-ui (Radix primitives)
- Nodemailer (email pipeline)
- Redis (optional Upstash) abstraction (leads / analytics)
- SSE real-time streaming for new leads

## ✨ Feature Highlights

- Multi-step quote (quiz) form with attachments
- Anti-spam + rate limiting
- Structured data (LocalBusiness, Service, Reviews)
- Admin dashboard with real-time leads (SSE)
- Contractor portal (per-user auth, MVP)
- Analytics event stub (lead funnel instrumentation base)
- Security headers + CSP middleware

## 🛠 Development

```bash
pnpm install
pnpm dev
```

Build & start:

```bash
pnpm build
pnpm start
```

## 🧾 Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
SMTP_EMAIL=youremail@example.com
SMTP_PASSWORD=app_specific_password
CONTACT_FORM_TO=recipient@example.com
COMPANY_PHONE=(587) 501-6994
COMPANY_NAME=Wildrose Painters
COMPANY_DOMAIN=wildrosepainters.ca

# Optional store + redis
STORE_DRIVER=memory
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

LEADS_LIST_MAX=500
ANALYTICS_MAX=1000

# CSP
CSP_EXTRA_CONNECT=
CSP_REPORT_ONLY=0

# Admin auth
ADMIN_SESSION_SECRET=change_me_admin_secret
ADMIN_PASSWORD=change_me_admin_password
# Programmatic admin API key for buyer CRUD & lead exports (send as header x-admin-key)
ADMIN_API_KEY=change_me_admin_api_key

# Contractor / Employee auth
EMPLOYEE_SESSION_SECRET=change_me_employee_secret
EMPLOYEE_SEED_JSON=[]
```

If emails fail: verify SMTP credentials and check function logs.

## 👥 Contractor / Employee Authentication (MVP)

Separate from admin auth, supports per-user credentials until full HRM persistence lands.

| Item | Value |
|------|-------|
| Cookie | `emp_session` (HMAC, 8h) |
| Secret | `EMPLOYEE_SESSION_SECRET` |
| Seed Source | `EMPLOYEE_SEED_JSON` (JSON array) |
| Roles | employee < supervisor < admin |
| Login | POST `/api/employee/login` |
| Logout | POST `/api/employee/logout` |
| Portal Pages | `/portal/login`, `/portal/dashboard`, `/portal/courses`, `/portal/progress`, `/portal/agreement` |

Example seed (using plaintext - dev only):

```json
[
  {"id":"emp_alice","email":"alice@example.com","password":"alicepass","firstName":"Alice","lastName":"Painter","role":"employee","active":true}
]
```

Production-style hashed example (bcrypt):

```json
[
  {"id":"emp_alice","email":"alice@example.com","passwordHash":"$2a$10$u9b0iGZ0u7z1t2mHn0pG7O5ZyH3mCq0c2E7JYF8fQKp0WkR0Zk9hG","firstName":"Alice","lastName":"Painter","role":"employee","active":true}
]
```

Generate a bcrypt hash (Node REPL):

```js
const bcrypt = require('bcryptjs');
bcrypt.hashSync('alicepass', 10);
```

Security Hardening TODO (future):

- Hash passwords (argon2/bcrypt) not plain text
- Magic link or second factor (optional)
- Durable employee store (Redis/Postgres) & audit logs
- Password rotation + reset flow
- Rate limit per email + IP with persistence

## 🧪 Testing (Planned)

- API integration tests (contact form, auth)
- Lighthouse & accessibility audits
- Visual regression (Playwright screenshots)

## 📈 Roadmap (Selected)

- HRM course content & progress tracking
- Policy acknowledgment + compliance export
- Admin reviews moderation UI
- FAQ + FAQPage structured data
- Cross-business onboarding template

## 🛡 Security Middleware

Custom CSP + common security headers applied in `middleware.ts`. Adjust `CSP_EXTRA_CONNECT` for additional real-time or API origins.

## 📄 Contractor Agreement Acknowledgment (Legal)

Lightweight capture of contractor agreement signature (typed name) tied to employee session.

Environment variables:

```bash
CONTRACTOR_AGREEMENT_URL=https://example.com/contractor-agreement-v1.pdf
CONTRACTOR_AGREEMENT_VERSION=2025-10-07
CONTRACTOR_AGREEMENT_PDF_SHA256=<optional sha256>
```

User Flow:

1. Contractor logs in -> visits `/portal/agreement`.
2. Status fetched via `GET /api/hrm/ack/contractor-agreement`.
3. If not acknowledged for current version, user opens PDF + types full legal name.
4. `POST /api/hrm/ack/contractor-agreement` writes append-only JSONL record with: employeeId, version, name, timestamp, IP, user agent, pdf URL/hash.
5. Version bump forces re-sign (old records preserved).

Storage:

- File: `data/contractor_agreement_acks.jsonl` (append-only) + in-memory index.
- Future: migrate to Redis/DB with export + hashing verification service.

API Shapes:

- GET -> `{ acknowledged, latest?, config }`
- POST success -> `{ success: true, record }`
- Duplicate same version -> 409 `{ message: 'Already acknowledged current version' }`

Security & Integrity:

- Session-based identity; ensure `EMPLOYEE_SESSION_SECRET` is strong.
- Provide PDF hash for audit trail; store PDF on immutable hosting.
- Optionally capture additional consent checkboxes or a typed initials field.

## 🏫 HRM Course & Enrollment API (MVP)

Initial lightweight training/compliance tracking using append-only JSONL (same durability level as agreement acknowledgments). Designed for quick iteration before migrating to a database.

Data Files (append-only):

- `data/hrm_courses.jsonl`
- `data/hrm_enrollments.jsonl`
- `data/hrm_completions.jsonl`

Demo Seed:
Run `pnpm seed:hrm` to create two example courses (idempotent: skips existing by title) so the `/portal/courses` and `/portal/progress` pages have visible data.
If you also seed employees (see below) they will be auto-enrolled into the demo courses.

Employee Demo Seed:
Run `pnpm seed:employees` to inject three demo users into `.env.local` (admin, supervisor, employee). Safe to re-run; it only appends missing IDs.
Or run `pnpm demo:all` to seed employees and courses together (includes auto-enrollment).

Security Note: Demo seed users use plaintext passwords for local convenience. Before deploying production, replace each with a `passwordHash` (bcrypt) and remove the `password` field.

Entity Summary:

- Course: versioned; version auto-increments when modules list changes.
- Enrollment: one active per (employee, course); stores `versionAtEnrollment`.
- ModuleCompletion: per module per enrollment; progress recalculated after each completion.

RBAC:

- List courses: any authenticated employee.
- Create course: admin only.
- Update course: supervisor+.
- Enroll self: employee.
- Enroll others: admin.
- Mark completion: enrolled employee (or admin forced complete if future endpoint added).
- Aggregated progress (all employees): admin only; individual summary: self.

Endpoints:

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/hrm/courses` | List courses | employee |
| POST | `/api/hrm/courses` | Create course | admin |
| GET | `/api/hrm/courses/{id}` | Fetch single | employee |
| PUT | `/api/hrm/courses/{id}` | Update (title/desc/modules) | supervisor |
| POST | `/api/hrm/courses/{id}/enroll` | Enroll self (or other if admin) | employee / admin |
| POST | `/api/hrm/courses/{id}/complete` | Complete module or whole course | enrolled employee |
| GET | `/api/hrm/enrollments` | List own (admin can query others) | employee |
| GET | `/api/hrm/progress` | Self summary or all (admin) | employee |
| GET | `/api/hrm/enrollments/{enrollmentId}/completions` | List module completions for an enrollment | employee (owner) / admin |

POST /api/hrm/courses body example:

```json
{
  "title": "Fall Protection Basics",
  "description": "Core safety principles",
  "mandatory": true,
  "tags": ["safety","2025"],
  "modules": [
    {"title":"Intro","contentType":"markdown","contentRef":"/training/fall/intro.md","estMinutes":5},
    {"title":"Checklist","contentType":"link","contentRef":"https://example.com/fall-checklist","estMinutes":3}
  ]
}
```

PUT /api/hrm/courses/{id} body (any field optional; modules replacement bumps version):

```json
{
  "title": "Fall Protection Essentials v2",
  "modules": [
    {"id":"mod_existingId","title":"Intro Updated","contentType":"markdown","contentRef":"/training/fall/intro-v2.md"},
    {"title":"New Hazard Scenarios","contentType":"markdown","contentRef":"/training/fall/scenarios.md"}
  ]
}
```

Enroll (self):

```bash
POST /api/hrm/courses/{courseId}/enroll
```

Enroll other employee (admin):

```json
{"employeeId":"emp_alice"}
```

Complete a module:

```json
{"moduleId":"mod_abc123"}
```

Complete entire course (all modules considered done):

```json
{}
```

Progress summary examples:

- Self: `GET /api/hrm/progress`
- Specific employee (admin): `GET /api/hrm/progress?employeeId=emp_alice`
- All employees (admin): `GET /api/hrm/progress`

Compliance Export Endpoints (admin only):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hrm/export/acks` | Contractor agreement acknowledgments CSV |
| GET | `/api/hrm/export/training` | Training progress CSV (per employee summary) |

Future Enhancements:

- Soft-delete / archive courses (record state changes)
- Redis / DB persistence & migrations
- Enrollment due dates + reminders
- Supervisor dashboards (filtered progress)
- CSV/JSON exports for compliance
- Module content signing / checksum validation

Limitations (MVP):

- No deletion; new course versions created only by replacing modules list.
- No pagination (in-memory indexes; acceptable for small scale).
- Race conditions possible under concurrent writes (low likelihood in early stage).
- No external content validation (assumes `contentRef` is retrievable).

## 📬 Lead Flow Summary

### Enriched Lead & Scoring (Monetization Layer)

Each submitted contact form (non-bot) now generates an enriched lead record persisted append-only at `data/enriched_leads.jsonl`.

Schema (`EnrichedLead`):

```ts
interface EnrichedLead {
  id: string
  createdAt: string
  name: string
  email: string
  phone: string
  service: string
  message: string
  urgency?: 'asap' | '30d' | 'planning'
  budgetBand?: 'under2k' | '2to5k' | '5to10k' | '10kplus'
  addons?: string[]
  utm?: Record<string,string | undefined>
  photos?: number // number of validated photo attachments
  consentShare?: boolean // user agreed to share details with contractor
  duplicateRecent?: boolean // true if same phone/email appeared in last 14 days
  rawScore: number
  normalizedScore: number // 0-100 (raw scaled & capped)
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
}
```

Scoring Weights (in `lib/leads/scoring.ts`):

| Factor | Logic | Max |
|--------|-------|-----|
| Urgency | asap=40, 30d=25, planning=10 | 40 |
| Budget | 10kplus=40, 5to10k=30, 2to5k=15, under2k=5 | 40 |
| Photos | 8 pts each (validated) | 24 |
| Addons | 5 pts each | 20 |
| Raw Total | Sum | 124 |
| Normalized | `Math.min(100, Math.round(raw / 1.24))` | 100 |

Primary usage: prioritize callback order; potential future segmentation for automated nurture.

### Lead Endpoints (Admin / Internal)

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| GET | `/api/leads` | List enriched leads | Filters: `status`, `minScore`, `limit` |
| POST | `/api/leads/:id/status` | Update status lifecycle | Body: `{ status }` |
| POST | `/api/leads/:id/reply-draft` | Generate a suggested email reply draft | Returns `{ draft }` |
| POST | `/api/internal/lead-drip/process` | Process due drip follow-ups | Requires `x-internal-key` header |

Authentication / gating: Currently aligned with existing admin session / simple header secret for internal processing. Strengthen before production (JWT or role-verified server action, remove shared secret).

### Drip Queue

File: `data/lead_drip_queue.jsonl` (append-only). Events appended when a lead is created:

```ts
interface DripEvent {
  id: string
  leadId: string
  runAt: string // ISO timestamp
  template: 'follow_24h' | 'follow_72h'
  sent?: string
}
```

On contact submission two events schedule at +24h and +72h. Processing endpoint (`/api/internal/lead-drip/process`) loads due events (`runAt <= now`, not sent), sends a lightweight follow-up email, marks events `sent`, and auto-updates lead `status` from `new` -> `contacted` if applicable.

Invoke processing (example PowerShell):

```powershell
curl -X POST https://localhost:3000/api/internal/lead-drip/process -H "x-internal-key: $env:INTERNAL_TASK_KEY"
```

Set environment variable in `.env.local`:

```bash
INTERNAL_TASK_KEY=change_me_internal_task_secret
```

### Operational Notes

- Append-only JSONL permits simple last-write-wins reconstruction in memory. Status changes are appended as full row snapshots.
- Race conditions are low-risk at current traffic; for scale migrate to durable DB (Postgres) with explicit transactions or optimistic concurrency (`updatedAt` compare).
- Future: Add /api/leads/:id timeline, integrate SSE broadcast, build portal UI table for direct status changes and reply-draft copy button.
- Security TODO: Replace header secret with authenticated server-side cron (Vercel cron invoking internal route via signed token or edge middleware verifying HMAC).
- Duplicate detection now flags `duplicateRecent` when the same phone OR email has appeared within the rolling 14-day window (tracked event: `lead.duplicate_detected`). This is surfaced to buyers via `X-Duplicate-Recent` header on routed lead emails.

### Lead Export (CSV)

Admin-authenticated export endpoint for operational billing / analysis.

Endpoint:

```http
GET /api/leads/export
Header: x-admin-key: $ADMIN_API_KEY
```

Returns `text/csv` with columns:

`id,createdAt,name,email,phone,service,urgency,budgetBand,addons,photos,rawScore,normalizedScore,status,consentShare,duplicateRecent`

Notes:

- `addons` pipe-delimited (`|`).
- Booleans serialized as `true/false`.
- Escapes commas and quotes per RFC4180 minimal quoting.
- Intended for quick spreadsheet import or downstream BI tool staging.

Planned Enhancements:

- Date range filtering (`?from=ISO&to=ISO`).
- Service / minScore query params.
- JSON format variant (`?format=json`).
- Pagination once volume warrants.

### Buyer Model & Routing (MVP)

Early monetization layer allowing automatic assignment of a new enriched lead to one qualified buyer (exclusive delivery). Buyers persist append-only in `data/buyers.jsonl`.

Buyer Schema:

```ts
interface Buyer {
  id: string
  name: string
  contactEmail: string
  active: boolean
  minScore: number
  services: string[]
  postalPrefixes: string[]
  dailyCap: number
  deliveredToday: number
  lastDeliveryDate?: string
  webhookUrl?: string
  pricePerLeadCents: number // exclusive lead charge
  creditCents: number // remaining pre-paid balance
  lowBalanceThresholdCents?: number // alert threshold (default 5000 = $50)
  lastLowBalanceAlertAt?: string // ISO timestamp for 24h cooldown
  createdAt: string
  updatedAt: string
}
```

Routing Logic (in `lib/leads/routing.ts`):

1. Filter by: active, lead score >= minScore, service inclusion, geo prefix (if provided), daily cap (resets per day).
2. Priority sort: `minScore * 100 - deliveredToday` (favors higher standards & load balances).
3. First candidate returned.

On contact submission:

1. Lead enriched & stored.
2. `selectBuyerForLead` invoked.
3. If a buyer selected → email dispatched (`Lead Dispatch`), delivery logged to `data/lead_deliveries.jsonl`, buyer delivery counter incremented.
4. If none → tracking event `lead.routing.none`.

### Pricing & Billing (Prepaid Wallet MVP)

Each buyer now has:

- `pricePerLeadCents`: Amount deducted per successfully delivered exclusive lead (default 2500 = $25)
- `creditCents`: Prepaid balance; routing skips buyers whose `creditCents < pricePerLeadCents`
- `lowBalanceThresholdCents`: Trigger alert when `creditCents <= threshold` (default 5000 = $50)
- `lastLowBalanceAlertAt`: Prevents duplicate alerts within 24h

Charge Flow:

1. Lead submitted & enriched.
2. Buyer selected (credit check passes).
3. Email delivery succeeds.
4. `creditCents` reduced by `pricePerLeadCents` and a billing transaction logged (`type: lead_charge`).
5. Delivery + billing events can be exported for reconciliation.


Funding:

Admin can add funds via:

```http
POST /api/buyers/{id}/fund
Header: x-admin-key: $ADMIN_API_KEY
Body: { "amountCents": 5000, "note": "Initial deposit" }
```

Billing Transactions API:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/billing/transactions` | List transactions (optional `?buyerId=` & `?limit=`) |
| GET | `/api/billing/export` | CSV export (filters: `?from=ISO&to=ISO&buyerId=`) |
| POST | `/api/billing/refund` | Refund/credit buyer (body: buyerId, amountCents, note?, leadId?) |
| POST | `/api/billing/low-balance/check` | Scan buyers & send low balance alerts |

Billing CSV Columns:
`id,createdAt,buyerId,type,amountCents,balanceAfterCents,meta`

Transaction Semantics:

- Funding: positive `amountCents` (adds credit), `type=fund`.
- Lead Charge: negative `amountCents` (recorded as negative), `type=lead_charge`.
- Balance after each transaction stored redundantly for snapshot integrity.

Export Filters:

- Leads CSV: `GET /api/leads/export?from=2025-10-01&to=2025-10-07&service=deck`
- Billing CSV: `GET /api/billing/export?from=2025-10-01&buyerId=buyer_abc`

Refund Endpoint Example:

```http
POST /api/billing/refund
Header: x-admin-key: $ADMIN_API_KEY
Body: { "buyerId": "buyer_123", "amountCents": 2500, "note": "Service issue", "leadId": "lead_789" }
```

Low Balance Check (cron invocation example):

```http
POST /api/billing/low-balance/check
Header: x-admin-key: $ADMIN_API_KEY
```

Forward Roadmap Ideas:

- Automated recurring invoice summary.
- Daily invoice summary generation.
- Refund / adjustment transaction type.
- Tiered pricing (score bands) or dynamic surge pricing.
- Multi-buyer shared distribution with per-share billing.

Delivery Log Schema (`lead_deliveries.jsonl`):

```ts
interface LeadDelivery {
  id: string
  leadId: string
  buyerId: string
  createdAt: string
  method: 'email' | 'webhook'
  status: 'sent' | 'failed'
  latencyMs?: number
  error?: string
}
```

API Endpoints (Header: `x-admin-key: $ADMIN_API_KEY` required):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/buyers` | List buyers |
| POST | `/api/buyers` | Create buyer (body includes name, contactEmail, minScore, services, postalPrefixes, dailyCap) |
| POST | `/api/buyers/{id}/update` | Patch fields (e.g. active, minScore, dailyCap) |

Environment variable to add:

```bash
ADMIN_API_KEY=change_me_admin_api_key
```

Future Enhancements:

- Webhook delivery with retry + signature (HMAC).
- Shared (multi-buyer) allocation mode.
- Buyer portal UI (quota usage, delivery history, pause toggle).
- Stripe credit wallet + auto top-up.
- Score band pricing & A/B testing of form questions.
- Telephone/email validation enrichment for dispute reduction.



## 🚀 Demo Workflow

Local quick start with demo data:

```bash
pnpm install
pnpm demo:all       # seeds employees + courses and auto-enrolls them
pnpm dev            # start development server
```

Optional extra basic HRM function test (non-HTTP):

```bash
pnpm test:hrm-basic
```

CI pipeline (see `.github/workflows/ci.yml`) runs: install -> typecheck -> lint -> seeds -> basic test -> build.

Integration HTTP test (spins up dev server temporarily):

```bash
pnpm test:integration-hrm
```

Playwright end-to-end (launches dev server automatically if not running):

```bash
pnpm test:e2e
```

Form -> Validation / Anti-Spam -> Email dispatch -> CRM adapter (stub) -> Store (memory/redis) -> Real-time SSE broadcast -> Admin dashboard.

## 🤝 Contributing

Internal project. For external forks: open issues / PRs for enhancements.

---
Quality & Budget-Friendly Residential Painting Services

## 🏗 Deployment & Persistence (Vercel + Redis)

### Why Redis

Vercel build output (serverless / edge) runs on ephemeral filesystems: any runtime writes to `data/` are not durable across redeploys, region cold starts, or scale-out. To avoid losing billing / lead / drip state, the app now supports a dual-mode storage driver controlled by `STORE_DRIVER`.

| Subsystem | File Mode (default) | Redis Keys | Notes |
|-----------|---------------------|------------|-------|
| Leads (enriched) | `data/enriched_leads.jsonl` | `leads:log`, `leads:latest` (hash per id) | Append-only log + latest snapshot per lead |
| Buyers | `data/buyers.jsonl` | `buyers:log`, `buyers:latest` | Pricing & credit wallet fields included |
| Billing Transactions | `data/billing_transactions.jsonl` | `billing:log` | Chronological list (fund, lead_charge, refund) |
| Lead Deliveries | `data/lead_deliveries.jsonl` | `lead_deliveries:log` | Delivery outcome & latency |
| Drip Queue | `data/lead_drip_queue.jsonl` | `drip:queue` | Simple list rewritten on status update |

Set:

```bash
STORE_DRIVER=redis
UPSTASH_REDIS_REST_URL=...   # from Upstash console
UPSTASH_REDIS_REST_TOKEN=...
```

Falls back to file mode locally if unset. Sync helpers emit a warning when Redis is enabled (favor async variants in future refactors).

### Health Endpoint

`GET /api/health` returns JSON:

```json
{
  "ok": true,
  "time": "2025-10-07T18:20:00.000Z",
  "env": "preview",
  "commit": "abc1234",
  "redis": "ok",
  "redisPingMs": 42,
  "storeDriver": "redis",
  "nodeVersion": "v18.x"
}
```

Use for uptime probes or Vercel status checks. Add a synthetic check (Better Stack / Cronitor) pointing at this endpoint.

### Scheduled / Cron Tasks

Vercel Cron can POST internal endpoints (e.g., drip processing, low balance alerts). Protect with a static secret header or upgrade to signed timestamp tokens.

Recommended schedule examples:

| Purpose | Endpoint | Frequency |
|---------|----------|-----------|
| Drip follow-ups | `/api/internal/lead-drip/process` | Every 30 min |
| Low balance alert scan | `/api/billing/low-balance/check` | Hourly |

Add in `vercel.json`:

```jsonc
{
  "crons": [
    { "path": "/api/internal/lead-drip/process", "schedule": "*/30 * * * *" },
    { "path": "/api/billing/low-balance/check", "schedule": "0 * * * *" }
  ]
}
```

Then secure with header (example):

```
INTERNAL_TASK_KEY=change_me_internal_task_secret
```

Send as `x-internal-key` and verify in handlers.

### Environment Variable Summary (Deployment)

| Variable | Purpose |
|----------|---------|
| `STORE_DRIVER` | `file` or `redis` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis connectivity |
| `ADMIN_API_KEY` | Programmatic admin operations (exports, buyer CRUD) |
| `INTERNAL_TASK_KEY` | Auth for internal cron-executed routes |
| `VERCEL_GIT_COMMIT_SHA` | (Optional) surfaced in `/api/health` |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | Email dispatch |
| `EMPLOYEE_SESSION_SECRET` / `ADMIN_SESSION_SECRET` | Auth session signing |

### Local vs Production Behavior

| Aspect | Local File Mode | Production Redis Mode |
|--------|-----------------|-----------------------|
| Durability | Data lost on cleanup | Persistent (Upstash) |
| Concurrency | Single-process safe | Multi-region eventual; acceptable given append pattern |
| Drip Updates | Append a new line | Rewrite Redis list (small scale OK) |
| Buyer Credit Deduction | In-memory + file flush | Single LIST append; race risk low volume (future: atomic Lua) |
| Exports | Read & parse entire file | LRange + JSON parse |

### Future Persistence Evolution

1. Add lightweight aggregate/materialized keys (e.g., `buyers:balance:<id>`).
2. Introduce ZSET for drip scheduling (`drip:due`) for O(log n) due polling.
3. Migrate to Postgres (temporal tables) for analytics, audit queries, financial reconciliation.
4. Add idempotency + optimistic concurrency (version field per entity).

## ✅ CI Pipeline (GitHub Actions)

Add a workflow at `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm build
```

## 🚀 Production Quick Checklist

| Step | Action | Done |
|------|--------|------|
| 1 | Push repo to GitHub (main branch) |  |
| 2 | Create Vercel project (import repo) |  |
| 3 | Add env vars (see table below) |  |
| 4 | Provision Upstash Redis + set `STORE_DRIVER=redis` |  |
| 5 | Deploy & check `/api/health` |  |
| 6 | Run `pnpm seed:buyer` (optional) |  |
| 7 | Submit test lead (form) |  |
| 8 | Verify Redis keys (`leads:log`, `buyers:latest`) |  |
| 9 | Add custom domain & DNS |  |
| 10 | (Optional) Cron tasks active (drip / low balance) |  |
| 11 | Rotate placeholder secrets |  |
| 12 | Secure admin key storage (password manager) |  |

Minimal Vercel Environment Variables:

```bash
COMPANY_NAME=Wildrose Painters
COMPANY_DOMAIN=wildrosepainters.ca
COMPANY_PHONE=(587) 501-6994
CONTACT_FORM_TO=you@example.com
SMTP_EMAIL=you@example.com
SMTP_PASSWORD=app_password
ADMIN_API_KEY=prod_admin_key_change
INTERNAL_TASK_KEY=prod_internal_key_change
EMPLOYEE_SESSION_SECRET=long_random_emp_secret
ADMIN_SESSION_SECRET=long_random_admin_secret
STORE_DRIVER=redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Optional:

```bash
CSP_EXTRA_CONNECT=
CONTRACTOR_AGREEMENT_URL=
CONTRACTOR_AGREEMENT_VERSION=2025-10-07
```

Validation Steps:
1. Open `/api/health` → `redis: ok`.
2. Submit contact form.
3. Inspect Upstash: LIST `leads:log` length >= 1.
4. (If buyer seeded) ensure lead routes & credit deducts (check `billing:log`).

Rollback:
- Revert commit on GitHub; Vercel redeploys.
- Last resort only: temporarily unset `STORE_DRIVER` (file fallback) if Redis outage.

Monitoring Ideas:
- Add external uptime monitor for `/api/health`.
- Track daily lead count via cron + external logging.
- Alert when credit for key buyers < threshold.

## 🖥 Minimal Admin UI (`/admin`)

A lightweight in-app dashboard is available at `/admin` to reduce manual API calls.

Features:
- Enter & persist `x-admin-key` (localStorage) for subsequent operations.
- List buyers with credit, price, activity status.
- Create new buyer (sets services fence/deck/interior by default).
- Fund buyer credit (amount in cents) & toggle active status.
- View system health (Redis, store driver, commit, env).
- Quick recent leads snapshot (iframe export fallback).

Usage:
1. Navigate to `/admin`.
2. Paste your `ADMIN_API_KEY` into the field (stored locally only).
3. Click Refresh buyers.
4. (Optional) Create buyer or fund existing.
5. Submit a public form lead in another tab and watch credit deduct when routed.

Removal / Hardening (future):
- Replace iframe with secure paginated API + status update actions.
- Add server-side auth wrapper (session-based) instead of header key.
- Log admin actions (funding, creation) to an audit trail.


Extend later with lint, unit tests, and integration scripts when added.

---
