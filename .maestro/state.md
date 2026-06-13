# Current State

## Focus
Frontend auth UX: make the routing and login/signup flows work end-to-end.

## Next Concrete Tasks
- [ ] Magic-link email is never actually delivered — `apps/backend/src/libs/queue/processors/email.processor.ts` `sendMagicLink` is a stub (TODO, just logs). Wire up real email delivery (or, for dev, surface the magic-link URL) so a user can complete login without reading worker logs. NOTE: backend `auth/**` is on the NEVER-touch list, but the email processor is not.
- [ ] `RegisterForm` (password-based) is now unused — the backend has no password/register endpoint. Either delete `components/organisms/RegisterForm.tsx` + its barrel export, or keep it only if a password auth backend is planned.
- [ ] Social login buttons (`SocialLoginButtons` / Google + GitHub) are non-functional placeholders. Either implement OAuth on the backend or remove the molecule.

## Blockers

_(none)_

## Recent Context

Fixed the default-route problem: `/` now redirects to `/login` (or `/dashboard` if
authenticated) instead of rendering the component showcase. Made login/signup actually
work against the real backend — both flows use the passwordless magic-link endpoint, the
broken `register()` call to the nonexistent `/api/auth/register` was removed, and the
verify page was moved to `/auth/verify` to match the URL the backend puts in magic links
(the old `(auth)/verify` group resolved to `/verify`, so links 404'd). Also added a
frontend `lib/logger.ts` and replaced every `console.*` with it (addresses PR #48 feedback).

## Notes
- Magic-link is the only working auth path; there is no password login on the backend.
