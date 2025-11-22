import { Injectable } from '@nestjs/common';

import { PrismaService } from './libs/prisma';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{ status: string; timestamp: string; database: string }> {
    const dbHealthy = await this.prisma.healthCheck();

    return {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
    };
  }

  getWelcome(): { message: string } {
    return {
      message: 'AI Flowo Backend API - v0.1.0',
    };
  }
}
