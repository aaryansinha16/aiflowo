# Current State

## Focus
Make the app's first impression be the auth flow (not the component showcase) and make magic-link login/signup actually work end-to-end. PR #48 ships the routing/auth fix plus a global frontend logger service.

## Next Concrete Tasks
- [ ] Manually smoke-test the magic-link flow against a running backend + worker (compose up postgres/redis/minio, start backend, send link, click verify URL — confirm dashboard loads).
- [ ] Decide whether to wire real Google/GitHub OAuth or remove the placeholder buttons in `LoginForm` (currently they only emit a `log.info`).
- [ ] Decide what to do with the orphaned `RegisterForm` organism — either reintroduce password auth on the backend or delete the component.
- [ ] Add a dedicated `auth/verify` layout for visual consistency with `(auth)/login` (currently the verify page renders without the AI Flowo header/footer).
- [ ] (Optional) Pipe the frontend logger to a remote sink (Sentry, LogRocket, Datadog) instead of `console`. Today the only transport is the browser console; the abstraction is in place to swap it in `apps/frontend/lib/logger.ts`.

## Blockers

_(none)_

## Recent Context

Addressed PR #48 review feedback: added a global frontend logger service at `apps/frontend/lib/logger.ts` (scoped, level-aware via `NEXT_PUBLIC_LOG_LEVEL`, defaults to `warn` in production / `debug` in dev) and replaced all 39 `console.*` call sites across the frontend (auth flow, chat page, profile, forms, SSE hook, API client) with `createLogger('scope')` calls. Quality gates green: typecheck, lint (no errors), and 83 backend tests pass.

## Notes
- The backend's only auth path is magic link (`POST /api/auth/magic-link/send` → email → `/auth/verify?token=...`). There is no password-based login or register endpoint. Don't add one without an explicit instruction — `apps/backend/src/auth/**` is on the never-touch list.
- The `(auth)/verify` directory has been removed; the canonical verify route is now `app/auth/verify/page.tsx`.
- The frontend logger is the single source of truth for client-side logging now. Don't reach for `console.*` directly in new code; import `createLogger` from `@/lib/logger`.
