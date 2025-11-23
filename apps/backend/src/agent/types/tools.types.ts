/**
 * Tool Registry Types
 * Defines all available tools that can be used in execution plans
 */

import { z } from 'zod';

/**
 * Available tool names
 */
export enum ToolName {
  // Flight tools
  SEARCH_FLIGHTS = 'search_flights',
  BOOK_FLIGHT = 'book_flight',
  
  // Job tools
  SEARCH_JOBS = 'search_jobs',
  APPLY_JOB = 'apply_job',
  GENERATE_COVER_LETTER = 'generate_cover_letter',
  
  // Form tools
  FILL_FORM = 'fill_form',
  ANALYZE_FORM = 'analyze_form',
  
  // Social media tools
  POST_SOCIAL = 'post_social',
  SCHEDULE_POST = 'schedule_post',
  GENERATE_CAPTION = 'generate_caption',
  
  // Browser tools
  BROWSER_ACTION = 'browser_action',
  NAVIGATE_TO = 'navigate_to',
  EXTRACT_DATA = 'extract_data',
  TAKE_SCREENSHOT = 'take_screenshot',
  
  // Validation tools
  VALIDATE_RESULTS = 'validate_results',
  CHECK_COMPLETION = 'check_completion',
  VERIFY_BOOKING = 'verify_booking',
}

/**
 * Tool parameter schemas
 */

// Flight tool parameters
export const SearchFlightsParamsSchema = z.object({
  from: z.string().describe('Departure airport code or city'),
  to: z.string().describe('Destination airport code or city'),
  date: z.string().describe('Departure date (YYYY-MM-DD)'),
  returnDate: z.string().optional().describe('Return date (YYYY-MM-DD)'),
  passengers: z.number().default(1).describe('Number of passengers'),
  class: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  budget: z.number().optional().describe('Maximum budget'),
});

export const BookFlightParamsSchema = z.object({
  flightOptionId: z.string().describe('Selected flight option ID'),
  passengers: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string().optional(),
    passportNumber: z.string().optional(),
  })),
  paymentMethodId: z.string().optional().describe('Payment method reference'),
});

// Job tool parameters
export const SearchJobsParamsSchema = z.object({
  query: z.string().describe('Job search query'),
  location: z.string().optional().describe('Job location'),
  remote: z.boolean().optional().describe('Remote jobs only'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
});

export const ApplyJobParamsSchema = z.object({
  jobUrl: z.string().describe('Job posting URL'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  resumeId: z.string().optional().describe('Resume file reference'),
  coverLetter: z.string().optional().describe('Cover letter text'),
  answers: z.record(z.string(), z.string()).optional().describe('Application questions'),
});

export const GenerateCoverLetterParamsSchema = z.object({
  jobTitle: z.string().describe('Job title'),
  company: z.string().describe('Company name'),
  jobDescription: z.string().optional().describe('Job description'),
  resumeId: z.string().optional().describe('Resume reference'),
  tone: z.enum(['professional', 'enthusiastic', 'creative']).default('professional'),
});

// Form tool parameters
export const FillFormParamsSchema = z.object({
  url: z.string().describe('Form URL'),
  fields: z.record(z.string(), z.string()).optional().describe('Form field values'),
  files: z.record(z.string(), z.string()).optional().describe('File uploads'),
  submitForm: z.boolean().default(true).describe('Submit after filling'),
});

export const AnalyzeFormParamsSchema = z.object({
  url: z.string().describe('Form URL'),
  returnStructure: z.boolean().default(true).describe('Return form structure'),
});

// Social media tool parameters
export const PostSocialParamsSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin']),
  accountId: z.string().optional().describe('Account ID'),
  caption: z.string().optional().describe('Post caption'),
  mediaIds: z.array(z.string()).optional().describe('Media file references'),
  scheduledFor: z.string().optional().describe('Schedule time (ISO format)'),
  tags: z.array(z.string()).optional().describe('Hashtags'),
});

export const SchedulePostParamsSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin']),
  scheduledFor: z.string().describe('Schedule time (ISO format)'),
  caption: z.string(),
  mediaIds: z.array(z.string()).optional(),
});

export const GenerateCaptionParamsSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin']),
  context: z.string().describe('What the post is about'),
  tone: z.enum(['casual', 'professional', 'funny', 'inspirational']).default('casual'),
  includeHashtags: z.boolean().default(true),
  maxLength: z.number().optional(),
});

// Browser tool parameters
export const BrowserActionParamsSchema = z.object({
  url: z.string().optional().describe('Starting URL'),
  steps: z.array(z.object({
    action: z.enum(['goto', 'click', 'type', 'select', 'upload', 'screenshot', 'wait', 'extract']),
    selector: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  description: z.string().optional().describe('Natural language task description'),
});

export const NavigateToParamsSchema = z.object({
  url: z.string().describe('URL to navigate to'),
  waitForSelector: z.string().optional().describe('Wait for element'),
});

export const ExtractDataParamsSchema = z.object({
  url: z.string().optional().describe('URL (if not already on page)'),
  selectors: z.record(z.string(), z.string()).describe('Data to extract'),
});

export const TakeScreenshotParamsSchema = z.object({
  fullPage: z.boolean().default(false),
  selector: z.string().optional().describe('Screenshot specific element'),
});

// Validation tool parameters
export const ValidateResultsParamsSchema = z.object({
  stepId: z.string().optional().describe('Step to validate'),
  minResults: z.number().optional().describe('Minimum expected results'),
  required: z.boolean().default(true).describe('Is this validation required'),
});

export const CheckCompletionParamsSchema = z.object({
  expectedOutcome: z.string().describe('What to verify'),
  screenshot: z.boolean().default(true).describe('Take confirmation screenshot'),
});

export const VerifyBookingParamsSchema = z.object({
  bookingType: z.enum(['flight', 'hotel', 'job_application', 'form_submission']),
  confirmationRequired: z.array(z.string()).describe('Required confirmation fields'),
});

/**
 * Tool definition with schema
 */
export interface ToolDefinition {
  name: ToolName;
  description: string;
  category: 'flight' | 'job' | 'form' | 'social' | 'browser' | 'validation';
  paramsSchema: z.ZodType<any>;
  requiresAuth?: boolean;
  isAsync?: boolean;
}

/**
 * Tool registry - all available tools
 */
export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  // Flight tools
  [ToolName.SEARCH_FLIGHTS]: {
    name: ToolName.SEARCH_FLIGHTS,
    description: 'Search for flight options based on criteria',
    category: 'flight',
    paramsSchema: SearchFlightsParamsSchema,
    isAsync: true,
  },
  [ToolName.BOOK_FLIGHT]: {
    name: ToolName.BOOK_FLIGHT,
    description: 'Book a selected flight with passenger details',
    category: 'flight',
    paramsSchema: BookFlightParamsSchema,
    requiresAuth: true,
    isAsync: true,
  },
  
  // Job tools
  [ToolName.SEARCH_JOBS]: {
    name: ToolName.SEARCH_JOBS,
    description: 'Search for job openings',
    category: 'job',
    paramsSchema: SearchJobsParamsSchema,
    isAsync: true,
  },
  [ToolName.APPLY_JOB]: {
    name: ToolName.APPLY_JOB,
    description: 'Apply to a job posting',
    category: 'job',
    paramsSchema: ApplyJobParamsSchema,
    requiresAuth: true,
    isAsync: true,
  },
  [ToolName.GENERATE_COVER_LETTER]: {
    name: ToolName.GENERATE_COVER_LETTER,
    description: 'Generate a personalized cover letter',
    category: 'job',
    paramsSchema: GenerateCoverLetterParamsSchema,
    isAsync: true,
  },
  
  // Form tools
  [ToolName.FILL_FORM]: {
    name: ToolName.FILL_FORM,
    description: 'Fill and submit a web form',
    category: 'form',
    paramsSchema: FillFormParamsSchema,
    isAsync: true,
  },
  [ToolName.ANALYZE_FORM]: {
    name: ToolName.ANALYZE_FORM,
    description: 'Analyze form structure and required fields',
    category: 'form',
    paramsSchema: AnalyzeFormParamsSchema,
    isAsync: true,
  },
  
  // Social media tools
  [ToolName.POST_SOCIAL]: {
    name: ToolName.POST_SOCIAL,
    description: 'Post content on social media',
    category: 'social',
    paramsSchema: PostSocialParamsSchema,
    requiresAuth: true,
    isAsync: true,
  },
  [ToolName.SCHEDULE_POST]: {
    name: ToolName.SCHEDULE_POST,
    description: 'Schedule a social media post',
    category: 'social',
    paramsSchema: SchedulePostParamsSchema,
    requiresAuth: true,
    isAsync: true,
  },
  [ToolName.GENERATE_CAPTION]: {
    name: ToolName.GENERATE_CAPTION,
    description: 'Generate social media caption with hashtags',
    category: 'social',
    paramsSchema: GenerateCaptionParamsSchema,
    isAsync: true,
  },
  
  // Browser tools
  [ToolName.BROWSER_ACTION]: {
    name: ToolName.BROWSER_ACTION,
    description: 'Execute custom browser automation',
    category: 'browser',
    paramsSchema: BrowserActionParamsSchema,
    isAsync: true,
  },
  [ToolName.NAVIGATE_TO]: {
    name: ToolName.NAVIGATE_TO,
    description: 'Navigate to a URL',
    category: 'browser',
    paramsSchema: NavigateToParamsSchema,
    isAsync: true,
  },
  [ToolName.EXTRACT_DATA]: {
    name: ToolName.EXTRACT_DATA,
    description: 'Extract data from a webpage',
    category: 'browser',
    paramsSchema: ExtractDataParamsSchema,
    isAsync: true,
  },
  [ToolName.TAKE_SCREENSHOT]: {
    name: ToolName.TAKE_SCREENSHOT,
    description: 'Take a screenshot for verification',
    category: 'browser',
    paramsSchema: TakeScreenshotParamsSchema,
    isAsync: true,
  },
  
  // Validation tools
  [ToolName.VALIDATE_RESULTS]: {
    name: ToolName.VALIDATE_RESULTS,
    description: 'Validate step execution results',
    category: 'validation',
    paramsSchema: ValidateResultsParamsSchema,
    isAsync: false,
  },
  [ToolName.CHECK_COMPLETION]: {
    name: ToolName.CHECK_COMPLETION,
    description: 'Check if task completed successfully',
    category: 'validation',
    paramsSchema: CheckCompletionParamsSchema,
    isAsync: true,
  },
  [ToolName.VERIFY_BOOKING]: {
    name: ToolName.VERIFY_BOOKING,
    description: 'Verify booking or submission confirmation',
    category: 'validation',
    paramsSchema: VerifyBookingParamsSchema,
    isAsync: true,
  },
};

/**
 * Type exports
 */
export type SearchFlightsParams = z.infer<typeof SearchFlightsParamsSchema>;
export type BookFlightParams = z.infer<typeof BookFlightParamsSchema>;
export type SearchJobsParams = z.infer<typeof SearchJobsParamsSchema>;
export type ApplyJobParams = z.infer<typeof ApplyJobParamsSchema>;
export type GenerateCoverLetterParams = z.infer<typeof GenerateCoverLetterParamsSchema>;
export type FillFormParams = z.infer<typeof FillFormParamsSchema>;
export type AnalyzeFormParams = z.infer<typeof AnalyzeFormParamsSchema>;
export type PostSocialParams = z.infer<typeof PostSocialParamsSchema>;
export type SchedulePostParams = z.infer<typeof SchedulePostParamsSchema>;
export type GenerateCaptionParams = z.infer<typeof GenerateCaptionParamsSchema>;
export type BrowserActionParams = z.infer<typeof BrowserActionParamsSchema>;
export type NavigateToParams = z.infer<typeof NavigateToParamsSchema>;
export type ExtractDataParams = z.infer<typeof ExtractDataParamsSchema>;
export type TakeScreenshotParams = z.infer<typeof TakeScreenshotParamsSchema>;
export type ValidateResultsParams = z.infer<typeof ValidateResultsParamsSchema>;
export type CheckCompletionParams = z.infer<typeof CheckCompletionParamsSchema>;
export type VerifyBookingParams = z.infer<typeof VerifyBookingParamsSchema>;
