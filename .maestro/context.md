# Project Context — aiflowo

## Stack
- **Languages/runtimes**: TypeScript 5.9.3, Node.js >= 20 (CI matrix: 20.x, 22.x), npm >= 10
- **Module system**: ESM at the root (`"type": "module"` in root package.json), CommonJS in backend/workers (`tsconfig` `"module": "commonjs"`)
- **Backend**: NestJS 11.1.9 (Express platform), Prisma 6.19, BullMQ 5.64, Socket.io, OpenAI SDK 6.9, Passport-JWT, class-validator, zod 4.1, Swagger via `@nestjs/swagger` 11.2
- **Frontend**: Next.js 16.1.6, React 19.2, Tailwind CSS 3.4 + tailwindcss-animate, Radix UI primitives, zustand 5.0, socket.io-client 4.8, openapi-fetch + openapi-typescript codegen
- **Workers**: Playwright 1.56 (browser automation), sharp 0.34 + fluent-ffmpeg 2.1 (media), shared BullMQ + ioredis 5.8
- **Shared package**: `@aiflowo/shared` (zod schemas, API + tool types). `@aiflowo/ui` exists but is currently a near-empty stub.
- **Test/lint/build**: Jest 29 (backend only — frontend & workers have no tests wired), root flat ESLint 9 config, prettier 3.6, NestJS CLI build, Next build, plain `tsc` for shared/workers
- **Infra (docker-compose)**: Postgres 15 (port 5433→5432), Redis 7-alpine, MinIO (S3-compatible, ports 9000/9001), playwright-worker container with health check on 3001
- **Deployment target**: Not committed — only Dockerfile is for `playwright-worker`; no k8s/terraform despite `infra/` existing (only contains `scripts/`)

## Architecture
Monorepo with npm workspaces under `apps/*`, `packages/*`, `workers/*`. The backend (NestJS) is the orchestrator: it owns auth, the agent/LLM stack, the queue, storage, and exposes REST + Swagger + Socket.io. User intent → `agent/intent` classifier → `agent/plan` generator (OpenAI) → tool execution via `agent/tools` registry → for browser/media work jobs are pushed onto BullMQ queues consumed by the Playwright and Media workers. Results, logs, and artifacts are persisted in Postgres (Prisma) and S3/MinIO. Real-time task updates stream to the Next.js frontend over SSE (`modules/tasks/task/sse`) and Socket.io.

Key entry points:
- Backend bootstrap: `apps/backend/src/main.ts` (port 4000, global prefix `/api`, Swagger at `/api/docs`)
- Backend root module: `apps/backend/src/app.module.ts` (registers `JwtAuthGuard` as global APP_GUARD)
- Prisma schema: `apps/backend/prisma/schema.prisma`
- Frontend root: `apps/frontend/app/layout.tsx`, route groups `(auth)` and `(dashboard)`
- Playwright worker: `workers/playwright-worker/src/index.ts` (+ `worker.ts`, handlers in `src/handlers/`)
- Media worker: `workers/media-worker/src/index.ts`

Most important backend modules:
- `agent/intent` — classifies user request type (uses `prompts/intent-classifier.prompt.ts`)
- `agent/plan` — produces multi-step LLM plans
- `agent/llm` — OpenAI wrapper service (timeouts/retries from env)
- `agent/lightweight` — fast-path for small responses (added in PR #46)
- `agent/tools` — registry + executor + per-domain handlers (`browser`, `flight`, `form`, `job`, `social`, `validation`, `calculator`, `weather`)
- `modules/flights` — Amadeus integration (`amadeus.service.ts`) used by the search-flights tool
- `modules/tasks/{chat,task}` — chat (conversation) and task CRUD + SSE streaming
- `libs/queue` — BullMQ wiring with processors `task`, `browser`, `media`, `email`
- `libs/forms` — form-profile CRUD + field mapping + session passing for autofill
- `libs/storage` — S3/MinIO client
- `auth` — magic-link + JWT + Passport strategies

## Conventions
- **Code style** (prettier): single quotes, semicolons, trailing commas (es5), 2-space indent, 80-col print width, LF endings, always-parens arrows
- **Imports**: `eslint-plugin-import` `import/order` is enforced — groups (builtin → external → internal → parent → sibling → index) with newlines between and case-insensitive ascending alphabetization. Don't shuffle imports manually; ESLint will reorder them.
- **TS strictness** (root tsconfig): `strict: true` plus `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Underscore-prefix to opt out of unused checks (`argsIgnorePattern: '^_'`).
- **Commit messages**: observed pattern is `[#<issue>] <type>: <message>` (e.g. `[#46] feat: optimized light weight and context`, `[#17] feat: form filler`). Merges via squash/PR. Use this format for new commits.
- **Tests**: Jest, regex `.*\.spec\.ts$`, colocated next to source (e.g. `intent.controller.spec.ts`, `profile.service.spec.ts`). Backend has separate `jest.integration.config.js` (run with `--runInBand`). Frontend & workers do NOT have tests configured.
- **NestJS folder pattern**: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`, often `index.ts` re-export. Tool handlers extend `base/base-tool-handler.ts`.
- **Frontend components**: Atomic design — `atoms/`, `molecules/`, `organisms/` plus shadcn-style primitives in `components/ui/` and `hoc/withAuth.tsx`. Each layer has an `index.ts` barrel.
- **Naming**: kebab-case for backend files (`fill-form.handler.ts`), PascalCase for React components (`ChatSidebar.tsx`).

## Notable dependencies
- `@nestjs/*` 11 — backend HTTP/WS framework
- `@prisma/client` + `prisma` 6.19 — Postgres ORM and migrations
- `bullmq` 5.64 + `ioredis` 5.8 — job queues and Redis client (shared between backend and workers)
- `openai` 6.9 — LLM client used by `agent/llm`
- `playwright` 1.56 — browser automation in `workers/playwright-worker`
- `sharp` 0.34 + `fluent-ffmpeg` 2.1 — image/video processing in `workers/media-worker`
- `@aws-sdk/client-s3` + `lib-storage` + `s3-request-presigner` — S3/MinIO uploads and presigned URLs
- `passport-jwt` + `@nestjs/jwt` + `bcrypt` — auth
- `class-validator` + `class-transformer` + `zod` — DTO validation (Nest pipes use class-validator; shared schemas use zod)
- `socket.io` (server) / `socket.io-client` (frontend) — real-time task progress
- `next` 16 + `react` 19 + `tailwindcss` 3.4 + Radix UI — frontend UI
- `zustand` 5 — frontend state
- `openapi-fetch` + `openapi-typescript` — frontend types are generated from backend Swagger via `npm run generate:api` (requires backend running on 4000)

## Top-level layout
```
aiflowo/
├── apps/
│   ├── backend/        # NestJS API + agent orchestrator (port 4000)
│   └── frontend/       # Next.js 16 dashboard (port 3000)
├── packages/
│   ├── shared/         # @aiflowo/shared — zod schemas, api-types, tool-schemas
│   └── ui/             # @aiflowo/ui — stub (only index.ts)
├── workers/
│   ├── playwright-worker/  # BullMQ consumer for browser jobs (Dockerfile here)
│   └── media-worker/       # BullMQ consumer for image/video jobs
├── infra/
│   └── scripts/        # Infra helper scripts (no k8s/terraform yet)
├── docs/               # ARCHITECTURE.md, Folder_structure.md, RUN_LOCAL.md, ...
├── scripts/            # seed_demo_data.ts
├── tools/              # empty
├── docker-compose.yml  # postgres, redis, minio, playwright-worker
└── test-flight-search.js / test-form-fill-api.js  # ad-hoc top-level scripts
```

## CI / quality gates
- `.github/workflows/ci.yml` runs on push/PR to `main` and `develop`
  - Job `lint-and-test`: matrix on Node 20.x + 22.x → `npm ci` → `npm run lint` → `npm run tsc --noEmit --workspaces --if-present || true` → `npm test`
  - Job `build` (after lint-and-test): Node 20.x → `npm run build`
- **Gotcha**: the type-check step ends with `|| true`, so TS errors do NOT fail CI. Don't rely on CI to catch type regressions — run `tsc` locally or via `npm run build`.
- **Gotcha**: frontend `lint` script is a no-op echo (`"Frontend lint temporarily disabled..."`). ESLint won't run on `apps/frontend` in CI.
- Backend `postinstall` and `prebuild` both run `prisma generate`, so installing deps requires a valid `schema.prisma`.
- Tests: only the backend has real specs. Root `npm test` walks workspaces with `--if-present` and `--passWithNoTests`, so a green `npm test` ≠ wide coverage.

## Project-specific NEVER list
Without explicit instruction in `state.md` (or the user message), do not modify:
- `apps/backend/prisma/schema.prisma` schema changes or anything in `apps/backend/prisma/migrations/` — production-shape data; require migration discipline. Never hand-edit committed migration SQL.
- `apps/backend/src/auth/**` — JWT signing, magic-link tokens, Passport strategies. Don't weaken guards or change `JWT_SECRET`/`MAGIC_LINK_SECRET` handling.
- `apps/backend/src/main.ts` global guard registration (`APP_GUARD` → `JwtAuthGuard`) and CORS allow-list.
- `apps/backend/src/libs/storage/**` and any `presigner` usage — S3 credential and signed-URL surface.
- `apps/backend/src/modules/flights/amadeus.service.ts` — touches a paid third-party API; don't make live calls speculatively.
- `apps/backend/src/agent/tools/handlers/flight/book-flight.handler.ts`, `social/post-social.handler.ts`, `social/schedule-post.handler.ts`, `job/apply-job.handler.ts` — these execute real-world side effects (booking, posting, applying).
- `.env`, `.env.example` — secret surface; never echo or commit values.
- `.github/workflows/ci.yml`, `docker-compose.yml`, `workers/playwright-worker/Dockerfile` — CI/infra config.
- `package-lock.json` — let npm regenerate; don't hand-edit.

## Gotchas / context the next agent will wish they knew
- The root `tsconfig.json` is permissive (`allowJs`, `noEmit`) and is what ESLint's parser project points to. Each workspace has its own tsconfig that actually drives builds.
- The backend `ConfigModule` loads env from `../../.env` (repo root), not `apps/backend/.env`. Keep secrets at repo root.
- Postgres is exposed on host port **5433** (not 5432) by docker-compose — `DATABASE_URL` for local dev must use 5433.
- Redis is shared by backend (BullMQ producer) and both workers (consumers). Queue names live in `apps/backend/src/libs/queue/queue.constants.ts` and the Prisma `QueueName` enum (`TASK`, `BROWSER`, `MEDIA`, `EMAIL`).
- MinIO replaces real S3 in dev; the same `@aws-sdk/client-s3` is used against it — configure `AWS_*` to point at `http://localhost:9000` for local.
- Frontend types: `apps/frontend/lib/api-generated/schema.d.ts` is generated from the running backend's Swagger. After backend route changes, run `npm run generate:api --workspace=frontend` (requires backend up on 4000).
- Frontend uses Next.js **16** with React **19** — server/client component boundaries and the App Router are mandatory; do not assume Pages Router.
- `@aiflowo/ui` is essentially empty; UI primitives actually live in `apps/frontend/components/ui/` (shadcn-style).
- `tools/` directory is empty despite README hinting at "LLM prompts & contracts" — actual prompts live in `apps/backend/src/agent/prompts/`.
- Several `test-*.js`/`test-*.sh` scripts at repo and worker root are ad-hoc manual smoke scripts, not Jest tests. Don't expect them to run in CI.
- The lightweight response path (`agent/lightweight/lightweight-response.service.ts`) was added in PR #46 to short-circuit small queries before going through full intent → plan; check it before adding work to the heavy planner.
- The `Tool` and `ToolExecution` Prisma models exist but the in-memory `tool-handler-registry.ts` is the source of truth for which tools are wired — DB rows are advisory/usage tracking.
- `ISSUE_1_COMPLETED.md` at repo root is historical; treat `docs/` (especially `STARTER_CONTEXT_FULL.md` and `ARCHITECTURE.md`) as the more authoritative narrative.
- **Auth reality**: the backend exposes ONLY magic-link auth (`/api/auth/magic-link/send`, `/api/auth/magic-link/verify`, `/api/auth/me`, `/api/auth/logout` in `apps/backend/src/auth/auth.controller.ts`). There is **no** `/api/auth/register` and no password login. The frontend `useAuth` store therefore treats sign-up and the "Sign in instantly (demo)" button as **client-side demo sessions**: they mint a token prefixed `demo.` and `checkAuth()` validates that prefix locally without calling the backend. Real password/OAuth sign-up needs backend work (off-limits list) — don't assume `register()` talks to the server.
- The frontend root route (`apps/frontend/app/page.tsx`) is a redirect (`/dashboard` if authenticated, else `/login`); the old atomic-design component showcase now lives at `apps/frontend/app/showcase/page.tsx`.
- Frontend `next-env.d.ts` and `.next/` are gitignored and generated; a fresh checkout has neither, so `tsc`/`next build` will (re)create them. A stale `.next/types/validator.ts` can reference old route paths and break a bare `tsc` — `rm -rf apps/frontend/.next` before type-checking.
