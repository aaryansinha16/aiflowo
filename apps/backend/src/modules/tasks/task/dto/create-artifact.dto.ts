/**
 * Create Artifact DTO
 * Request body for adding artifacts to tasks (screenshots, files)
 */

import { ArtifactType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateArtifactDto {
  @IsEnum(ArtifactType)
  type: ArtifactType;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsUrl()
  url: string; // S3 URL or storage location

  @IsOptional()
  @IsString()
  description?: string;
}
