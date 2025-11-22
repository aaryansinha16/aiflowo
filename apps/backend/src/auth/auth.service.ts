import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import { PrismaService } from '../libs/prisma';
import { QueueService } from '../libs/queue';
import { EmailJobType, QueueName } from '../libs/queue/queue.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Send magic link email to user
   */
  async sendMagicLink(email: string, redirectUrl?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            authProvider: 'magic_link',
            profile: {
              create: {},
            },
          },
        });
        this.logger.log(`New user created: ${email}`);
      }

      // Generate magic link token
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      // Store token in database
      await this.prisma.magicLink.create({
        data: {
          userId: user.id,
          email: email,
          token,
          expiresAt,
        },
      });

      // Generate magic link URL
      const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

      // Send email via queue
      await this.queueService.addJob(
        QueueName.EMAIL,
        EmailJobType.SEND_MAGIC_LINK,
        {
          to: email,
          subject: 'Your Magic Link to Login',
          data: {
            magicLinkUrl,
            expiresAt: expiresAt.toISOString(),
            userName: user.name || email,
          },
        }
      );

      this.logger.log(`Magic link sent to: ${email}`);

      return {
        success: true,
        message: 'Magic link sent to your email. Please check your inbox.',
      };
    } catch (error) {
      this.logger.error(`Failed to send magic link to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Verify magic link token and generate JWT
   */
  async verifyMagicLink(token: string): Promise<{ accessToken: string; user: any }> {
    // Find magic link
    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!magicLink) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      await this.prisma.magicLink.delete({ where: { id: magicLink.id } });
      throw new UnauthorizedException('Magic link has expired. Please request a new one.');
    }

    // Check if already used
    if (magicLink.usedAt) {
      throw new UnauthorizedException('Magic link has already been used');
    }

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Update user last login
    await this.prisma.user.update({
      where: { id: magicLink.user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT
    const payload = {
      sub: magicLink.user.id,
      email: magicLink.user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in: ${magicLink.user.email}`);

    return {
      accessToken,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        name: magicLink.user.name,
        profile: magicLink.user.profile,
      },
    };
  }

  /**
   * Validate JWT payload and return user
   */
  async validateUser(payload: any): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Clean up expired magic links
   */
  async cleanExpiredMagicLinks(): Promise<number> {
    const result = await this.prisma.magicLink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired magic links`);
    return result.count;
  }
}
