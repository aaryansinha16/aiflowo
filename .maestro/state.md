# Current State

## Focus
Authentication & onboarding flow (routing + magic-link login/signup).

## Next Concrete Tasks
- [ ] Implement real email delivery in `apps/backend/src/libs/queue/processors/email.processor.ts` (currently a stub — the magic-link URL is only logged, so login can't complete without copying it from backend logs). This file is NOT under `auth/**`, so it's editable.
- [ ] Address PR #48 feedback fully: introduce a global/shared logger service instead of `console.*`. Backend new code already uses NestJS `Logger`; frontend still uses `console.error` in `useAuth`/login pages.
- [ ] (Optional, blocked) Password-based signup would need a `User.passwordHash` column (schema migration) + a backend auth endpoint — both on the NEVER list; needs explicit authorization before attempting.

## Blockers

- True end-to-end login depends on the email processor being a stub (see task above). Magic-link works locally only by copying the URL from backend logs.

## Recent Context

Fixed the default route: `/` now redirects to `/dashboard` (if authenticated) or `/login` instead of rendering the component-library showcase. Re-wired login/signup onto the backend's real magic-link flow (find-or-create = signup + login), removed the dead `useAuth.register()` call to a nonexistent `/api/auth/register` endpoint, and added a `Logger` line so the magic link is usable in dev. All quality gates (lint/test/typecheck) pass.

## Notes

- Backend has no password auth: `User.authProvider` ∈ magic_link/google/github, no password column. Magic-link is the only supported simple auth.
- `RegisterForm` (frontend organisms) is currently unused but kept for a possible future password signup.
