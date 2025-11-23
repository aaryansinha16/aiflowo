/**
 * Update Chat DTO
 * Request body for updating chat metadata
 */

import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}
