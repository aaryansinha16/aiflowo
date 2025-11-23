/**
 * Create Task DTO
 * Request body for creating a new task within a chat
 */

import { TaskPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  intent: string; // User's natural language request

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority; // Optional - defaults to MEDIUM

  // Note: title and description will be auto-generated from intent
  // Note: chatId comes from URL parameter
}
