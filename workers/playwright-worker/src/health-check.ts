import * as http from 'http';

import { browserManager } from './browser-manager';
import { config } from './config';
import { logger } from './logger';

/**
 * Simple HTTP health check server
 */
export class HealthCheckServer {
  private server: http.Server | null = null;

  start(): void {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        this.handleHealthCheck(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(config.healthCheck.port, () => {
      logger.info(`Health check server listening on port ${config.healthCheck.port}`);
    });

    this.server.on('error', (error) => {
      logger.error('Health check server error', error);
    });
  }

  private handleHealthCheck(
    _req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const isHealthy = browserManager.isConnected();
    const status = isHealthy ? 200 : 503;

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: isHealthy ? 'healthy' : 'unhealthy',
        browser: {
          connected: browserManager.isConnected(),
        },
        timestamp: new Date().toISOString(),
      })
    );
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          logger.error('Error stopping health check server', error);
          reject(error);
        } else {
          logger.info('Health check server stopped');
          resolve();
        }
      });
    });
  }
}
