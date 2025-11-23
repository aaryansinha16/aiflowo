# Playwright Worker

Browser automation worker for AI Flowo using Playwright and BullMQ.

## Features

- 🌐 **Browser Automation** - Powered by Playwright with Chromium
- 🔄 **Queue Processing** - BullMQ integration for reliable job execution
- 🏥 **Health Checks** - Built-in health endpoint for monitoring
- 🐳 **Docker Ready** - Containerized with all dependencies
- 🔒 **Isolated Contexts** - Each job runs in an isolated browser context
- 📊 **Structured Logging** - Comprehensive logging for debugging

## Job Types

### 1. Navigate (`NAVIGATE`)
Navigate to a URL and wait for page load.

```typescript
{
  type: 'navigate',
  url: 'https://example.com',
  waitUntil: 'domcontentloaded' // or 'load' | 'networkidle'
}
```

### 2. Screenshot (`SCREENSHOT`)
Capture a screenshot of a webpage.

```typescript
{
  type: 'screenshot',
  url: 'https://example.com',
  fullPage: true, // optional
  selector: '.element' // optional, screenshot specific element
}
```

### 3. Click (`CLICK`)
Click an element on a page.

```typescript
{
  type: 'click',
  url: 'https://example.com',
  selector: 'button.submit',
  waitForNavigation: false // optional
}
```

### 4. Fill Form (`FILL_FORM`)
Fill and submit a form.

```typescript
{
  type: 'fill_form',
  url: 'https://example.com/form',
  fields: [
    { selector: '#name', value: 'John Doe', type: 'text' },
    { selector: '#email', value: 'john@example.com', type: 'text' },
    { selector: '#subscribe', value: 'true', type: 'checkbox' }
  ],
  submitSelector: 'button[type="submit"]' // optional
}
```

### 5. Search (`SEARCH`)
Perform a search on a website.

```typescript
{
  type: 'search',
  url: 'https://example.com',
  searchSelector: 'input[name="q"]',
  searchTerm: 'playwright automation',
  submitSelector: 'button.search' // optional
}
```

## Environment Variables

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Worker Settings
WORKER_CONCURRENCY=2        # Number of concurrent jobs
BROWSER_HEADLESS=true       # Run browser in headless mode
BROWSER_TIMEOUT=30000       # Browser operation timeout (ms)

# Logging
LOG_LEVEL=info              # debug | info | warn | error
NODE_ENV=development        # development | production

# Health Check
HEALTH_CHECK_PORT=3001
```

## Development

### Prerequisites
- Node.js >= 20
- Redis server
- Playwright browsers

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
# Start Redis first
docker-compose up redis

# Run worker in development
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Docker

### Build Image
```bash
docker build -t aiflowo-playwright-worker .
```

### Run Container
```bash
docker run -d \
  --name playwright-worker \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -p 3001:3001 \
  aiflowo-playwright-worker
```

### With Docker Compose
```bash
# From project root
docker-compose up playwright-worker
```

## Health Check

The worker exposes a health check endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "browser": {
    "connected": true
  },
  "timestamp": "2025-11-24T00:00:00.000Z"
}
```

## Architecture

```
┌─────────────────┐
│   BullMQ Queue  │
│    (browser)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Playwright     │
│    Worker       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Browser Manager │
│  (Chromium)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Job Handlers   │
│  - Navigate     │
│  - Screenshot   │
│  - Click        │
│  - Fill Form    │
│  - Search       │
└─────────────────┘
```

## Job Result Format

All jobs return a standardized result:

```typescript
{
  success: boolean;
  data?: any;              // Job-specific data
  error?: string;          // Error message if failed
  screenshot?: string;     // Base64 screenshot (if applicable)
  duration?: number;       // Execution time in ms
}
```

## Error Handling

- Jobs automatically retry up to 3 times (configured in backend queue)
- Each job runs in an isolated browser context
- Resources are cleaned up after each job
- Browser automatically restarts if it crashes

## Monitoring

### Logs
All operations are logged with structured metadata:
```
[2025-11-24T00:00:00.000Z] [INFO] Processing job: 123 {"jobId":"123","type":"navigate"}
[2025-11-24T00:00:01.000Z] [INFO] Navigation successful: Example Domain
[2025-11-24T00:00:01.500Z] [INFO] Job completed: 123 {"jobId":"123","type":"navigate"}
```

### Metrics
- Job completion rate
- Average execution time
- Browser memory usage
- Queue depth

## Troubleshooting

### Browser won't start
- Ensure Playwright browsers are installed: `npx playwright install chromium`
- Check Docker has sufficient memory (minimum 512MB, recommended 2GB)

### Jobs timing out
- Increase `BROWSER_TIMEOUT` environment variable
- Check network connectivity
- Verify target website is accessible

### Memory issues
- Reduce `WORKER_CONCURRENCY`
- Ensure browser contexts are being cleaned up
- Check for memory leaks in handlers

## Contributing

When adding new job handlers:
1. Define type in `src/types.ts`
2. Create handler in `src/handlers/`
3. Export from `src/handlers/index.ts`
4. Add case in `src/worker.ts`
5. Update this README

## License

Private and proprietary.
