# App

This is a Next.js + Prisma + Postgres web app.

## Deploy (Vercel)

### 1) Create a Postgres database

Use one of:
- Vercel Postgres
- Supabase / Neon / Railway Postgres

Copy the connection string as `DATABASE_URL` (Prisma expects a standard Postgres URL).

### 2) Create the Vercel project

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Vercel, import the repo.
3. Set environment variables (Project Settings -> Environment Variables):
   - `DATABASE_URL` = your Postgres connection string
   - `DIRECT_URL` = (recommended) non-pooled Postgres URL for Prisma migrations
   - `SESSION_SECRET` = 32+ char random string (used to sign session JWTs)

### 3) Prisma migrations

This repo includes an initial migration under `prisma/migrations/`.

Vercel runs `npm run build`, which runs:
- `prisma migrate deploy`
- `prisma generate`
- `next build`

### 4) Seeding / first admin user

If you need a seeded admin account in production, run `prisma/seed.ts` against the prod DB from a
controlled environment (one-time). Avoid running seeds automatically on every deploy.
