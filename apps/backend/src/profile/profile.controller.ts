import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ProfileResponseDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get current user's profile
   */
  @Get()
  async getProfile(@CurrentUser() user: { id: string }): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(user.id);
  }

  /**
   * Update current user's profile
   */
  @Post()
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(user.id, dto);
  }

  /**
   * Delete current user's profile
   */
  @Delete()
  async deleteProfile(@CurrentUser() user: { id: string }): Promise<{ success: boolean; message: string }> {
    await this.profileService.deleteProfile(user.id);
    return {
      success: true,
      message: 'Profile deleted successfully',
    };
  }
}
