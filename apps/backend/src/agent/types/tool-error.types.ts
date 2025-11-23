/**
 * Tool Error Types and Schemas
 * Defines standardized error handling for tool execution
 */

import { z } from 'zod';

/**
 * Standard error codes for tool execution
 */
export enum ToolErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  RATE_LIMIT = 'RATE_LIMIT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_PARAMS = 'INVALID_PARAMS',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Tool error structure
 */
export interface ToolError {
  code: ToolErrorCode;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: string;
}

/**
 * Zod schema for tool error validation
 */
export const ToolErrorSchema = z.object({
  code: z.nativeEnum(ToolErrorCode),
  message: z.string(),
  details: z.any().optional(),
  retryable: z.boolean(),
  timestamp: z.string(),
});

/**
 * Helper function to create a tool error
 */
export function createToolError(
  code: ToolErrorCode,
  message: string,
  details?: any,
  retryable: boolean = false
): ToolError {
  return {
    code,
    message,
    details,
    retryable,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determine if an error is retryable based on error code
 */
export function isRetryableError(error: ToolError): boolean {
  const retryableCodes = [
    ToolErrorCode.TIMEOUT,
    ToolErrorCode.NETWORK_ERROR,
    ToolErrorCode.RATE_LIMIT,
    ToolErrorCode.EXTERNAL_API_ERROR,
  ];
  
  return error.retryable || retryableCodes.includes(error.code);
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Get error severity based on error code
 */
export function getErrorSeverity(code: ToolErrorCode): ErrorSeverity {
  switch (code) {
    case ToolErrorCode.VALIDATION_ERROR:
    case ToolErrorCode.INVALID_PARAMS:
      return ErrorSeverity.LOW;
    
    case ToolErrorCode.NETWORK_ERROR:
    case ToolErrorCode.TIMEOUT:
    case ToolErrorCode.RATE_LIMIT:
      return ErrorSeverity.MEDIUM;
    
    case ToolErrorCode.AUTH_REQUIRED:
    case ToolErrorCode.RESOURCE_NOT_FOUND:
      return ErrorSeverity.HIGH;
    
    case ToolErrorCode.EXECUTION_ERROR:
    case ToolErrorCode.EXTERNAL_API_ERROR:
    case ToolErrorCode.BROWSER_ERROR:
    case ToolErrorCode.UNKNOWN_ERROR:
      return ErrorSeverity.CRITICAL;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}
