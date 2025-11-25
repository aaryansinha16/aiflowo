import { randomBytes } from 'crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface BrowserSession {
  cookies: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  url: string;
  expiresAt: number;
  // Field mappings for re-filling the form
  fieldMappings?: Array<{
    selector: string;
    value: string;
    fieldType: string;
  }>;
}

/**
 * Service to manage browser sessions for form filling
 * Stores session data in Redis for later restoration
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_PREFIX = 'form:session:';
  private readonly SESSION_TTL = 3600; // 1 hour in seconds
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.config.get('REDIS_PORT') || '6379', 10),
      password: this.config.get('REDIS_PASSWORD'),
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Store a browser session
   */
  async storeSession(sessionData: BrowserSession): Promise<string> {
    const sessionId = this.generateSessionId();
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      await this.redis.setex(
        key,
        this.SESSION_TTL,
        JSON.stringify(sessionData)
      );

      this.logger.log('Session stored', {
        sessionId,
        url: sessionData.url,
        expiresAt: new Date(sessionData.expiresAt).toISOString(),
      });

      return sessionId;
    } catch (error) {
      this.logger.error('Failed to store session', error);
      throw error;
    }
  }

  /**
   * Retrieve a browser session
   */
  async getSession(sessionId: string): Promise<BrowserSession> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      const data = await this.redis.get(key);

      if (!data) {
        throw new NotFoundException(`Session not found or expired: ${sessionId}`);
      }

      const session = JSON.parse(data) as BrowserSession;

      // Check if session has expired
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(sessionId);
        throw new NotFoundException(`Session expired: ${sessionId}`);
      }

      this.logger.log('Session retrieved', {
        sessionId,
        url: session.url,
      });

      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to retrieve session', error);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      await this.redis.del(key);
      this.logger.log('Session deleted', { sessionId });
    } catch (error) {
      this.logger.error('Failed to delete session', error);
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      await this.redis.expire(key, this.SESSION_TTL);
      this.logger.log('Session TTL extended', { sessionId });
    } catch (error) {
      this.logger.error('Failed to extend session', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }
}
