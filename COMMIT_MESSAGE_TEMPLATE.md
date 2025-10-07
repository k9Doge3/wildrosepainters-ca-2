# Suggested Initial Commit Message

feat: initial Wildrose platform foundation (marketing + HRM MVP)

## Scope

- Next.js 14 marketing site (lead form, structured data, security headers)
- Contact form with anti-spam & email pipeline
- Real-time lead streaming (SSE)
- Admin & employee auth (HMAC cookies; demo seed scripts)
- Contractor agreement acknowledgment (versioned JSONL append store)
- HRM training MVP (courses, enrollments, module completions, progress APIs)
- Portal UI: courses list/detail/progress pages
- Compliance CSV export endpoints
- Demo seeds: employees + courses (auto-enrollment)
- Basic function + integration test scripts
- CI workflow (typecheck, lint, seed, tests, build)
- Documentation (README, architecture notes, template checklist)

## Notes

- File-based JSONL persistence is an interim solution; plan for DB/Redis migration.
- Demo plaintext passwords included; replace with bcrypt hashes before production.
- Integration test is lightweight; expand with Playwright/UI tests later.
