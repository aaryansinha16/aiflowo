/**
 * Tool Handler Interface
 * Defines the contract for all tool handler implementations
 */

import { ExecutionContext, ToolResult } from '../../types/tool-execution.types';
import { ToolName } from '../../types/tools.types';

/**
 * Base interface for all tool handlers
 */
export interface ToolHandler<TParams = any, TResult = any> {
  /**
   * Tool name this handler is responsible for
   */
  readonly name: ToolName;

  /**
   * Execute the tool with given parameters and context
   */
  execute(params: TParams, context: ExecutionContext): Promise<ToolResult<TResult>>;

  /**
   * Validate parameters before execution (optional)
   * Throws error if validation fails
   */
  validate?(params: TParams): Promise<void>;

  /**
   * Check if handler supports the given context (optional)
   * Used for conditional execution based on context
   */
  supportsContext?(context: ExecutionContext): boolean;
}

/**
 * Handler metadata for registration
 */
export interface ToolHandlerMetadata {
  name: ToolName;
  description: string;
  category: string;
  requiresAuth?: boolean;
  averageExecutionTime?: number;
}
