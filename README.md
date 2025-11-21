# AI Flowo 🤖

> **Autonomous Web Agent** — AI That ACTS

An intelligent digital worker that executes complex tasks across the web autonomously. Built with Next.js, NestJS, Playwright, and powered by LLMs.

## 🚀 Features

- 🛫 **Flight Booking** - Search and book flights with API and browser automation fallback
- 💼 **Job Applications** - Automatically apply to jobs with resume mapping and cover letters
- 📝 **Form Filling** - Fill complex forms (passport, visa, government, university)
- 📱 **Social Media** - Post with Instagram-level image/video editing
- ⏰ **Scheduled Automations** - Run multi-step workflows on schedule
- 📊 **Task Logging** - Full audit trail with screenshots and validations

## 🏗️ Architecture

```
Frontend (Next.js) ↔ Backend (NestJS) ↔ LLM (OpenAI) → Tool Workers
                          ↓
                    Redis (BullMQ) → Playwright Worker
                          ↓            Media Worker
                    PostgreSQL
```

## 📦 Project Structure

```
aiflowo/
├── apps/
│   ├── frontend/          # Next.js UI
│   ├── backend/           # NestJS API & orchestrator
│   └── packages/          # Shared types & utilities
├── workers/
│   ├── playwright-worker/ # Browser automation
│   └── media-worker/      # Media processing
├── infra/                 # Docker, K8s, Terraform
├── docs/                  # Documentation
└── tools/                 # LLM prompts & contracts
```

## 🛠️ Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Konva  
**Backend**: NestJS, PostgreSQL, Prisma, Redis, BullMQ  
**AI**: OpenAI GPT-4, LangChain patterns  
**Workers**: Playwright, FFmpeg  
**Infrastructure**: Docker, AWS S3

## 🏃 Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaryansinha16/aiflowo.git
   cd aiflowo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   Frontend: http://localhost:3000  
   Backend: http://localhost:4000

## 📜 Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all workspaces
- `npm run lint` - Lint all workspaces
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

## 🗄️ Database Schema

Core models: `User`, `UserProfile`, `Task`, `TaskLog`

See `apps/backend/prisma/schema.prisma` for complete schema.

## 🔧 Configuration

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key
- `AWS_*` - AWS S3 credentials
- `JWT_SECRET` - JWT signing secret

See `.env.example` for full configuration.

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🔗 Links

- [Documentation](./docs/STARTER_CONTEXT_FULL.md)
- [Architecture Guide](./docs/Folder_structure.md)
- [GitHub Issues](./docs/github_issues_import.json)

---

Built with ❤️ by the AI Flowo team
