/**
 * Chat Response DTO
 * Response format for chat data
 */

import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({ description: 'Unique chat identifier', example: 'cm123abc456' })
  id: string;

  @ApiProperty({ description: 'User ID who owns the chat', example: 'user123' })
  userId: string;

  @ApiProperty({ description: 'Chat title (AI-generated)', example: 'Flight Booking to NYC' })
  title: string;

  @ApiProperty({ description: 'AI-generated summary of the conversation', required: false, example: 'Planning a flight to NYC under $500' })
  summary?: string;

  @ApiProperty({ description: 'Preview of the last message', required: false, example: 'Book a flight...' })
  lastMessage?: string;

  @ApiProperty({ description: 'Number of tasks in this chat', example: 3 })
  taskCount: number;

  @ApiProperty({ description: 'Last activity timestamp', example: '2024-01-15T10:30:00Z' })
  lastActivity: string;

  @ApiProperty({ description: 'Chat creation timestamp', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00Z' })
  updatedAt: string;
}
