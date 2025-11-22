import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../libs/prisma';

import { ProfileResponseDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapToResponseDto(profile);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    try {
      // Check if profile exists, create if not
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      let profile;
      if (existingProfile) {
        profile = await this.prisma.userProfile.update({
          where: { userId },
          data: {
            ...dto,
            // Handle JSON fields properly - cast to any to satisfy Prisma's InputJsonValue
            frequentFlyerNumbers: dto.frequentFlyerNumbers as any || undefined,
            socialAccounts: dto.socialAccounts as any || undefined,
          },
        });
        this.logger.log(`Profile updated for user: ${userId}`);
      } else {
        profile = await this.prisma.userProfile.create({
          data: {
            userId,
            ...dto,
            frequentFlyerNumbers: dto.frequentFlyerNumbers as any || undefined,
            socialAccounts: dto.socialAccounts as any || undefined,
          },
        });
        this.logger.log(`Profile created for user: ${userId}`);
      }

      return this.mapToResponseDto(profile);
    } catch (error) {
      this.logger.error(`Failed to update profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    await this.prisma.userProfile.delete({
      where: { userId },
    });
    this.logger.log(`Profile deleted for user: ${userId}`);
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponseDto(profile: {
    id: string;
    userId: string;
    name: string | null;
    profilePicUrl: string | null;
    preferredAirlines: string[];
    preferredCabinClass: string | null;
    frequentFlyerNumbers: unknown;
    socialAccounts: unknown;
    resumeUrl: string | null;
    linkedInUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    timezone: string;
    notifications: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name || undefined,
      profilePicUrl: profile.profilePicUrl || undefined,
      preferredAirlines: profile.preferredAirlines || [],
      preferredCabinClass: profile.preferredCabinClass || undefined,
      frequentFlyerNumbers: profile.frequentFlyerNumbers as Record<string, string> | undefined,
      socialAccounts: profile.socialAccounts as Record<string, unknown> | undefined,
      resumeUrl: profile.resumeUrl || undefined,
      linkedInUrl: profile.linkedInUrl || undefined,
      githubUrl: profile.githubUrl || undefined,
      portfolioUrl: profile.portfolioUrl || undefined,
      timezone: profile.timezone,
      notifications: profile.notifications,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
