/**
 * Shared API Types
 * These types are shared between frontend and backend
 * Single source of truth for API contracts
 */

// ============================================================================
// CHAT TYPES
// ============================================================================

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

export interface CreateChatDto {
  title?: string;
  firstMessage: string;
}

export interface UpdateChatDto {
  title?: string;
  summary?: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ArtifactType = 'SCREENSHOT' | 'FILE' | 'DATA' | 'LOG' | 'CODE' | 'OTHER';

export interface Task {
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

export interface CreateTaskDto {
  intent: string;
  priority?: TaskPriority;
}

export interface TaskLog {
  id: string;
  taskId: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  metadata?: any;
  createdAt: string;
}

export interface TaskArtifact {
  id: string;
  taskId: string;
  type: ArtifactType;
  name: string;
  description?: string;
  url: string;
  createdAt: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  profile?: {
    profilePicUrl?: string;
    [key: string]: any;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// API ERROR TYPES
// ============================================================================

export interface APIError {
  message: string;
  status: number;
  data?: any;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
