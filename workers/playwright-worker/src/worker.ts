import { Worker, Job } from 'bullmq';
import { Page, BrowserContext } from 'playwright';
import { config } from './config';
import { logger } from './logger';
import { browserManager } from './browser-manager';
import { BrowserJob, BrowserJobType, JobResult } from './types';
import {
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleFillForm,
  handleSearch,
} from './handlers';

export class PlaywrightWorker {
  private worker: Worker | null = null;
  private isShuttingDown = false;

  constructor() {}

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    try {
      // Initialize browser first
      await browserManager.initialize();

      // Create BullMQ worker
      this.worker = new Worker(
        'browser',
        async (job: Job<BrowserJob>) => {
          return this.processJob(job);
        },
        {
          connection: {
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
          },
          concurrency: config.worker.concurrency,
          autorun: true,
        }
      );

      // Event listeners
      this.worker.on('completed', (job: Job) => {
        logger.info(`Job completed: ${job.id}`, {
          jobId: job.id,
          type: job.data.type,
        });
      });

      this.worker.on('failed', (job: Job | undefined, error: Error) => {
        logger.error(`Job failed: ${job?.id}`, {
          jobId: job?.id,
          type: job?.data?.type,
          error: error.message,
        });
      });

      this.worker.on('error', (error: Error) => {
        logger.error('Worker error', error);
      });

      logger.info('Playwright worker started', {
        concurrency: config.worker.concurrency,
        redis: `${config.redis.host}:${config.redis.port}`,
      });
    } catch (error) {
      logger.error('Failed to start worker', error);
      throw error;
    }
  }

  /**
   * Process a browser job
   */
  private async processJob(job: Job<BrowserJob>): Promise<JobResult> {
    logger.info(`Processing job: ${job.id}`, {
      jobId: job.id,
      type: job.data.type,
    });

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create isolated browser context for this job
      context = await browserManager.createContext();
      page = await context.newPage();

      // Route job to appropriate handler
      let result: JobResult;

      switch (job.data.type) {
        case BrowserJobType.NAVIGATE:
          result = await handleNavigate(page, job.data);
          break;

        case BrowserJobType.SCREENSHOT:
          result = await handleScreenshot(page, job.data);
          break;

        case BrowserJobType.CLICK:
          result = await handleClick(page, job.data);
          break;

        case BrowserJobType.FILL_FORM:
          result = await handleFillForm(page, job.data);
          break;

        case BrowserJobType.SEARCH:
          result = await handleSearch(page, job.data);
          break;

        default:
          result = {
            success: false,
            error: `Unknown job type: ${(job.data as any).type}`,
          };
      }

      // Update progress
      await job.updateProgress(100);

      return result;
    } catch (error) {
      logger.error(`Job processing error: ${job.id}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Clean up resources
      if (page) {
        try {
          await page.close();
        } catch (error) {
          logger.warn('Error closing page', error);
        }
      }

      if (context) {
        try {
          await browserManager.closeContext(context);
        } catch (error) {
          logger.warn('Error closing context', error);
        }
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.debug('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown');

    try {
      // Stop accepting new jobs
      if (this.worker) {
        await this.worker.close();
        logger.info('Worker stopped accepting new jobs');
      }

      // Close browser
      await browserManager.close();

      logger.info('Shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown', error);
      throw error;
    }
  }
}
