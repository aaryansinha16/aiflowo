/**
 * Chat API Service
 * Handles all chat-related API requests
 */

import { api } from './client';

export interface Chat {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  lastMessage?: string;
  taskCount: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatWithTasks extends Chat {
  tasks: Task[];
}

export interface Task {
  id: string;
  userId: string;
  chatId: string;
  title: string;
  description?: string;
  intent: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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

export interface CreateChatDto {
  firstMessage: string;
  title?: string;
}

export interface CreateTaskDto {
  intent: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export const chatsApi = {
  /**
   * List all user chats
   */
  list: (token: string, params?: { limit?: number; offset?: number }) =>
    api.get<Chat[]>('/api/chats', {
      token,
      ...(params && { query: new URLSearchParams(params as any).toString() }),
    }),

  /**
   * Get chat details with tasks
   */
  get: (chatId: string, token: string) =>
    api.get<ChatWithTasks>(`/api/chats/${chatId}`, { token }),

  /**
   * Create new chat
   */
  create: (data: CreateChatDto, token: string) =>
    api.post<Chat>('/api/chats', data, { token }),

  /**
   * Update chat
   */
  update: (chatId: string, data: Partial<Chat>, token: string) =>
    api.patch<Chat>(`/api/chats/${chatId}`, data, { token }),

  /**
   * Delete chat
   */
  delete: (chatId: string, token: string) =>
    api.delete(`/api/chats/${chatId}`, { token }),

  /**
   * Generate AI summary for chat
   */
  generateSummary: (chatId: string, token: string) =>
    api.post<{ summary: string }>(`/api/chats/${chatId}/summary`, {}, { token }),
};

export const tasksApi = {
  /**
   * Create task in chat
   */
  create: (chatId: string, data: CreateTaskDto, token: string) =>
    api.post<Task>(`/api/chats/${chatId}/tasks`, data, { token }),

  /**
   * Get task details
   */
  get: (taskId: string, token: string) =>
    api.get<Task>(`/api/tasks/${taskId}`, { token }),

  /**
   * List tasks in chat
   */
  listInChat: (chatId: string, token: string) =>
    api.get<Task[]>(`/api/chats/${chatId}/tasks`, { token }),

  /**
   * Pause task
   */
  pause: (taskId: string, token: string) =>
    api.post<Task>(`/api/tasks/${taskId}/pause`, {}, { token }),

  /**
   * Resume task
   */
  resume: (taskId: string, token: string) =>
    api.post<Task>(`/api/tasks/${taskId}/resume`, {}, { token }),

  /**
   * Cancel task
   */
  cancel: (taskId: string, token: string) =>
    api.post<Task>(`/api/tasks/${taskId}/cancel`, {}, { token }),

  /**
   * Get task logs
   */
  getLogs: (taskId: string, token: string) =>
    api.get<any[]>(`/api/tasks/${taskId}/logs`, { token }),
};
