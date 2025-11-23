/**
 * Chat With Tasks DTO
 * Extended chat response including all tasks
 */

import { ChatResponseDto } from './chat-response.dto';

export class ChatWithTasksDto extends ChatResponseDto {
  tasks: any[]; // Will be TaskResponseDto[] once we create it
}
