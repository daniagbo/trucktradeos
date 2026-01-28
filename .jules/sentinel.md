# Sentinel's Journal

## 2026-01-26 - Weak Default Password Policy
**Vulnerability:** User registration was using `passwordSchemaRelaxed` (min 6 chars, no complexity) instead of the stronger `passwordSchema`.
**Learning:** Development/demo schemas were left in the production registration flow.
**Prevention:** Explicitly verify that production-facing endpoints use production-grade validation schemas, not relaxed ones intended for development.

## 2026-01-26 - Dead Code in Auth Endpoint
**Vulnerability:** Unreachable code in `src/app/api/auth/me/route.ts` was confusing type checking and could mislead developers about fallback behaviors.
**Learning:** Dead code can mask type errors or create false assumptions about security fallbacks.
**Prevention:** Regularly audit for and remove unreachable code, especially in security-critical paths like authentication.
