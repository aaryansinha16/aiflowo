/**
 * Intent types and schemas for the LLM Intent Classifier
 */

import { z } from 'zod';

/**
 * Supported intent types
 */
export enum IntentType {
  // Utility intents
  GET_WEATHER = 'get_weather',
  CALCULATE = 'calculate',
  
  // Flight intents
  FLIGHT_SEARCH = 'flight_search',
  BOOK_FLIGHT = 'book_flight',
  
  // Job intents
  APPLY_JOB = 'apply_job',
  
  // Form intents
  FILL_FORM = 'fill_form',
  
  // Social media intents
  POST_SOCIAL = 'post_social',
  
  // Browser intents
  BROWSER_ACTION = 'browser_action',
  
  // General
  UNKNOWN = 'unknown',
}

/**
 * Utility tool parameters
 */
export const GetWeatherIntentParamsSchema = z.object({
  location: z.string().describe('City name or location'),
  units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
});

export const CalculateIntentParamsSchema = z.object({
  expression: z.string().describe('Mathematical expression to evaluate'),
});

/**
 * Flight search parameters
 */
export const FlightSearchParamsSchema = z.object({
  from: z.string().optional().describe('Departure city or airport code'),
  to: z.string().optional().describe('Destination city or airport code'),
  date: z.string().optional().describe('Departure date in YYYY-MM-DD format'),
  returnDate: z.string().optional().describe('Return date in YYYY-MM-DD format'),
  passengers: z.number().optional().default(1).describe('Number of passengers'),
  class: z
    .enum(['economy', 'premium_economy', 'business', 'first'])
    .optional()
    .default('economy')
    .describe('Cabin class'),
  budget: z.number().optional().describe('Maximum budget in local currency'),
});

/**
 * Book flight parameters
 */
export const BookFlightParamsSchema = z.object({
  flightOptionId: z.string().describe('ID of the flight option to book'),
  passengers: z
    .array(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        dateOfBirth: z.string().optional(),
        passportNumber: z.string().optional(),
      })
    )
    .describe('Passenger details'),
  paymentMethodId: z.string().optional().describe('Payment method reference'),
});

/**
 * Job application parameters
 */
export const ApplyJobParamsSchema = z.object({
  jobUrl: z.string().optional().describe('URL of the job posting'),
  jobTitle: z.string().optional().describe('Job title or position'),
  company: z.string().optional().describe('Company name'),
  resumeId: z.string().optional().describe('Resume file reference'),
  coverLetter: z.string().optional().describe('Cover letter text'),
  answers: z.record(z.string(), z.string()).optional().describe('Custom application questions'),
});

/**
 * Form filling parameters
 */
export const FillFormParamsSchema = z.object({
  url: z.string().describe('URL of the form to fill'),
  fields: z.record(z.string(), z.string()).optional().describe('Form field values'),
  files: z.record(z.string(), z.string()).optional().describe('File uploads (field name -> file reference)'),
  submitForm: z.boolean().optional().default(true).describe('Whether to submit after filling'),
});

/**
 * Social media post parameters
 */
export const PostSocialParamsSchema = z.object({
  platform: z
    .enum(['instagram', 'twitter', 'facebook', 'linkedin'])
    .describe('Social media platform'),
  accountId: z.string().optional().describe('Account identifier'),
  caption: z.string().optional().describe('Post caption or text'),
  mediaIds: z.array(z.string()).optional().describe('Media file references'),
  scheduledFor: z.string().optional().describe('Scheduled post time in ISO format'),
  tags: z.array(z.string()).optional().describe('Hashtags or mentions'),
});

/**
 * Browser action parameters
 */
export const BrowserActionParamsSchema = z.object({
  url: z.string().optional().describe('Starting URL'),
  steps: z
    .array(
      z.object({
        action: z.enum(['goto', 'click', 'type', 'select', 'upload', 'screenshot', 'wait']),
        selector: z.string().optional(),
        value: z.string().optional(),
      })
    )
    .optional()
    .describe('Step-by-step browser actions'),
  description: z.string().optional().describe('Natural language description of the task'),
});

/**
 * Union of all parameter schemas
 */
export const IntentParamsSchema = z.union([
  GetWeatherIntentParamsSchema,
  CalculateIntentParamsSchema,
  FlightSearchParamsSchema,
  BookFlightParamsSchema,
  ApplyJobParamsSchema,
  FillFormParamsSchema,
  PostSocialParamsSchema,
  BrowserActionParamsSchema,
  z.object({}).describe('No parameters'),
]);

/**
 * Intent classification result
 */
export const IntentClassificationSchema = z.object({
  intent: z.nativeEnum(IntentType).describe('The classified intent type'),
  params: z.record(z.string(), z.unknown()).describe('Extracted parameters from user message'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score (0-1)'),
  missingFields: z.array(z.string()).optional().describe('Required fields that are missing'),
});

export type GetWeatherIntentParams = z.infer<typeof GetWeatherIntentParamsSchema>;
export type CalculateIntentParams = z.infer<typeof CalculateIntentParamsSchema>;
export type FlightSearchParams = z.infer<typeof FlightSearchParamsSchema>;
export type BookFlightParams = z.infer<typeof BookFlightParamsSchema>;
export type ApplyJobParams = z.infer<typeof ApplyJobParamsSchema>;
export type FillFormParams = z.infer<typeof FillFormParamsSchema>;
export type PostSocialParams = z.infer<typeof PostSocialParamsSchema>;
export type BrowserActionParams = z.infer<typeof BrowserActionParamsSchema>;
export type IntentParams = z.infer<typeof IntentParamsSchema>;
export type IntentClassification = z.infer<typeof IntentClassificationSchema>;
