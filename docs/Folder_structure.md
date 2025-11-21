aiflowo/
├── apps/
│   ├── frontend/                        # Next.js (App Router) — React + editor UI
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   ├── editor/
│   │   │   └── tasks/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── TaskLog/
│   │   │   ├── EditorCanvas/            # React Konva / Canvas-based image editor
│   │   │   └── MediaPreview/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── public/
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.cjs
│   │   └── package.json
│   │
│   ├── backend/                         # NestJS (or Express) API & orchestrator
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   │   └── configuration.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── magic-link.strategy.ts
│   │   │   │   ├── users/
│   │   │   │   ├── profiles/
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── tasks.controller.ts
│   │   │   │   │   ├── tasks.service.ts
│   │   │   │   │   └── task.processor.ts  # enqueues jobs into Redis/BullMQ
│   │   │   │   ├── agent/                 # LLM adapter & plan execution
│   │   │   │   │   ├── llm.service.ts
│   │   │   │   │   ├── plan.validator.ts
│   │   │   │   │   └── tool-registry.ts
│   │   │   │   ├── flights/
│   │   │   │   ├── forms/
│   │   │   │   ├── jobs/
│   │   │   │   ├── social/
│   │   │   │   └── media/
│   │   │   ├── workers/                   # local entrypoints for workers (optional)
│   │   │   ├── common/
│   │   │   │   ├── dto/
│   │   │   │   └── guards/
│   │   │   └── libs/
│   │   ├── scripts/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── packages/
│       ├── shared/                       # shared DTOs, types, prompts, zod schemas
│       │   ├── src/
│       │   │   ├── types.ts
│       │   │   ├── prompts/
│       │   │   └── tool-schemas.ts
│       │   └── package.json
│       └── ui/                           # optional design system / common UI components
│
├── workers/                              # containerized background workers
│   ├── playwright-worker/                # Playwright cluster worker (browser automation)
│   │   ├── src/
│   │   │   ├── index.ts                  # queue listener (Redis/BullMQ)
│   │   │   ├── browserPool.ts
│   │   │   ├── sessionManager.ts         # store/reuse browser storageState
│   │   │   ├── actionHandlers/
│   │   │   │   ├── goto.ts
│   │   │   │   ├── click.ts
│   │   │   │   ├── type.ts
│   │   │   │   ├── upload.ts
│   │   │   │   └── extract.ts
│   │   │   └── integrations/
│   │   │       ├── fillForm.ts
│   │   │       ├── applyJob.ts
│   │   │       └── socialPostFallback.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── media-worker/                     # FFmpeg, image processing
│       ├── src/
│       │   ├── index.ts
│       │   ├── ffmpegWorker.ts
│       │   └── imageProcessor.ts
│       ├── Dockerfile
│       └── package.json
│
├── infra/                                # infra-as-code, docker-compose, k8s manifests
│   ├── docker-compose.yml                # local dev orchestration
│   ├── k8s/                              # (optional) deployment manifests
│   │   ├── backend-deployment.yaml
│   │   ├── playwright-worker-deployment.yaml
│   │   └── media-worker-deployment.yaml
│   ├── terraform/                        # optional cloud infra
│   └── scripts/
│       ├── local_dev_up.sh
│       └── deploy.sh
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                         # run tests, lint, build
│   │   ├── cd.yml                         # deploy to staging/prod
│   │   └── e2e.yml                        # run Playwright E2E tests against staging
│   └── ISSUE_TEMPLATE/                    # issue & PR templates
│
├── docs/
│   ├── STARTER_CONTEXT.md                # (you already have this)
│   ├── ARCHITECTURE.md
│   ├── RUN_LOCAL.md
│   └── PLAYWRIGHT_GUIDE.md
│
├── scripts/
│   ├── sync_playwright_storage.sh         # helpers to import/export storageState
│   └── seed_demo_data.ts
│
├── tools/
│   ├── llm-prompts/                       # canonical prompt files & versions
│   ├── tool-contracts/                    # JSON schemas (zod/ajv)
│   └── test-flows/                        # sample plan JSON files for testing
│
├── .env.example
├── docker-compose.override.yml
├── .editorconfig
├── README.md
└── package.json                           # repo-level scripts (bootstrapping helpers)


Above is a complete, developer-ready folder structure for the whole project (frontend, backend, LLM orchestrator, Playwright workers, media worker, infra, CI, docs).
Copy-paste this Markdown into your repo README or canvas. I included short notes next to important folders/files to speed onboarding.

Quick notes & explanations

apps/frontend

Keep the UI focused: Chat + Task Dashboard + Editor.

editor/ should contain the React Konva canvas and connectors to send media to media-worker.

Use React Query to fetch task status and stream logs.

apps/backend

modules/agent is the orchestrator layer: LLM calls, plan validation, tool registry mapping.

tasks module persists the task plan, status and logs; it enqueues jobs to Redis via BullMQ.

workers/playwright-worker

This is the dangerous but essential worker. It runs Playwright in a Docker container.

sessionManager.ts stores per-user storageState JSON in S3 or encrypted DB and loads it into Playwright contexts.

Always capture a screenshot on any step failure and push it to S3; logs link to S3 assets.

workers/media-worker

Use FFmpeg + Node bindings for heavy transforms; run CPU-intensive workloads on dedicated instances.

packages/shared

Central place for all TypeScript types, DTOs, tool schemas, and LLM prompts — used by both backend and workers to keep contracts consistent.

infra/docker-compose.yml

Dev setup should spin up: Postgres, Redis, MinIO (S3-compatible), backend, frontend (optional), playwright-worker, media-worker.

Example services: postgres:13, redis:6, minio, playwright with proper --shm-size, etc.

CI/CD

CI runs unit tests and TypeScript builds.

e2e workflow can deploy to a staging environment and run Playwright tests against the deployed stack.

Security

Store secrets in Vault or GitHub Secrets (for GitHub Actions).

Do not store raw external passwords; use storageState and encryption.