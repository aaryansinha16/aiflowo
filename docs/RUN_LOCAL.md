# Running AI Flowo Locally

## Prerequisites

- Node.js >= 18
- npm >= 9
- Docker Desktop
- Git

## Step-by-Step Setup

### 1. Clone Repository
```bash
git clone https://github.com/aaryansinha16/aiflowo.git
cd aiflowo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- OpenAI API key
- AWS credentials (or use MinIO locally)
- Other service credentials

### 4. Start Infrastructure Services
```bash
npm run docker:up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (port 9000, console 9001)

### 5. Run Database Migrations
```bash
npm run db:migrate
```

### 6. Start Development Servers

**All services:**
```bash
npm run dev
```

**Individual services:**
```bash
npm run dev:frontend  # Frontend on port 3000
npm run dev:backend   # Backend on port 4000
npm run dev:workers   # Workers
```

## Accessing Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Prisma Studio**: `npm run db:studio`
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Common Issues

### Port Already in Use
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
```bash
# Restart Docker services
npm run docker:down
npm run docker:up
```

### Missing Dependencies
```bash
# Clean and reinstall
npm run clean
npm install
```

## Testing

```bash
# Run all tests
npm test

# Run specific workspace tests
npm test --workspace=backend
```

## Debugging

- Backend logs: Check terminal output
- Database: Use Prisma Studio
- Redis: Use redis-cli or RedisInsight
- Worker logs: Check Docker logs

## Next Steps

- Review [STARTER_CONTEXT_FULL.md](./STARTER_CONTEXT_FULL.md) for architecture
- Check [github_issues_import.json](./github_issues_import.json) for roadmap
- Start with Issue #1 and work through epics
