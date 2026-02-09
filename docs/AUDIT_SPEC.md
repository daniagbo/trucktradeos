# FleetSource Engineering Audit Spec

## 1. Purpose

This document defines the audit method, scope, and success criteria for a full-stack engineering audit of the FleetSource codebase.

Audit goals:
- Verify backend/frontend parity and connection quality.
- Detect functional, UX, styling, architectural, and reliability issues.
- Produce a prioritized remediation roadmap (P0-P3).

## 2. System Inventory (Current)

### 2.1 Core Stack
- Framework: Next.js App Router (`src/app`)
- Language: TypeScript
- State: React context providers (`AuthProvider`, `ListingsProvider`, `RfqsProvider`, `SavedSearchesProvider`)
- Database: PostgreSQL + Prisma (`prisma/schema.prisma`)
- Auth: Cookie session JWT (`auth_session`) via `src/lib/session.ts`

### 2.2 Entry Composition
- Root layout: `src/app/layout.tsx`
- Global middleware: `src/middleware.ts` (admin route protection)
- Global styles: `src/app/globals.css`

### 2.3 API Surface
- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `POST /api/auth/register`
  - `PATCH /api/auth/profile`
- Listings:
  - `GET /api/listings`
  - `POST /api/admin/listings`
  - `PATCH /api/admin/listings/:id`
  - `DELETE /api/admin/listings/:id`
- RFQ/Offers:
  - `GET /api/rfqs`
  - `POST /api/rfqs`
  - `PATCH /api/rfqs/:id`
  - `POST /api/rfqs/:id/messages`
  - `POST /api/rfqs/:id/offers`
  - `PATCH /api/offers/:id`

### 2.4 Frontend Route Surface
- Public: `/`, `/listings`, `/listings/:id`, `/bulk-sourcing`, `/login`, `/register`
- User: `/dashboard`, `/dashboard/rfqs`, `/dashboard/rfqs/:id`, `/rfq/new`, `/rfq/:id/confirmation`, `/profile`
- Admin: `/admin/listings`, `/admin/listings/new`, `/admin/listings/:id/edit`, `/admin/rfqs`, `/admin/rfqs/:id`

## 3. Frontend-Backend Parity Matrix (Draft Baseline)

| Backend Feature | API Route(s) | Frontend Consumer(s) | Status |
|---|---|---|---|
| Session login/logout/me | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | `src/lib/auth.tsx`, login/register pages, guarded routes | Connected |
| Profile update | `/api/auth/profile` | `src/lib/auth.tsx` -> `/profile` | Connected |
| Registration | `/api/auth/register` | `src/lib/auth.tsx`, `/register` | Connected |
| Public listings browse | `/api/listings` | `src/lib/listings.tsx`, `/listings`, `/listings/:id`, home featured | Connected |
| Admin listing create/update/delete | `/api/admin/listings`, `/api/admin/listings/:id` | `src/lib/listings.tsx`, admin listings pages/forms | Connected |
| RFQ list/create/update | `/api/rfqs`, `/api/rfqs/:id` | `src/lib/rfqs.tsx`, `/rfq/new`, dashboards/admin workspaces | Connected |
| RFQ messaging | `/api/rfqs/:id/messages` | `src/components/rfq/messaging-thread.tsx` via `src/lib/rfqs.tsx` | Connected |
| Offer create/update | `/api/rfqs/:id/offers`, `/api/offers/:id` | admin offer form + buyer/admin RFQ pages via `src/lib/rfqs.tsx` | Connected |

## 4. Reverse Parity (Frontend -> Backend)

| Frontend Capability | Backend Dependency | Draft Result |
|---|---|---|
| Login/Register/Profile | Auth routes + session cookie | Present |
| Listings catalog + filters | `/api/listings` + normalized enums | Present |
| Listing details + gated docs/info | Listing payload fields + member session | Present |
| RFQ wizard lifecycle | `/api/rfqs` create + patch | Present |
| Messaging thread | `/api/rfqs/:id/messages` | Present |
| Offer response lifecycle | `/api/rfqs/:id/offers`, `/api/offers/:id` | Present |
| Admin listing operations | `/api/admin/listings*` + middleware/admin role | Present |
| Admin RFQ workspace actions | `/api/rfqs/:id`, `/api/rfqs/:id/offers` | Present |

## 5. Known Risks to Validate in Deep Phases

- Possible enum/string drift between Prisma enums and UI string unions in edge paths.
- Middleware + page guards must consistently accept both `admin` and `ADMIN` role values.
- Lint tooling instability (`next lint` circular config issue) can hide static defects.
- Potential stale/optimistic UI assumptions where async API failures are only partially surfaced.
- Coverage gaps: no dedicated test suite currently enforcing route-level contracts.

## 6. Audit Phases and Exit Criteria

### Phase A: Static Reliability
- Run type/build/lint diagnostics.
- Identify dead code, duplicate logic, type drift.
- Exit: complete static issue register.

### Phase B: Backend Contract Validation
- Validate status codes, auth guards, input validation, and lifecycle transitions.
- Exit: all route contracts enumerated with pass/fail evidence.

### Phase C: Frontend UX + Styling Audit
- Check responsive behavior, typography consistency, empty/error/loading states.
- Exit: page-by-page UX findings and style consistency report.

### Phase D: Integration and Parity Verification
- End-to-end feature tests across auth/listings/rfq/offers/admin.
- Exit: final parity matrix with confirmed coverage and known gaps.

### Phase E: Final Engineering Report
- Prioritized backlog (P0-P3), implementation sequencing, and risk mitigation.
- Exit: actionable remediation plan ready for execution.

## 7. Evidence Collection

Artifacts used during this audit:
- Code inventory output from `find` for `src/app`, `src/components`, `src/lib`, `src/hooks`.
- Route usage trace from frontend API fetch scans.
- Runtime API workflow evidence captured during integration lifecycle tests.

