/**
 * Task Plan Types and Schemas
 * Defines the structure for multi-step execution plans
 */

import { z } from 'zod';

import { IntentType } from './intent.types';
import { ToolName } from './tools.types';

/**
 * A single step in an execution plan
 */
export const PlanStepSchema = z.object({
  id: z.string().optional().describe('Unique step identifier'),
  tool: z.nativeEnum(ToolName).describe('Tool to execute'),
  params: z.record(z.string(), z.unknown()).describe('Tool parameters'),
  description: z.string().optional().describe('Human-readable step description'),
  dependsOn: z.array(z.string()).optional().describe('IDs of steps this depends on'),
  optional: z.boolean().optional().default(false).describe('Can skip if fails'),
  retryable: z.boolean().optional().default(true).describe('Can retry on failure'),
  maxRetries: z.number().optional().default(3).describe('Maximum retry attempts'),
});

/**
 * Complete task execution plan
 */
export const TaskPlanSchema = z.object({
  intent: z.nativeEnum(IntentType).describe('Original intent type'),
  steps: z.array(PlanStepSchema).min(1).describe('Ordered execution steps'),
  metadata: z.object({
    estimatedDuration: z.number().optional().describe('Estimated time in seconds'),
    requiresUserInput: z.boolean().optional().default(false).describe('May need user interaction'),
    complexity: z.enum(['simple', 'moderate', 'complex']).optional().default('moderate'),
    totalSteps: z.number().describe('Total number of steps'),
  }).optional(),
  validationRules: z.array(z.object({
    stepId: z.string().describe('Step to validate'),
    rule: z.string().describe('Validation rule'),
    required: z.boolean().default(true),
  })).optional().describe('Post-execution validation rules'),
});

/**
 * Plan execution context
 */
export const PlanContextSchema = z.object({
  userId: z.string().describe('User executing the plan'),
  userProfile: z.object({
    travelPrefs: z.record(z.string(), z.unknown()).optional(),
    socialAccounts: z.record(z.string(), z.unknown()).optional(),
    resumeUrl: z.string().optional(),
    paymentMethods: z.array(z.string()).optional(),
  }).optional(),
  environment: z.enum(['development', 'staging', 'production']).optional().default('production'),
  dryRun: z.boolean().optional().default(false).describe('Validate without executing'),
});

/**
 * Plan validation result
 */
export const PlanValidationResultSchema = z.object({
  valid: z.boolean().describe('Is plan valid'),
  errors: z.array(z.object({
    stepId: z.string().optional(),
    code: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning']),
  })),
  warnings: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
});

/**
 * Plan execution result
 */
export const PlanExecutionResultSchema = z.object({
  success: z.boolean(),
  completedSteps: z.number(),
  totalSteps: z.number(),
  results: z.array(z.object({
    stepId: z.string(),
    tool: z.nativeEnum(ToolName),
    success: z.boolean(),
    output: z.unknown().optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }).optional(),
    duration: z.number().optional().describe('Execution time in ms'),
    retries: z.number().default(0),
  })),
  finalOutput: z.unknown().optional().describe('Final plan output'),
  screenshot: z.string().optional().describe('Confirmation screenshot URL'),
});

/**
 * Type exports
 */
export type PlanStep = {
  id?: string;
  tool: ToolName;
  params: Record<string, unknown>;
  description?: string;
  dependsOn?: string[];
  optional?: boolean;
  retryable?: boolean;
  maxRetries?: number;
};

export type TaskPlan = {
  intent: IntentType;
  steps: PlanStep[];
  metadata?: {
    estimatedDuration?: number;
    requiresUserInput?: boolean;
    complexity?: 'simple' | 'moderate' | 'complex';
    totalSteps: number;
  };
  validationRules?: Array<{
    stepId: string;
    rule: string;
    required?: boolean;
  }>;
};

export type PlanContext = {
  userId: string;
  userProfile?: {
    travelPrefs?: Record<string, unknown>;
    socialAccounts?: Record<string, unknown>;
    resumeUrl?: string;
    paymentMethods?: string[];
  };
  environment?: 'development' | 'staging' | 'production';
  dryRun?: boolean;
};

export type PlanValidationResult = z.infer<typeof PlanValidationResultSchema>;
export type PlanExecutionResult = z.infer<typeof PlanExecutionResultSchema>;

/**
 * Plan templates for common intents
 * These serve as examples and can be customized by the LLM
 */
export const PLAN_TEMPLATES: Record<IntentType, Partial<TaskPlan>> = {
  [IntentType.FLIGHT_SEARCH]: {
    intent: IntentType.FLIGHT_SEARCH,
    steps: [
      {
        tool: ToolName.SEARCH_FLIGHTS,
        params: {},
        description: 'Search for available flights',
      },
      {
        tool: ToolName.VALIDATE_RESULTS,
        params: { minResults: 1 },
        description: 'Validate search results',
      },
    ],
    metadata: {
      complexity: 'simple',
      totalSteps: 2,
    },
  },
  
  [IntentType.BOOK_FLIGHT]: {
    intent: IntentType.BOOK_FLIGHT,
    steps: [
      {
        tool: ToolName.BOOK_FLIGHT,
        params: {},
        description: 'Book the selected flight',
      },
      {
        tool: ToolName.VERIFY_BOOKING,
        params: { bookingType: 'flight' },
        description: 'Verify booking confirmation',
      },
      {
        tool: ToolName.TAKE_SCREENSHOT,
        params: { fullPage: true },
        description: 'Capture confirmation screenshot',
      },
    ],
    metadata: {
      complexity: 'moderate',
      requiresUserInput: true,
      totalSteps: 3,
    },
  },
  
  [IntentType.APPLY_JOB]: {
    intent: IntentType.APPLY_JOB,
    steps: [
      {
        tool: ToolName.GENERATE_COVER_LETTER,
        params: {},
        description: 'Generate personalized cover letter',
      },
      {
        tool: ToolName.APPLY_JOB,
        params: {},
        description: 'Submit job application',
      },
      {
        tool: ToolName.TAKE_SCREENSHOT,
        params: { fullPage: true },
        description: 'Capture application confirmation',
      },
    ],
    metadata: {
      complexity: 'moderate',
      totalSteps: 3,
    },
  },
  
  [IntentType.FILL_FORM]: {
    intent: IntentType.FILL_FORM,
    steps: [
      {
        tool: ToolName.ANALYZE_FORM,
        params: {},
        description: 'Analyze form structure',
        optional: true,
      },
      {
        tool: ToolName.FILL_FORM,
        params: {},
        description: 'Fill and submit form',
      },
      {
        tool: ToolName.CHECK_COMPLETION,
        params: { screenshot: true },
        description: 'Verify form submission',
      },
    ],
    metadata: {
      complexity: 'moderate',
      requiresUserInput: true,
      totalSteps: 3,
    },
  },
  
  [IntentType.POST_SOCIAL]: {
    intent: IntentType.POST_SOCIAL,
    steps: [
      {
        tool: ToolName.GENERATE_CAPTION,
        params: {},
        description: 'Generate caption with hashtags',
        optional: true,
      },
      {
        tool: ToolName.POST_SOCIAL,
        params: {},
        description: 'Post to social media',
      },
      {
        tool: ToolName.TAKE_SCREENSHOT,
        params: {},
        description: 'Capture post confirmation',
      },
    ],
    metadata: {
      complexity: 'simple',
      totalSteps: 3,
    },
  },
  
  [IntentType.BROWSER_ACTION]: {
    intent: IntentType.BROWSER_ACTION,
    steps: [
      {
        tool: ToolName.BROWSER_ACTION,
        params: {},
        description: 'Execute custom browser actions',
      },
      {
        tool: ToolName.TAKE_SCREENSHOT,
        params: { fullPage: true },
        description: 'Capture final state',
      },
    ],
    metadata: {
      complexity: 'complex',
      totalSteps: 2,
    },
  },
  
  [IntentType.UNKNOWN]: {
    intent: IntentType.UNKNOWN,
    steps: [],
    metadata: {
      complexity: 'simple',
      totalSteps: 0,
    },
  },
};
