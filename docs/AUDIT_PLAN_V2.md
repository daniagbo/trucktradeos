# FleetSource "Apple/Google Grade" Full-Scale Audit Plan (V2)

Date: 2026-02-09  
Repo: `/Users/agbodaniel/Documents/app`  
Primary app: Next.js App Router + TypeScript + Prisma/Postgres  
Secondary app: `fleetsource/` (Vite + React)

## 0. Definition Of Done (Quality Bar)

This audit targets a "big tech shipping bar": reproducible builds, strict correctness gates, secure-by-default backend contracts, accessible UI, measurable performance, and deployable release procedures.

**Release gating criteria (must be true before production):**
- `npm run lint` passes with `--max-warnings=0`.
- `npm run typecheck` passes with **0** TypeScript errors.
- `npm run build` passes.
- Database schema management is deterministic (migrations or an agreed db-push workflow with guardrails).
- Auth + RBAC is enforced server-side on all protected routes/APIs (no client-only enforcement for sensitive pages).
- API contracts are validated (Zod or equivalent), return stable error shapes, and are integration-tested.
- Vulnerability scan has no known High/Critical issues without an explicit waiver.
- Observability is in place (error tracking + structured logs + audit trail for admin actions).
- Critical user/admin flows have automated E2E coverage (login, listing browse, RFQ create, messaging, offer lifecycle, admin listing CRUD).

## 1. Audit Outputs (Artifacts)

**Documents produced by this audit:**
- Execution report with evidence + command outputs summary.
- A prioritized task board (P0-P3) with acceptance criteria per task.
- A parity matrix for frontend <-> backend (feature-by-feature, endpoint-by-endpoint).
- A security + privacy checklist with any waivers explicitly documented.
- A release checklist (build, migrations, env vars, rollback).

**Evidence sources:**
- Static checks: ESLint, TypeScript, Next build, Prisma validation, dependency audit.
- Runtime checks: API smoke flows against a real Postgres (docker-compose).
- Manual code inspection: auth/RBAC, error handling, schema validation, data modeling.

## 2. System Inventory (Tailored To This Repo)

**Root app**
- Next.js App Router under `src/app`
- TS strict enabled (`tsconfig.json`)
- Prisma schema at `prisma/schema.prisma`, Postgres via `docker-compose.yml`
- Cookie/JWT session at `src/lib/session.ts`
- Middleware protection at `src/middleware.ts`

**Subproject**
- `fleetsource/` is a separate Vite+React project with its own `package.json`

## 3. Phase 1: Preflight (Reproducibility + Environment)

**Goals**
- Ensure tooling is deterministic and environment expectations are explicit.

**Checks**
- Node/npm version documented (and ideally pinned via `.nvmrc` or `volta`).
- Lockfile is authoritative (`package-lock.json`) and installs are reproducible (`npm ci`).
- `.env.example` fully represents required env vars; secrets are never committed.
- Docker compose works and DB is reachable.

**Exit criteria**
- A clean bootstrap path exists for a new developer within 15 minutes.

## 4. Phase 2: Static Quality Gates (Hard Blockers)

**Commands (root)**
- `npm run lint` and `npx eslint src prisma --max-warnings=0`
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`
- `npm audit --audit-level=high`

**Commands (fleetsource/)**
- `npm install` (or add a lockfile and use `npm ci`)
- `npm run build`

**Exit criteria**
- No lint warnings/errors.
- No TS errors.
- Build succeeds.
- Prisma schema validates.
- Dependency vulnerabilities triaged with fixes/waivers.

## 5. Phase 3: Backend Audit (Contracts + Security + Data Integrity)

**Topics**
- API route inventory (auth, listings, rfqs, admin routes).
- Auth/RBAC correctness (role normalization, admin vs member enforcement, SSR vs CSR).
- Input validation: Zod schemas on every write endpoint.
- Error handling: consistent error response shape; no leaking internal errors.
- Prisma usage: transactions for multi-table writes; no N+1 patterns; correct `where` shapes.
- Data lifecycle: delete semantics, referential integrity (`onDelete`), audit log coverage.
- Migration strategy: migrations vs `db push`; seed behavior; rollback plan.

**Exit criteria**
- Every write endpoint has schema validation, authz checks, and stable error shapes.
- Admin actions produce audit logs.
- No API endpoints accept unbounded unvalidated JSON into Prisma JSON fields.

## 6. Phase 4: Frontend Audit (UX + A11y + Performance)

**Topics**
- App Router boundaries: correct use of client components, `useSearchParams`, suspense boundaries.
- Loading/empty/error states for each major page.
- Navigation + deep-link behavior (redirects preserve intent via `next`/`redirect` param).
- A11y: keyboard navigation, focus management, aria labels, color contrast, table semantics.
- Performance: bundle size, waterfalls, caching headers, unnecessary client-side fetching.

**Exit criteria**
- Critical pages are accessible and resilient (errors + loading).
- Protected pages do not rely solely on client-side redirects for security.

## 7. Phase 5: Integration + Parity Verification (E2E-Lite)

**Runtime environment**
- Start Postgres via `docker compose up -d`
- Apply schema via `npx prisma db push` (or migrations)
- Seed deterministic test users/data via `npm run db:seed`
- Run the app locally (`npm run dev` or `npm run start` after build)

**Required flows**
- Auth: login, me, logout.
- Listings: public browse; admin create/update/delete (including nested fields).
- RFQ: create, message, offer create, offer status update, close RFQ.
- Admin route protection: anon redirect; member stealth/404; admin 200.

**Exit criteria**
- Smoke suite passes end-to-end against real DB.
- Parity matrix updated: no dangling UI features without a backend contract (and vice versa).

## 8. Phase 6: Security, Privacy, and Compliance

**Security checks**
- Dependency audit + patch policy.
- Session/cookie correctness (httpOnly, secure in prod, sameSite policy).
- CSRF strategy for state-changing routes.
- Rate limiting / abuse protection for auth endpoints.
- Input sanitization for user-generated content (messages, notes).
- SSRF vectors (image URLs, fetches), file uploads, external integrations.

**Privacy**
- PII handling in logs/audit trails.
- Data retention and delete behavior.

**Exit criteria**
- No High/Critical vulns untriaged.
- Clear list of PII fields and logging policy.

## 9. Phase 7: CI / CD / Release Readiness

**Recommended CI gates**
- lint + typecheck + build
- Prisma validate (and migration checks)
- Unit/integration tests
- E2E tests for critical flows
- `npm audit` (or SCA via GitHub Dependabot/OSV)

**Release checklist**
- Env var list and defaults
- DB migration plan
- Rollback plan
- Monitoring hooks (Sentry/metrics)

## 10. Task Taxonomy and Prioritization

- **P0**: blocks production, security exposure, data loss/corruption, broken core flows.
- **P1**: high regression risk, major UX holes, incomplete contracts.
- **P2**: correctness edge cases, maintainability/consistency issues.
- **P3**: polish, refactors, optional enhancements.

