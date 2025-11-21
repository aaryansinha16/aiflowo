# STARTER_CONTEXT.md

> **Autonomous Web Agent — Project Starter Context & Skeleton**
>
> Use this document as the global context for your AI IDE (Windsurf / Codium) and as the primary README for the project. It contains architecture, tech stack, agent/tool contracts, folder layout, DB schemas, API endpoints, LLM prompts, epics and the 2‑week MVP sprint plan.

---

## 🧠 Project Overview

**Product:** An Autonomous Web Agent ("AI That ACTS") — a digital worker that executes tasks on behalf of users across the web.

**Core capabilities (MVP):**

* Flight search & booking (API + browser fallback).
* Apply to jobs automatically (resume mapping + cover letter + submit).
* Fill complex forms (passport/visa/govt/university).
* Post on social media with Instagram-level image/video editing.
* Run multi-step scheduled automations (price-watch → book).
* Provide full task logs, screenshots & validations.

**Product mantra:** Convert user intent into safe, auditable actions.

---

## 🎯 MVP Goal

Deliver a deployable, testable MVP where a user can:

1. Send a natural language request (chat or form).
2. Agent parses intent and parameters.
3. Agent generates a validated plan (structured steps).
4. Worker(s) execute plan via API or Playwright browser flows.
5. The system logs all steps, handles OTPs/CAPTCHA by asking user, and returns final evidence (screenshots, receipts).

Minimum product flows: flight search (and optional booking), social post (edit + schedule + post), job apply, and a general form filler.

---

## ⚙️ Recommended Tech Stack

**Frontend**

* Next.js (App Router, TypeScript) — primary UI + PWA.
* Tailwind CSS — styling.
* React Query / TanStack Query — data fetching.
* React Konva / Fabric.js — image editor UI.
* Remotion or server-side FFmpeg + WebAssembly (ffmpeg.wasm) for video editing tasks.

**Backend**

* Node.js + TypeScript.
* NestJS (recommended) for modularity; Express if you prefer minimal.
* PostgreSQL + Prisma ORM.
* Redis + BullMQ for background task queues.
* S3-compatible storage (AWS S3 / DigitalOcean Spaces).
* Dockerized workers (Playwright cluster + FFmpeg workers).

**AI / LLM**

* Primary: OpenAI (function calling enabled: GPT-4.1 / gpt-4o-mini depending on cost).
* Alternate: Anthropic Claude for tool-heavy flows (optional).
* Local inference (Llama2 / Mistral) for non-sensitive/cheap tasks (field-mapping, short summarization).
* Use LangChain / LangGraph patterns as orchestration if helpful, or implement a lightweight custom orchestrator.

**Observability & Ops**

* Sentry for errors.
* Prometheus & Grafana for metrics (optional).
* Postgres backups, Vault/Secrets Manager for credentials.

**Dev / CI**

* GitHub Actions, unit tests, Playwright E2E tests.
* IaC: Terraform or Pulumi for infra.

---

## 🧩 High-Level Architecture

```

                            +-----------------------+
                            |     Web/Mobile UI     |
                            |  (Next.js + Editor)   |
                            +----------+------------+
                                       |
                        GraphQL / REST API (Auth + Tasks)
                                       |
        +------------------------------+-------------------------------+
        |                                                              |
+-------v--------+                                            +--------v-------+
|  Orchestrator  |                                            |  Scheduler /   |
|  (NestJS)      |                                            |  Cron Service  |
|  - Agent Brain |                                            |  (BullMQ)      |
|  - LLM Driver  |                                            +--------+-------+
+-------+--------+                                                     |
        |                                                              |
        |                   +---------------------------+              |
        |                   |   Tool Workers / Agents   |              |
        |                   |  - API Integrations       |              |
        |                   |  - Playwright Workers     |<-------------+
        |                   |  - Media Render Workers   |
        |                   +----+-----------+----------+
        |                        |           |
        |                        |           |
+-------v--------+       +-------v------+ +--v---------+
|   LLM Layer    |       | Playwright   | | Media/FFMPEG|
|  - OpenAI      |       | Cluster      | | Workers     |
|  - Anthropic   |       | (Docker/k8s) | | (serverful) |
+-------+--------+       +-------+------+ +------------+
        |                        |                   |
        |                        |                   |
+-------v--------+       +-------v------+       +----v---------+
| Postgres /     |       | Redis Queue   |       | Object Store |
| Metadata       |       | (BullMQ)      |       | S3 / Spaces  |
+----------------+       +---------------+       +--------------+


```

**Flow**: Frontend → Orchestrator → LLM Driver creates plan → orchestrator dispatches to Tool Workers (API or Playwright) → Worker reports status back → DB + Redis update → user sees logs.

---

## 🧠 Agent Design & Responsibilities

**Agent is responsible for:**

1. Intent classification & parameter extraction.
2. Creating a stepwise execution plan (tool calls).
3. Selecting appropriate tools (API first, Playwright fallback).
4. Emitting structured function calls (validated JSON) for each step.
5. Handling retries, validation and failures; pausing for OTP/CAPTCHA as needed.
6. Ensuring post-action validation (e.g., booking PNR captured, screenshot saved).

**Agent pattern**: Use a constrained ReAct or planner pattern where the LLM generates a **plan** (array of steps), and the orchestrator executes each step deterministically. Tool calls should be validated by the orchestrator before executing.

---

## 🔧 Tool / Function Contracts (Canonical)

All tools accept and return JSON objects. Every tool should return:

```json
{ "success": true|false, "data": {...} | null, "error": null | { "message": string, "code": string } }
```

### `search_flights` (tool)

```json
{ "from": "BOM", "to": "DEL", "date": "2025-12-01", "return_date": null, "passengers": 1, "class": "economy", "budget": 7000 }
```

**Returns**: flight options list (id, price, airline, departure, arrival, fare_rules).

### `book_flight` (tool)

```json
{ "flight_option_id": "...", "passengers": [{ "name": "A B" ... }], "payment_method_id": "vault_..." }
```

**Behaviour**: Try direct booking API if available; otherwise spin Playwright flow to the booking site. Pause for OTP/payment auth if required.

### `fill_form` (tool)

```json
{ "url": "https://...", "fields": {"full_name":"...","dob":"..."}, "files": {"photo":"s3://..."} }
```

**Behaviour**: Analyze DOM then fill; return submission confirmation or screenshot; if CAPTCHA/OTP detected, pause and request user input.

### `apply_job` (tool)

```json
{ "job_url": "https://...", "resume_id": "s3://...", "cover_letter": "..." }
```

**Behaviour**: If site has API, use it; otherwise use Playwright to fill forms, upload resume, answer questions. Log application id/confirmation.

### `post_social` (tool)

```json
{ "platform": "instagram", "account_id": "...", "media_ids": ["s3://..."], "caption": "...", "scheduled_for": "2025-12-01T19:00:00+05:30" }
```

**Behaviour**: Use Graph API where possible. For personal accounts or missing APIs, schedule Playwright job to log into the user's session and post.

### `browser_action` (generic tool)

```json
{ "steps": [ {"action":"goto", "value":"https://..."}, {"action":"type", "selector":"#name", "value":"A"}, {"action":"click","selector":"#submit"} ] }
```

**Behaviour**: Deterministic step-by-step executor with logging and screenshot on failure.

---

## 🗂 Project Folder Skeleton (recommended)

```
/apps
  /frontend       → Next.js
  /backend        → NestJS/Express
      /modules
          agent/
          tasks/
          flights/
          jobs/
          forms/
          social/
          media/
      /workers
          playwright/
          ffmpeg/
  /shared
      /types
      /schemas
      /prompts
      /utils
/docs
  STARTER_CONTEXT.md

```

---

## 🔎 Playwright Worker Design

**Purpose:** Execute browser flows where API does not exist (or for fallback), handle file uploads, and capture evidence.

**Important modules:**

* `browserPool.ts` — manages a pool of browser contexts.
* `sessionManager.ts` — stores per-user storage state (cookies/localStorage) securely.
* `actionHandlers/*` — granular actions: goto, click, type, upload, extract, waitForSelector.
* `integrations/*` — higher-level orchestrations: fillForm, applyJob, postInstagramFallback.

**Worker behavior & safety:**

* Each step logs start/end and stores screenshots on fail.
* Rate-limiting and randomized delays to mimic human behavior.
* Use proxied workers (residential proxies) for scale if needed.
* Never store cleartext passwords — prefer session storage or OAuth where possible.

---

## 🎬 Media Worker Design

**Purpose:** run resource-heavy media transforms: trimming, filters, merging, overlays.

**Components:**

* `ffmpegWorker.ts` — accepts operations queue and outputs final media to S3.
* `imageProcessor.ts` — runs AI-based enhancements (optional) + presets.
* `videoProcessor.ts` — trim, concatenate, add overlay text, export presets (reel/16:9).

**Notes:** heavy renders should be queued; provide quick low-res preview via WebAssembly client-side.

---

## 🗄 Database Schema (Prisma-ready)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  profile   UserProfile?
  tasks     Task[]
}

model UserProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  travelPrefs    Json?
  socialAccounts Json?
  resumeUrl      String?
  storageState   String? // encrypted browser storage state reference
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id])
}

model Task {
  id          String   @id @default(cuid())
  userId      String
  type        String
  status      String   // pending, running, succeeded, failed
  plan        Json?
  result      Json?
  logs        TaskLog[]
  createdAt   DateTime @default(now())
  startedAt   DateTime?
  finishedAt  DateTime?
  user        User     @relation(fields: [userId], references: [id])
}

model TaskLog {
  id        String   @id @default(cuid())
  taskId    String
  level     String
  message   String
  meta      Json?
  createdAt DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id])
}
```

**Storage:** store screenshots & exported media on S3; store references/URLs in `TaskLog` or `Task.result`.

---

## 📡 API Endpoints (MVP)

**Auth**

* `POST /api/auth/magic-link` — request magic link
* `POST /api/auth/oauth/callback` — OAuth callbacks

**Tasks**

* `POST /api/task` — create task from a user message or structured request
* `GET /api/task/:id` — get task status, logs & results
* `GET /api/tasks` — list tasks for the user

**Editor & Media**

* `POST /api/editor/export` — submit media processing job
* `GET /api/media/:id` — fetch processed media

**Integrations**

* `POST /api/flights/search` — flight search (direct API)
* `POST /api/flights/book` — invoke booking (or schedule manual)
* `POST /api/jobs/find` — job search (backfill)
* `POST /api/social/post` — manual social post and scheduling
* `POST /api/forms/submit` — manual form submission request

---

## 🧩 LLM Prompt Templates (Starter)

> Store these prompts in `/packages/shared/prompts` and version them carefully.

### Intent Classification (system-level brief)

```
You are an Intent Classifier. Input: user's raw text. Output: JSON with keys: { "intent": one_of ["flight_search","book_flight","apply_job","fill_form","post_social","browser_action"], "params": {...} }.
Only return JSON.
```

### Plan Generator

```
You are a Plan Generator. Input: intent + params + user profile. Output: JSON: { "steps": [ { "tool": "search_flights", "params": {...} }, ... ] }
Each step MUST map to one of the registered tools and must be deterministic. Include validation checks after steps when appropriate.
```

### Tool Execution Helper (used to produce human-friendly messages/logs)

```
You are a Tool Logger. Given a plan step and tool result, produce one-line status messages and recommended next actions. Keep messages short and clear.
```

---

## 🔒 Security & Compliance Notes

* **Do Not** store user passwords for external sites. Prefer session cookies, OAuth flows, or secure storage (encrypted storage state).
* **OTP handling**: Pause execution and request OTP via secure UI; do not persist OTPs in logs.
* **Payment**: Use Stripe/PayPal tokens; do not process raw card data on your servers.
* **Privacy**: Provide user data export & delete endpoints (GDPR-friendly).
* **TOS**: Automated actions interacting with third-party sites can violate TOS — include strong user agreement and allow users to opt out of specific actions.

---

## ✅ 2-Week MVP Sprint (High-level Tasks)

**Week 1 — Foundation**

* Project scaffolding (monorepo).
* Auth & user profile.
* Task model + queue (Redis + BullMQ).
* Simple LLM adapter (OpenAI function-calls).
* Playwright worker skeleton (goto/click/type/upload).
* Basic chat UI + task creation.

**Week 2 — Enable Flows & Editor**

* Flight search + show results UI (Skyscanner/Amadeus).
* Form-filler flow (DOM analyzer + Playwright fill).
* Job apply flow (Indeed API + LinkedIn Playwright).
* Image editor basics (crop, filters, overlay).
* Social post scheduler & Instagram API integration (business accounts).
* OTP/2FA UI modal & resume worker after OTP.

---

## 📦 Epics (for Issue breakdown)

1. Project Setup & CI
2. Authentication & Profiles
3. Agent LLM & Planning
4. Task Orchestration & Queues
5. Playwright Browser Engine
6. Flight System
7. Form Filler
8. Job Apply System
9. Media Editor
10. Social Posting
11. Scheduler & CRON
12. Deployment & Monitoring

---

## 🧾 Coding Standards & Conventions

* TypeScript strict mode on.
* Shared types in `/packages/shared` (DO NOT copy types across packages).
* Tool contracts typed with Zod/TypeBox for runtime validation.
* All worker steps must write `TaskLog` entries and store screenshots on error.
* Use OpenAPI / GraphQL schema for frontend→backend contracts.

---

## 🛠️ Next Steps You Can Ask Me To Do

* Generate GitHub issues grouped by epics (I can create them in issue format).
* Produce a 14-day sprint board with GitHub-style issue templates.
* Scaffold repository files (README, .github/workflows, Dockerfiles).
* Create sample Playwright flows (selectors + sequences) for specific target sites if you provide the URLs.
* Generate LLM function definitions and TypeScript wrapper code for each tool.

---

*End of STARTER_CONTEXT.md — copy into Windsurf/Codium AI or your repo as `/docs/STARTER_CONTEXT.md`.*
