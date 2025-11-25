import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Logger,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import {
  CreateFormProfileDto,
  UpdateFormProfileDto,
  FormProfileResponseDto,
} from './dto/form-profile.dto';
import { FormProfileService } from './form-profile.service';

@Controller('form-profiles')
@UseGuards(JwtAuthGuard)
export class FormProfileController {
  private readonly logger = new Logger(FormProfileController.name);

  constructor(private readonly formProfileService: FormProfileService) {}

  /**
   * Get all form profiles for current user
   */
  @Get()
  async getProfiles(@CurrentUser() user: { id: string }): Promise<FormProfileResponseDto[]> {
    return this.formProfileService.getProfiles(user.id);
  }

  /**
   * Get default form profile for current user
   */
  @Get('default')
  async getDefaultProfile(@CurrentUser() user: { id: string }): Promise<FormProfileResponseDto | null> {
    return this.formProfileService.getDefaultProfile(user.id);
  }

  /**
   * Get a specific form profile by ID
   */
  @Get(':id')
  async getProfile(
    @CurrentUser() user: { id: string },
    @Param('id') profileId: string
  ): Promise<FormProfileResponseDto> {
    return this.formProfileService.getProfile(user.id, profileId);
  }

  /**
   * Create a new form profile
   */
  @Post()
  async createProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFormProfileDto
  ): Promise<FormProfileResponseDto> {
    return this.formProfileService.createProfile(user.id, dto);
  }

  /**
   * Update an existing form profile
   */
  @Put(':id')
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Param('id') profileId: string,
    @Body() dto: UpdateFormProfileDto
  ): Promise<FormProfileResponseDto> {
    return this.formProfileService.updateProfile(user.id, profileId, dto);
  }

  /**
   * Delete a form profile
   */
  @Delete(':id')
  async deleteProfile(
    @CurrentUser() user: { id: string },
    @Param('id') profileId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.formProfileService.deleteProfile(user.id, profileId);
    return {
      success: true,
      message: 'Form profile deleted successfully',
    };
  }

  /**
   * Set a profile as default
   */
  @Post(':id/set-default')
  async setDefaultProfile(
    @CurrentUser() user: { id: string },
    @Param('id') profileId: string
  ): Promise<FormProfileResponseDto> {
    return this.formProfileService.setDefaultProfile(user.id, profileId);
  }
}
