# Architecture Guide

## System Overview

AI Flowo is built as a distributed system with multiple components working together to execute autonomous tasks.

## Core Components

### 1. Frontend (Next.js)
- User interface for task management
- Real-time task status updates
- Media editor for image/video processing
- Chat interface for natural language task input

### 2. Backend (NestJS)
- RESTful API
- Authentication & authorization
- Task orchestration
- LLM integration (OpenAI)
- Database management (PostgreSQL + Prisma)
- Queue management (Redis + BullMQ)

### 3. Workers
- **Playwright Worker**: Browser automation for web scraping and form filling
- **Media Worker**: Image and video processing using FFmpeg

### 4. Infrastructure
- PostgreSQL: Primary database
- Redis: Task queue and caching
- MinIO/S3: Object storage for media files
- Docker: Containerization

## Data Flow

1. User submits task via frontend
2. Backend receives request and authenticates user
3. LLM analyzes intent and generates execution plan
4. Backend enqueues task steps in Redis
5. Workers pick up tasks and execute them
6. Results are stored in database and object storage
7. Frontend receives real-time updates via WebSocket/SSE

## Security Considerations

- JWT-based authentication
- Encrypted storage for sensitive data
- Rate limiting on API endpoints
- Secure handling of third-party credentials
- CAPTCHA/OTP handling without persistence

## Scalability

- Horizontal scaling of workers
- Database read replicas
- Redis cluster for high availability
- CDN for static assets
- Load balancing for API servers

## Monitoring & Observability

- Structured logging
- Error tracking (Sentry)
- Performance metrics (Prometheus)
- Health checks for all services
