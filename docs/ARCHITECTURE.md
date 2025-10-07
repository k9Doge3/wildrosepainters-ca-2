# System Architecture Overview

## Layers

- Presentation: Next.js App Router pages & React components.
- API: Route handlers in `app/api/**` encapsulating validation + RBAC + orchestration.
- Domain / Services: Modules in `lib/**` (auth, HRM, lead handling, logging, realtime, analytics stub).
- Persistence: JSONL append stores (acks, HRM), in-memory maps, optional Redis abstraction for leads/analytics.
- Integration: Email (Nodemailer), CRM dispatch adapter (stubbed for future external systems).

## Key Modules

| Concern | Location | Notes |
|---------|----------|-------|
| Lead Intake | `app/api/contact/route.ts` | Validates, anti-spam, logs, emits realtime, emails, CRM dispatch. |
| Realtime | `lib/realtime/*` + SSE route | In-process EventEmitter -> SSE streaming to admin dashboard. |
| Auth (Admin) | `lib/admin-auth.ts` | HMAC session cookie, single admin password (MVP). |
| Auth (Employee) | `lib/employee-auth.ts` | Per-user seed, roles, HMAC session cookie. |
| HRM Courses | `lib/hrm/course-store.ts` | JSONL-backed courses, enrollments, completions. |
| HRM Agreement | `lib/hrm/ack-store.ts` | Append-only contractor agreement acknowledgments. |
| Security Middleware | `middleware.ts` | CSP + headers; configurable via env vars. |
| Analytics Stub | `lib/analytics.ts` | Placeholder for funnel events & future metrics. |
| Structured Data | `lib/structured-data.ts` | JSON-LD assembly for SEO (LocalBusiness, etc.). |

## Data Persistence Strategy

MVP intentionally favors simple file-based append-only logs for legally sensitive or sequential data (acknowledgments, HRM changes). Leads & analytics use memory/Redis abstraction enabling future multi-instance scaling.

### JSONL Pros/Cons

#### Pros

- Human-inspectable, append-only audit trail.
- No migration overhead at MVP stage.

#### Cons

- No concurrency locking; theoretical race conditions under heavy parallel writes.
- Harder to query (must load all lines into memory for indexing).
- Not horizontally scalable.

### Migration Path

1. Introduce repository interface (already implicitly present via functions).
2. Swap implementation with Redis/Postgres (retain JSONL as ingestion backup).
3. Add periodic snapshot & integrity hashing for compliance.

## Security Model

- Session cookies signed (HMAC SHA-256) with secrets: `ADMIN_SESSION_SECRET`, `EMPLOYEE_SESSION_SECRET`.
- RBAC via simple numeric ranking (employee < supervisor < admin).
- CSP restricts sources; connect-src extended through env override.
- Rate-limiting + spam heuristics on lead form reduce abusive submissions.
- Bcrypt optional for employee password verification (seed file). Future: fully hashed credentials store.

## Realtime Architecture

- Lead submission triggers EventEmitter `lead.new`.
- SSE endpoint holds long-lived HTTP response; pushes JSON events to admin clients.
- For scaling beyond single instance: replace with Redis pub/sub or WebSocket service.

## HRM Domain (MVP)

- Course version increments when modules list changes (immutable history preserved by append log).
- Enrollment progress recalculated on module completion; module completions individually recorded.
- Agreement acknowledgments versioned externally by environment variable.

## Compliance & Export

- CSV export endpoints under `/api/hrm/export/*` restricted to admin role.
- Future: sign each line with rolling hash for tamper-evidence.

## Extensibility Guidelines

1. Keep route handlers thin: validate -> authorize -> delegate to lib.
2. Avoid coupling UI components directly to raw JSONL parsing; rely on exported functions.
3. Introduce interfaces when a second backend implementation becomes plausible.
4. Maintain deterministic ID generation pattern prefixing domain (course_, enroll_, mod_, etc.).

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Concurrent file append collision | Data loss / truncation | Low likelihood on single node; move to DB when multi-instance. |
| Secrets misconfiguration | Session forgery | Document strong secrets & rotation procedure. |
| Missing integrity hash for PDF | Legal dispute | Add `CONTRACTOR_AGREEMENT_PDF_SHA256`. |
| Large JSONL files | Memory pressure on cold start | Paginate load or stream parse on growth threshold. |

## Roadmap Hooks

- Add metrics emitter (events -> queue -> analytics store).
- Replace JSONL with Postgres and provide one-off migrator.
- Introduce worker for async heavy tasks (image processing, large email batches).

## New Business Template Strategy

Core engine (auth, hrm, lead form) is brand-agnostic; isolate branding in:

- `public/` assets (logos, photos)
- Config (future: `config/business-profile.ts` or env-driven)
- Theming (Tailwind + design tokens)

A template repo can be produced by pruning business-specific imagery & seeded content while retaining the core libs and patterns.

---
End of architecture overview.
