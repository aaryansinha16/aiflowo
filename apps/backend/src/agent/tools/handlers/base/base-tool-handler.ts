/**
 * Base Tool Handler
 * Abstract base class for all tool handler implementations
 */

import { Logger } from '@nestjs/common';

import { ToolName, TOOL_REGISTRY } from '../../../types/tools.types';
import {
  ExecutionContext,
  ToolResult,
  createSuccessResult,
  createErrorResult,
} from '../../../types/tool-execution.types';
import {
  ToolErrorCode,
  createToolError,
} from '../../../types/tool-error.types';
import { ToolHandler } from '../../executor/tool-handler.interface';

/**
 * Abstract base class for tool handlers
 * Provides common functionality like validation, error handling, and logging
 */
export abstract class BaseToolHandler<TParams = any, TResult = any>
  implements ToolHandler<TParams, TResult>
{
  protected readonly logger: Logger;
  public readonly name: ToolName;

  constructor(toolName: ToolName) {
    this.name = toolName;
    this.logger = new Logger(`${toolName}Handler`);
  }

  /**
   * Execute the tool with parameters and context
   * Wraps the actual execution with timing, validation, and error handling
   */
  async execute(
    params: TParams,
    context: ExecutionContext
  ): Promise<ToolResult<TResult>> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Executing ${this.name} for user ${context.userId}${
          context.stepId ? ` (step: ${context.stepId})` : ''
        }`
      );

      // Validate parameters
      await this.validateParams(params);

      // Check if dry run
      if (context.dryRun) {
        this.logger.log(`Dry run mode - skipping actual execution`);
        return this.createDryRunResult(params, context);
      }

      // Execute the actual tool logic
      const result = await this.executeImpl(params, context);

      const executionTime = Date.now() - startTime;
      this.logger.log(
        `${this.name} execution completed in ${executionTime}ms - Success: ${result.success}`
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `${this.name} execution failed after ${executionTime}ms: ${error.message}`,
        error.stack
      );

      return createErrorResult(
        createToolError(
          this.getErrorCode(error),
          error.message || 'Tool execution failed',
          { originalError: error.message },
          this.isRetryable(error)
        ),
        this.name,
        executionTime,
        context.stepId
      );
    }
  }

  /**
   * Validate parameters using Zod schema from tool registry
   */
  async validateParams(params: TParams): Promise<void> {
    const toolDef = TOOL_REGISTRY[this.name];
    if (!toolDef) {
      throw new Error(`Tool ${this.name} not found in registry`);
    }

    try {
      toolDef.paramsSchema.parse(params);
    } catch (error: any) {
      this.logger.error(`Parameter validation failed for ${this.name}`, error);
      throw new Error(
        `Invalid parameters: ${error.errors?.map((e: any) => e.message).join(', ') || error.message}`
      );
    }
  }

  /**
   * Check if handler supports the given context
   */
  supportsContext(context: ExecutionContext): boolean {
    const toolDef = TOOL_REGISTRY[this.name];
    
    // Check if tool requires auth and user is authenticated
    if (toolDef?.requiresAuth && !context.userId) {
      return false;
    }

    return true;
  }

  /**
   * Create a dry run result (for testing without actual execution)
   */
  protected createDryRunResult(
    params: TParams,
    context: ExecutionContext
  ): ToolResult<TResult> {
    return createSuccessResult(
      { dryRun: true, params } as any,
      this.name,
      0,
      context.stepId
    );
  }

  /**
   * Determine error code from exception
   */
  protected getErrorCode(error: any): ToolErrorCode {
    if (error.name === 'ValidationError' || error.name === 'ZodError') {
      return ToolErrorCode.VALIDATION_ERROR;
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return ToolErrorCode.NETWORK_ERROR;
    }
    if (error.message?.includes('timeout')) {
      return ToolErrorCode.TIMEOUT;
    }
    if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
      return ToolErrorCode.AUTH_REQUIRED;
    }
    if (error.message?.includes('rate limit')) {
      return ToolErrorCode.RATE_LIMIT;
    }
    if (error.message?.includes('not found')) {
      return ToolErrorCode.RESOURCE_NOT_FOUND;
    }

    return ToolErrorCode.EXECUTION_ERROR;
  }

  /**
   * Determine if error is retryable
   */
  protected isRetryable(error: any): boolean {
    const code = this.getErrorCode(error);
    return [
      ToolErrorCode.TIMEOUT,
      ToolErrorCode.NETWORK_ERROR,
      ToolErrorCode.RATE_LIMIT,
      ToolErrorCode.EXTERNAL_API_ERROR,
    ].includes(code);
  }

  /**
   * Abstract method - must be implemented by subclasses
   * Contains the actual tool execution logic
   */
  protected abstract executeImpl(
    params: TParams,
    context: ExecutionContext
  ): Promise<ToolResult<TResult>>;
}
