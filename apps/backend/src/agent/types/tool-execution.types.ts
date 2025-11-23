/**
 * Tool Execution Types
 * Defines types for tool execution, results, and context
 */

import { z } from 'zod';

import { ToolName } from './tools.types';
import { ToolError, ToolErrorSchema } from './tool-error.types';

/**
 * Tool execution result
 */
export interface ToolResult<T = any> {
  success: boolean;
  data: T | null;
  error: ToolError | null;
  metadata?: ToolExecutionMetadata;
}

/**
 * Tool execution metadata
 */
export interface ToolExecutionMetadata {
  executionTime: number;
  retries?: number;
  timestamp: string;
  toolName: ToolName;
  stepId?: string;
}

/**
 * Execution context passed to tool handlers
 */
export interface ExecutionContext {
  userId: string;
  taskId?: string;
  stepId?: string;
  userProfile?: UserProfileContext;
  sessionData?: Record<string, any>;
  dryRun?: boolean;
  timeout?: number;
  retryCount?: number;
  maxRetries?: number;
  previousStepResults?: Map<string, ToolResult>;
}

/**
 * User profile context for tool execution
 */
export interface UserProfileContext {
  travelPrefs?: {
    preferredClass?: string;
    preferredAirline?: string;
    seatPreference?: string;
    mealPreference?: string;
  };
  socialAccounts?: {
    platform: string;
    accountId: string;
    accessToken?: string;
  }[];
  resumeUrl?: string;
  defaultPaymentMethod?: string;
  browserSessions?: Record<string, any>;
}

/**
 * Plan execution result
 */
export interface PlanExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  results: StepExecutionResult[];
  error?: ToolError;
  executionTime: number;
  timestamp: string;
}

/**
 * Individual step execution result
 */
export interface StepExecutionResult {
  stepId: string;
  toolName: ToolName;
  success: boolean;
  result: ToolResult;
  executionTime: number;
  timestamp: string;
}

/**
 * Zod schemas for validation
 */

export const ToolExecutionMetadataSchema = z.object({
  executionTime: z.number(),
  retries: z.number().optional(),
  timestamp: z.string(),
  toolName: z.nativeEnum(ToolName),
  stepId: z.string().optional(),
});

export const ToolResultSchema = z.object({
  success: z.boolean(),
  data: z.any().nullable(),
  error: ToolErrorSchema.nullable(),
  metadata: ToolExecutionMetadataSchema.optional(),
});

export const ExecutionContextSchema = z.object({
  userId: z.string(),
  taskId: z.string().optional(),
  stepId: z.string().optional(),
  userProfile: z.any().optional(),
  sessionData: z.record(z.string(), z.any()).optional(),
  dryRun: z.boolean().optional(),
  timeout: z.number().optional(),
  retryCount: z.number().optional(),
  maxRetries: z.number().optional(),
});

export const StepExecutionResultSchema = z.object({
  stepId: z.string(),
  toolName: z.nativeEnum(ToolName),
  success: z.boolean(),
  result: ToolResultSchema,
  executionTime: z.number(),
  timestamp: z.string(),
});

export const PlanExecutionResultSchema = z.object({
  success: z.boolean(),
  completedSteps: z.number(),
  totalSteps: z.number(),
  results: z.array(StepExecutionResultSchema),
  error: ToolErrorSchema.optional(),
  executionTime: z.number(),
  timestamp: z.string(),
});

/**
 * Helper function to create a successful tool result
 */
export function createSuccessResult<T>(
  data: T,
  toolName: ToolName,
  executionTime: number,
  stepId?: string
): ToolResult<T> {
  return {
    success: true,
    data,
    error: null,
    metadata: {
      executionTime,
      timestamp: new Date().toISOString(),
      toolName,
      stepId,
    },
  };
}

/**
 * Helper function to create an error tool result
 */
export function createErrorResult(
  error: ToolError,
  toolName: ToolName,
  executionTime: number,
  stepId?: string
): ToolResult {
  return {
    success: false,
    data: null,
    error,
    metadata: {
      executionTime,
      timestamp: new Date().toISOString(),
      toolName,
      stepId,
    },
  };
}
