import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

/**
 * Create FormProfile DTO
 */
export class CreateFormProfileDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Personal Information
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  // Contact Information
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  // Address Information
  @IsOptional()
  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // Professional Information
  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsInt()
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  resume?: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  // Education (JSON)
  @IsOptional()
  education?: Array<{
    degree: string;
    institution: string;
    year?: number;
    gpa?: string;
  }>;

  // Skills
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  // Documents (JSON)
  @IsOptional()
  documents?: Record<string, string>;

  // Social Links (JSON)
  @IsOptional()
  socialLinks?: Record<string, string>;

  // Emergency Contact
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  // Custom Fields
  @IsOptional()
  customFields?: Record<string, unknown>;
}

/**
 * Update FormProfile DTO (all fields optional)
 */
export class UpdateFormProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsInt()
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  resume?: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @IsOptional()
  education?: Array<{
    degree: string;
    institution: string;
    year?: number;
    gpa?: string;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  documents?: Record<string, string>;

  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @IsOptional()
  customFields?: Record<string, unknown>;
}

/**
 * FormProfile Response DTO
 */
export interface FormProfileResponseDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;

  // Personal Information
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;

  // Contact Information
  email?: string;
  phone?: string;
  alternatePhone?: string;

  // Address Information
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Professional Information
  occupation?: string;
  company?: string;
  jobTitle?: string;
  yearsExperience?: number;
  resume?: string;
  coverLetter?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Complex fields
  education?: unknown;
  skills?: string[];
  documents?: unknown;
  socialLinks?: unknown;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Custom Fields
  customFields?: unknown;

  createdAt: Date;
  updatedAt: Date;
}
