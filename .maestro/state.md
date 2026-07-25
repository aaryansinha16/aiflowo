# Current State

## Focus
Get the app usable end-to-end: correct landing route and a working
login/signup flow for local development and demos.

## Next Concrete Tasks
- [ ] Wire a real email/password (or OAuth) sign-up on the backend. Frontend
      `register()` and the "Sign in instantly (demo)" button currently create a
      **client-side demo session** because the backend only exposes magic-link
      auth (`/api/auth/magic-link/*`) — there is no `/api/auth/register` route.
      Requires touching `apps/backend/src/auth/**`, which is off-limits without
      explicit instruction.
- [ ] Make magic-link login actually deliver emails in dev (or log the link),
      so the primary login path works without the demo shortcut.
- [ ] Add a header/nav with a working "Log out" control on the dashboard.

## Blockers

_(none)_

## Recent Context
Fixed routing so the default route (`/`) now redirects to `/dashboard` when
authenticated and `/login` otherwise, instead of rendering the component
showcase (that showcase moved to `/showcase`). Made login/signup work locally:
signup and a new "Sign in instantly (demo)" button create a persisted
client-side session (`demo.` token) that `checkAuth` validates without hitting
the backend. Frontend typecheck passes.

## Notes
The backend auth is magic-link only and its files are on the NEVER-touch list,
so a genuinely working password sign-up needs an explicit task authorizing
backend auth changes.
