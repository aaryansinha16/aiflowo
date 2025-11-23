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
  description: string | null;
  intent: string;
  status: TaskStatus;
  priority: TaskPriority;
  plan?: any;
  currentStep: number;
  totalSteps: number;
  result?: any;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
