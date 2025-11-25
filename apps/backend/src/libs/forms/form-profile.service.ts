import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  CreateFormProfileDto,
  UpdateFormProfileDto,
  FormProfileResponseDto,
} from './dto/form-profile.dto';

@Injectable()
export class FormProfileService {
  private readonly logger = new Logger(FormProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all form profiles for a user
   */
  async getProfiles(userId: string): Promise<FormProfileResponseDto[]> {
    const profiles = await this.prisma.formProfile.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Default profile first
        { updatedAt: 'desc' },
      ],
    });

    return profiles as FormProfileResponseDto[];
  }

  /**
   * Get a specific form profile by ID
   */
  async getProfile(userId: string, profileId: string): Promise<FormProfileResponseDto> {
    const profile = await this.prisma.formProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException(`FormProfile with ID ${profileId} not found`);
    }

    return profile as FormProfileResponseDto;
  }

  /**
   * Get user's default form profile
   */
  async getDefaultProfile(userId: string): Promise<FormProfileResponseDto | null> {
    const profile = await this.prisma.formProfile.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return profile as FormProfileResponseDto | null;
  }

  /**
   * Create a new form profile
   */
  async createProfile(
    userId: string,
    dto: CreateFormProfileDto
  ): Promise<FormProfileResponseDto> {
    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.formProfile.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the user's first profile, make it default
    const existingProfiles = await this.prisma.formProfile.count({
      where: { userId },
    });

    const profile = await this.prisma.formProfile.create({
      data: {
        userId,
        ...dto,
        isDefault: dto.isDefault ?? existingProfiles === 0,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        customFields: dto.customFields ? (dto.customFields as any) : undefined,
      },
    });

    this.logger.log(`Created form profile ${profile.id} for user ${userId}`);

    return profile as FormProfileResponseDto;
  }

  /**
   * Update an existing form profile
   */
  async updateProfile(
    userId: string,
    profileId: string,
    dto: UpdateFormProfileDto
  ): Promise<FormProfileResponseDto> {
    // Check if profile exists and belongs to user
    const existingProfile = await this.prisma.formProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!existingProfile) {
      throw new NotFoundException(`FormProfile with ID ${profileId} not found`);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.formProfile.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: profileId },
        },
        data: { isDefault: false },
      });
    }

    const profile = await this.prisma.formProfile.update({
      where: { id: profileId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        customFields: dto.customFields ? (dto.customFields as any) : undefined,
      },
    });

    this.logger.log(`Updated form profile ${profileId} for user ${userId}`);

    return profile as FormProfileResponseDto;
  }

  /**
   * Delete a form profile
   */
  async deleteProfile(userId: string, profileId: string): Promise<void> {
    const profile = await this.prisma.formProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException(`FormProfile with ID ${profileId} not found`);
    }

    await this.prisma.formProfile.delete({
      where: { id: profileId },
    });

    this.logger.log(`Deleted form profile ${profileId} for user ${userId}`);

    // If deleted profile was default, make the first remaining profile default
    if (profile.isDefault) {
      const remainingProfiles = await this.prisma.formProfile.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 1,
      });

      if (remainingProfiles.length > 0) {
        await this.prisma.formProfile.update({
          where: { id: remainingProfiles[0].id },
          data: { isDefault: true },
        });
      }
    }
  }

  /**
   * Set a profile as default
   */
  async setDefaultProfile(userId: string, profileId: string): Promise<FormProfileResponseDto> {
    const profile = await this.prisma.formProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException(`FormProfile with ID ${profileId} not found`);
    }

    // Unset all defaults
    await this.prisma.formProfile.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this as default
    const updatedProfile = await this.prisma.formProfile.update({
      where: { id: profileId },
      data: { isDefault: true },
    });

    this.logger.log(`Set profile ${profileId} as default for user ${userId}`);

    return updatedProfile as FormProfileResponseDto;
  }

  /**
   * Convert FormProfile to flat JSON object for form filling
   */
  profileToFormData(profile: FormProfileResponseDto): Record<string, unknown> {
    const formData: Record<string, unknown> = {};

    // Personal Information
    if (profile.firstName) formData.first_name = profile.firstName;
    if (profile.lastName) formData.last_name = profile.lastName;
    if (profile.fullName) formData.full_name = profile.fullName;
    if (profile.dateOfBirth) formData.date_of_birth = profile.dateOfBirth.toISOString().split('T')[0];
    if (profile.gender) formData.gender = profile.gender;
    if (profile.nationality) formData.nationality = profile.nationality;

    // Contact Information
    if (profile.email) formData.email = profile.email;
    if (profile.phone) formData.phone = profile.phone;
    if (profile.alternatePhone) formData.alternate_phone = profile.alternatePhone;

    // Address
    if (profile.address1) formData.address = profile.address1;
    if (profile.address1) formData.address1 = profile.address1;
    if (profile.address2) formData.address2 = profile.address2;
    if (profile.city) formData.city = profile.city;
    if (profile.state) formData.state = profile.state;
    if (profile.zipCode) formData.zip = profile.zipCode;
    if (profile.zipCode) formData.zip_code = profile.zipCode;
    if (profile.zipCode) formData.postal_code = profile.zipCode;
    if (profile.country) formData.country = profile.country;

    // Professional
    if (profile.occupation) formData.occupation = profile.occupation;
    if (profile.company) formData.company = profile.company;
    if (profile.jobTitle) formData.job_title = profile.jobTitle;
    if (profile.yearsExperience) formData.years_experience = profile.yearsExperience;
    if (profile.resume) formData.resume = profile.resume;
    if (profile.coverLetter) formData.cover_letter = profile.coverLetter;
    if (profile.linkedInUrl) formData.linkedin = profile.linkedInUrl;
    if (profile.githubUrl) formData.github = profile.githubUrl;
    if (profile.portfolioUrl) formData.portfolio = profile.portfolioUrl;

    // Skills
    if (profile.skills) formData.skills = profile.skills.join(', ');

    // Emergency Contact
    if (profile.emergencyContactName) formData.emergency_contact_name = profile.emergencyContactName;
    if (profile.emergencyContactPhone) formData.emergency_contact_phone = profile.emergencyContactPhone;
    if (profile.emergencyContactRelation) formData.emergency_contact_relation = profile.emergencyContactRelation;

    // Add education if exists
    if (profile.education) {
      formData.education = profile.education;
    }

    // Add documents if exists
    if (profile.documents) {
      formData.documents = profile.documents;
    }

    // Add social links if exists
    if (profile.socialLinks) {
      formData.social_links = profile.socialLinks;
    }

    // Add custom fields
    if (profile.customFields) {
      Object.assign(formData, profile.customFields);
    }

    return formData;
  }
}
