import { Injectable } from '@nestjs/common';

import { PrismaService } from './libs/prisma';
import { QueueService } from './libs/queue';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService
  ) {}

  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    database: string;
    redis: string;
    queues: Array<{
      queueName: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      total: number;
    }>;
  }> {
    const dbHealthy = await this.prisma.healthCheck();
    const redisHealthy = await this.queueService.healthCheck();

    // Get queue stats if healthy
    let queueStats: Array<{
      queueName: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      total: number;
    }> = [];
    
    if (redisHealthy) {
      try {
        const stats = await this.queueService.getAllQueueStats();
        queueStats = stats || [];
      } catch {
        queueStats = [];
      }
    }

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      queues: queueStats,
    };
  }

  getWelcome(): { message: string; version: string } {
    return {
      message: 'AI Flowo Backend API',
      version: '0.1.0',
    };
  }
}

