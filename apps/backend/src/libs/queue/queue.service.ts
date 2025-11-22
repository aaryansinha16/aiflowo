import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents, Job, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';

import { QueueName, QUEUE_CONFIG } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();
  private readonly queueEvents = new Map<QueueName, QueueEvents>();
  private redisConnection: Redis;

  constructor(private readonly configService: ConfigService) {
    // Create Redis connection
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  async onModuleInit() {
    try {
      // Initialize all queues
      await this.initializeQueues();
      this.logger.log('✅ All queues initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize queues', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    // Close all queue connections
    await Promise.all([
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
      ...Array.from(this.queueEvents.values()).map((events) => events.close()),
      this.redisConnection.quit(),
    ]);
    this.logger.log('Queues disconnected');
  }

  /**
   * Initialize all queues
   */
  private async initializeQueues() {
    const queueNames = Object.values(QueueName);

    for (const queueName of queueNames) {
      await this.createQueue(queueName);
    }
  }

  /**
   * Create a queue with configuration
   */
  private async createQueue(queueName: QueueName) {
    const config = QUEUE_CONFIG[queueName] || {};

    // Create queue
    const queue = new Queue(queueName, {
      connection: this.redisConnection.duplicate(),
      defaultJobOptions: config.defaultJobOptions,
    });

    // Create queue events for monitoring
    const queueEvents = new QueueEvents(queueName, {
      connection: this.redisConnection.duplicate(),
    });

    // Set up event listeners
    this.setupQueueEventListeners(queueName, queueEvents);

    this.queues.set(queueName, queue);
    this.queueEvents.set(queueName, queueEvents);

    this.logger.log(`Queue "${queueName}" initialized`);
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupQueueEventListeners(queueName: QueueName, queueEvents: QueueEvents) {
    queueEvents.on('completed', ({ jobId }) => {
      this.logger.debug(`[${queueName}] Job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`[${queueName}] Job ${jobId} failed: ${failedReason}`);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(`[${queueName}] Job ${jobId} progress: ${JSON.stringify(data)}`);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      this.logger.warn(`[${queueName}] Job ${jobId} stalled`);
    });
  }

  /**
   * Get a queue instance
   */
  getQueue(queueName: QueueName): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }
    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobType: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobType, data, options);
    
    this.logger.log(`Job ${job.id} added to queue "${queueName}" (type: ${jobType})`);
    
    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue "${queueName}"`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName) {
    const queue = this.getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = await Promise.all(
      Array.from(this.queues.keys()).map((queueName) => this.getQueueStats(queueName))
    );

    return stats;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue "${queueName}" paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue "${queueName}" resumed`);
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(queueName: QueueName, grace: number = 24 * 3600 * 1000): Promise<void> {
    const queue = this.getQueue(queueName);
    
    await Promise.all([
      queue.clean(grace, 100, 'completed'),
      queue.clean(grace * 7, 100, 'failed'), // Keep failed jobs longer
    ]);

    this.logger.log(`Queue "${queueName}" cleaned`);
  }

  /**
   * Drain queue (remove all jobs)
   */
  async drainQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    this.logger.warn(`Queue "${queueName}" drained - all jobs removed`);
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redisConnection.ping();
      return true;
    } catch {
      return false;
    }
  }
}
