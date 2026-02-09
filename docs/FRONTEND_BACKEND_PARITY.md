# Frontend/Backend Parity Snapshot

Date: 2026-02-08

## API Routes and Frontend Connections

- `POST /api/auth/login` -> connected in `/Users/agbodaniel/Documents/app/src/lib/auth.tsx`
- `POST /api/auth/logout` -> connected in `/Users/agbodaniel/Documents/app/src/lib/auth.tsx`
- `GET /api/auth/me` -> connected in `/Users/agbodaniel/Documents/app/src/lib/auth.tsx`
- `PATCH /api/auth/profile` -> connected in `/Users/agbodaniel/Documents/app/src/lib/auth.tsx`
- `POST /api/auth/register` -> connected in `/Users/agbodaniel/Documents/app/src/lib/auth.tsx`

- `GET /api/listings` -> connected in `/Users/agbodaniel/Documents/app/src/lib/listings.tsx`
- `POST /api/admin/listings` -> connected in `/Users/agbodaniel/Documents/app/src/lib/listings.tsx`
- `PATCH /api/admin/listings/[id]` -> connected in `/Users/agbodaniel/Documents/app/src/lib/listings.tsx`
- `DELETE /api/admin/listings/[id]` -> connected in `/Users/agbodaniel/Documents/app/src/lib/listings.tsx`

- `GET /api/rfqs` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`
- `POST /api/rfqs` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`
- `PATCH /api/rfqs/[id]` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`
- `POST /api/rfqs/[id]/messages` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`
- `POST /api/rfqs/[id]/offers` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`
- `PATCH /api/offers/[id]` -> connected in `/Users/agbodaniel/Documents/app/src/lib/rfqs.tsx`

## Verified Live Smoke Checks

- Public pages: `/`, `/listings`, `/login`, `/register`, `/bulk-sourcing` -> `200`
- Admin pages (authenticated admin): `/admin/listings`, `/admin/rfqs` -> `200`
- API checks (authenticated admin):
  - `POST /api/auth/login` -> `200`
  - `GET /api/auth/me` -> `200`
  - `GET /api/listings` -> `200`
  - `GET /api/rfqs` -> `200`
  - `POST /api/admin/listings` -> `201`
  - `PATCH /api/admin/listings/[id]` -> `200`
  - `DELETE /api/admin/listings/[id]` -> `200`

## Noted Gaps

- No automated E2E parity suite yet; validations currently manual smoke runs.
- Lint warnings remain in unrelated files and should be cleaned in a hardening pass.
