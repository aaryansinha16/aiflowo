import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getWelcome(): { message: string } {
    return {
      message: 'AI Flowo Backend API - v0.1.0',
    };
  }
}
