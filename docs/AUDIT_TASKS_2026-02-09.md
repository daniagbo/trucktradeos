# FleetSource Audit Task Board (2026-02-09)

This is the actionable backlog produced from running the audit plan against the current workspace state.

## P0 (Blockers)

- **P0-TS-001: Make `npm run typecheck` pass**
  - Scope: fix all current TS errors.
  - Acceptance: `npm run typecheck` exits 0 on a clean checkout.
  - Evidence: `docs/AUDIT_EXECUTION_REPORT_2026-02-09.md` section 2.1.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09)

- **P0-API-001: Validate RFQ create contract (`POST /api/rfqs`)**
  - Problem: no request validation; malformed payloads can throw 500.
  - Change: add Zod schema with explicit required fields (at minimum `category`, `keySpecs`, `deliveryCountry`, `urgency`, `requiredDocuments`, `conditionTolerance`), and return 400 with field errors.
  - Acceptance: invalid payloads return 400; valid payloads still succeed; unit/integration coverage added.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). Zod validation added + integration test added.

- **P0-SEC-001: Remediate High severity dependency vulnerabilities**
  - Change: upgrade patched deps (notably Next.js; `npm audit` suggested a newer patch release), and address `@modelcontextprotocol/sdk` + `fast-xml-parser` chain.
  - Acceptance: `npm audit --audit-level=high` returns 0 high vulnerabilities, or explicit waivers documented with rationale and compensating controls.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). `npm audit --audit-level=high` => 0 vulns.

## P1 (High Value / High Risk Reduction)

- **P1-AUTH-001: Server-side protection for user-only pages**
  - Problem: `/dashboard`, `/profile`, `/rfq/new` return HTTP 200 for anonymous and rely on client redirect.
  - Change: enforce auth at the server boundary (middleware matcher for user routes, or server-side redirects in layouts/pages).
  - Acceptance: anon requests to user-only pages are redirected server-side (307/302) or return 401/403 depending on design.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). Middleware matcher expanded.

- **P1-API-002: Standardize error response shape across API routes**
  - Change: adopt a common `{ message, code?, details? }` schema; ensure all errors return consistent JSON.
  - Acceptance: client can render errors uniformly; no `console.error`-only failures.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). Shared helpers applied across RFQ/offers/messages/approvals/auth/profile/password/listings, insights pricing, notifications, watchlist, and admin subsystems; admin routes now consistently return 401 (no session) vs 403 (not admin).

- **P1-DATA-001: Formalize DB migration strategy**
  - Problem: Prisma schema exists but no migrations directory is present.
  - Options:
    - A) Introduce Prisma migrations and use `migrate dev/deploy`.
    - B) Keep `db push` but add guardrails and document constraints (no production `db push`).
  - Acceptance: a new environment can be created deterministically with a documented process.

- **P1-CI-001: Add CI gates (lint, typecheck, build, prisma validate, audit)**
  - Acceptance: PRs run gates and block merges on failures.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). GitHub Actions workflow runs lint/typecheck/build/integration tests + audit gates.

- **P1-TEST-001: Add integration coverage for critical flows**
  - Acceptance: automated tests cover auth session, listings admin CRUD, RFQ lifecycle, approvals.
  - Status: DONE on branch `codex/audit-p0-typecheck` (2026-02-09). `npm run test:integration` covers listings/RFQ/offers/approvals plus notifications, watchlist, and admin approval-policies auth gates.

## P2 (Correctness + Maintainability)

- **P2-TYPES-001: Align client `UserRole` type with backend enum**
  - Problem: client uses `'member' | 'admin'` while backend often surfaces `'MEMBER' | 'ADMIN'`.
  - Change: single normalization layer + consistent types (`UserRole` / `Role`) and eliminate mixed comparisons.
  - Acceptance: role checks compile cleanly and are consistent across UI/middleware/API.

- **P2-API-003: Tighten Prisma JSON typings**
  - Problem: several sites pass `Record<string, unknown>` into Prisma JSON fields, failing TS.
  - Change: define explicit JSON payload types and/or use Prisma `InputJsonValue` helpers.
  - Acceptance: no TS errors; payloads are validated/safe.

- **P2-UX-001: Explicit empty/loading/error states for all dashboards and admin pages**
  - Acceptance: every list/detail surface renders sane states with no layout jumps.

- **P2-REPO-001: Repo hygiene**
  - Items:
    - ignore `.next_backup_*` artifacts in `.gitignore`
    - confirm `.env` is never committed (already ignored by `.env*`)
    - ensure `fleetsource/` has a lockfile and consistent build in CI

## P3 (Polish / Scale)

- **P3-A11Y-001: Accessibility pass**
  - Add basic automated a11y checks (eslint a11y plugin, Playwright + axe, or equivalent).

- **P3-PERF-001: Performance profiling**
  - Bundle analysis + route-level perf checks; reduce first-load JS where feasible.

- **P3-OBS-001: Observability**
  - Add Sentry (or equivalent), structured logging, and dashboards for key flows.

## Suggested Next Step

Pick whether you want the remediation work to start with:
1. P0-TS-001 + P0-SEC-001 (stabilize gates)
2. P0-API-001 + P1-AUTH-001 (harden contracts and security semantics)
