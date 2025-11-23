/**
 * Create Chat DTO
 * Request body for creating a new conversation
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ 
    description: 'Optional chat title (auto-generated if not provided)', 
    required: false,
    example: 'My Travel Planning Chat'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiProperty({ 
    description: 'Initial user message to start the chat', 
    example: 'Book a flight from San Francisco to New York under $500'
  })
  @IsString()
  @MinLength(1)
  firstMessage: string;
}
