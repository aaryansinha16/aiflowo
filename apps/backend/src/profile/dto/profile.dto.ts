import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  // Personal Info
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  profilePicUrl?: string;

  // Travel Preferences
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredAirlines?: string[];

  @IsOptional()
  @IsString()
  preferredCabinClass?: string;

  @IsOptional()
  @IsObject()
  frequentFlyerNumbers?: Record<string, string>;

  // Social Media Accounts
  @IsOptional()
  @IsObject()
  socialAccounts?: Record<string, unknown>;

  // Professional Info
  @IsOptional()
  @IsUrl()
  resumeUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedInUrl?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  // Preferences
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}

export class ProfileResponseDto {
  id: string;
  userId: string;

  // Personal Info
  name?: string;
  profilePicUrl?: string;

  // Travel Preferences
  preferredAirlines: string[];
  preferredCabinClass?: string;
  frequentFlyerNumbers?: Record<string, string>;

  // Social Media Accounts
  socialAccounts?: Record<string, unknown>;

  // Professional Info
  resumeUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Preferences
  timezone: string;
  notifications: boolean;

  createdAt: Date;
  updatedAt: Date;
}
