# New Business Clone Checklist

Use this checklist to spin up another service business site using the existing platform foundation.

## 1. Repository Setup

- [ ] Create new private GitHub repo from template (or copy base).
- [ ] Update project name in `package.json`.
- [ ] Configure branch protection rules.

## 2. Branding Assets

- [ ] Replace `/public/logo.*`
- [ ] Add favicon and apple-touch icons.
- [ ] Update hero images in `/public/images`.
- [ ] Verify alt text relevance.

## 3. Environment Variables

- [ ] SMTP_EMAIL / SMTP_PASSWORD
- [ ] CONTACT_FORM_TO
- [ ] COMPANY_NAME / COMPANY_PHONE / COMPANY_DOMAIN
- [ ] ADMIN_SESSION_SECRET (new random)
- [ ] ADMIN_PASSWORD (strong)
- [ ] EMPLOYEE_SESSION_SECRET (new random)
- [ ] EMPLOYEE_SEED_JSON (initial staff accounts)
- [ ] CONTRACTOR_AGREEMENT_URL / VERSION / PDF_SHA256
- [ ] STORE_DRIVER (redis if scaling)

## 4. Legal & Compliance

- [ ] Upload contractor agreement PDF (immutable hosting)
- [ ] Generate SHA-256 hash and set env var
- [ ] Confirm version date format (YYYY-MM-DD)
- [ ] Local test acknowledgment flow

## 5. Lead Form Adaptation

- [ ] Adjust quiz steps for service niche
- [ ] Update service tags / structured data
- [ ] Confirm anti-spam heuristics still valid

## 6. Content & SEO

- [ ] Update meta titles/descriptions
- [ ] Insert localized keywords (city / region)
- [ ] Add FAQ section & structured FAQPage data
- [ ] Add testimonials (moderation plan)

## 7. HRM / Training

- [ ] Seed core safety / onboarding courses
- [ ] Enroll staff and capture baseline progress
- [ ] Export initial compliance CSV for records

## 8. Security & Monitoring

- [ ] Rotate secrets & store in secret manager
- [ ] Enable HTTPS (platform auto / certificate)
- [ ] Add basic uptime check
- [ ] Consider logging retention policy

## 9. Realtime & Admin

- [ ] Verify SSE works in production environment
- [ ] Harden CORS / CSP if external dashboards added

## 10. Deployment

- [ ] Configure production domain + DNS
- [ ] Trigger first build (watch logs for warnings)
- [ ] Manually submit sitemap (if added) & check indexing

## 11. Post-Launch

- [ ] Test lead form from mobile device
- [ ] Verify emails reach inbox (SPF/DKIM alignment)
- [ ] Run basic accessibility scan
- [ ] Capture baseline analytics metrics

## 12. Future Enhancements (Optional)

- [ ] Migrate JSONL stores to DB
- [ ] Add user-friendly training UI dashboards
- [ ] Introduce multi-business admin aggregator

---
Keep this document updated as the platform evolves.
