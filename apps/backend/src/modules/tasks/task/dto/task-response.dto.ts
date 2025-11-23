/**
 * Task Response DTO
 * Response format for task data
 */

import { TaskPriority, TaskStatus } from '@prisma/client';

export class TaskResponseDto {
  id: string;
  userId: string;
  chatId: string;
  title: string;
  description?: string;
  intent: string;
  status: TaskStatus;
  priority: TaskPriority;
  plan?: any;
  currentStep: number;
  totalSteps: number;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
