import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { QueueName } from './queue.constants';
import { QueueService } from './queue.service';

@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get all queue statistics
   */
  @Get('stats')
  async getAllStats() {
    return this.queueService.getAllQueueStats();
  }

  /**
   * Get specific queue statistics
   */
  @Get(':queueName/stats')
  async getQueueStats(@Param('queueName') queueName: QueueName) {
    return this.queueService.getQueueStats(queueName);
  }

  /**
   * Add a job to a queue (for testing)
   */
  @Post(':queueName/jobs')
  async addJob(
    @Param('queueName') queueName: QueueName,
    @Body() body: { type: string; data: any; options?: any }
  ) {
    const job = await this.queueService.addJob(queueName, body.type, body.data, body.options);
    
    return {
      jobId: job.id,
      queueName,
      type: body.type,
      status: 'added',
    };
  }

  /**
   * Get job by ID
   */
  @Get(':queueName/jobs/:jobId')
  async getJob(@Param('queueName') queueName: QueueName, @Param('jobId') jobId: string) {
    const job = await this.queueService.getJob(queueName, jobId);
    
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: await job.getState(),
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  /**
   * Remove a job
   */
  @Delete(':queueName/jobs/:jobId')
  async removeJob(@Param('queueName') queueName: QueueName, @Param('jobId') jobId: string) {
    await this.queueService.removeJob(queueName, jobId);
    
    return {
      jobId,
      status: 'removed',
    };
  }

  /**
   * Pause a queue
   */
  @Post(':queueName/pause')
  async pauseQueue(@Param('queueName') queueName: QueueName) {
    await this.queueService.pauseQueue(queueName);
    
    return {
      queueName,
      status: 'paused',
    };
  }

  /**
   * Resume a queue
   */
  @Post(':queueName/resume')
  async resumeQueue(@Param('queueName') queueName: QueueName) {
    await this.queueService.resumeQueue(queueName);
    
    return {
      queueName,
      status: 'resumed',
    };
  }

  /**
   * Clean a queue
   */
  @Post(':queueName/clean')
  async cleanQueue(
    @Param('queueName') queueName: QueueName,
    @Query('grace') grace?: number
  ) {
    await this.queueService.cleanQueue(queueName, grace ? Number(grace) : undefined);
    
    return {
      queueName,
      status: 'cleaned',
    };
  }

  /**
   * Drain a queue (remove all jobs)
   */
  @Post(':queueName/drain')
  async drainQueue(@Param('queueName') queueName: QueueName) {
    await this.queueService.drainQueue(queueName);
    
    return {
      queueName,
      status: 'drained',
      warning: 'All jobs have been removed',
    };
  }

  /**
   * Health check for Redis connection
   */
  @Get('health')
  async healthCheck() {
    const healthy = await this.queueService.healthCheck();
    
    return {
      status: healthy ? 'ok' : 'degraded',
      redis: healthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
