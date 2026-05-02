# Current State

## Focus
Make the app's first impression be the auth flow (not the component showcase) and make magic-link login/signup actually work end-to-end.

## Next Concrete Tasks
- [ ] Manually smoke-test the magic-link flow against a running backend + worker (compose up postgres/redis/minio, start backend, send link, click verify URL — confirm dashboard loads).
- [ ] Decide whether to wire real Google/GitHub OAuth or remove the placeholder buttons in `LoginForm` (currently they only `console.log`).
- [ ] Decide what to do with the orphaned `RegisterForm` organism — either reintroduce password auth on the backend or delete the component.
- [ ] Add a dedicated `auth/verify` layout for visual consistency with `(auth)/login` (currently the verify page renders without the AI Flowo header/footer).

## Blockers

_(none)_

## Recent Context

Replaced the component-showcase root page with an auth-aware redirect (→ `/dashboard` when authed, `/login` otherwise), moved the magic-link verification page from `/verify` to `/auth/verify` so the URL matches what the backend constructs in `auth.service.ts`, and rewrote the register page to use the magic-link flow (the backend has no password-register endpoint, so the previous password form 404'd). Removed the dead `register` action from `useAuth`. All quality gates green.

## Notes
- The backend's only auth path is magic link (`POST /api/auth/magic-link/send` → email → `/auth/verify?token=...`). There is no password-based login or register endpoint. Don't add one without an explicit instruction — `apps/backend/src/auth/**` is on the never-touch list.
- The `(auth)/verify` directory has been removed; the canonical verify route is now `app/auth/verify/page.tsx`.
