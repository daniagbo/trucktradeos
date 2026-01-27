## 2026-01-27 - Admin Role Mismatch in Middleware
**Vulnerability:** Middleware checks for `session.role !== 'admin'` but the system uses `ADMIN` (uppercase) for the admin role. This effectively denies access to all admins.
**Learning:** Hardcoded string comparisons for roles should be consistent with the source of truth (Database/Enums). Enums are case-sensitive.
**Prevention:** Use the `Role` enum from Prisma or a constant for role checks, or ensure case-insensitive comparison.
