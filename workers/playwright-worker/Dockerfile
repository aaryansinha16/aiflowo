# Use official Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright playwright

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Change ownership to non-root user
RUN chown -R playwright:playwright /app

# Switch to non-root user
USER playwright

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose health check port
EXPOSE 3001

# Start the worker
CMD ["node", "dist/index.js"]
