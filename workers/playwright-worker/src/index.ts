import { config } from './config';
import { HealthCheckServer } from './health-check';
import { logger } from './logger';
import { PlaywrightWorker } from './worker';

/**
 * Main entry point for Playwright worker
 */
async function main() {
  logger.info('Starting Playwright Worker', {
    nodeEnv: config.nodeEnv,
    concurrency: config.worker.concurrency,
    headless: config.browser.headless,
  });

  // Start health check server
  const healthCheck = new HealthCheckServer();
  healthCheck.start();

  // Start worker
  const worker = new PlaywrightWorker();
  await worker.start();

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);

    try {
      await worker.shutdown();
      await healthCheck.stop();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    shutdown('unhandledRejection');
  });
}

// Start the worker
main().catch((error) => {
  logger.error('Failed to start worker', error);
  process.exit(1);
});
