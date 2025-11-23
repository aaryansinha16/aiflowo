/**
 * Tool Executor Service
 * Main service for executing tools and managing tool execution lifecycle
 */

import { Injectable, Logger } from '@nestjs/common';

import { TaskPlan, PlanStep } from '../../types/plan.types';
import { ToolName } from '../../types/tools.types';
import {
  ExecutionContext,
  ToolResult,
  PlanExecutionResult,
  StepExecutionResult,
  createErrorResult,
} from '../../types/tool-execution.types';
import {
  ToolErrorCode,
  createToolError,
  isRetryableError,
} from '../../types/tool-error.types';
import { ToolHandlerRegistry } from '../registry/tool-handler-registry';

/**
 * Service for executing tools and plans
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(private readonly handlerRegistry: ToolHandlerRegistry) {}

  /**
   * Execute a single tool
   */
  async executeTool<T = any>(
    toolName: ToolName,
    params: any,
    context: ExecutionContext
  ): Promise<ToolResult<T>> {
    const startTime = Date.now();

    try {
      // Get handler
      const handler = this.handlerRegistry.getHandler(toolName);
      if (!handler) {
        this.logger.error(`No handler found for tool: ${toolName}`);
        return createErrorResult(
          createToolError(
            ToolErrorCode.EXECUTION_ERROR,
            `No handler registered for tool: ${toolName}`,
            { toolName },
            false
          ),
          toolName,
          Date.now() - startTime,
          context.stepId
        );
      }

      // Check if handler supports context
      if (handler.supportsContext && !handler.supportsContext(context)) {
        this.logger.warn(`Handler ${toolName} does not support given context`);
        return createErrorResult(
          createToolError(
            ToolErrorCode.AUTH_REQUIRED,
            `Tool ${toolName} requires authentication or different context`,
            { toolName },
            false
          ),
          toolName,
          Date.now() - startTime,
          context.stepId
        );
      }

      // Execute with retries
      const maxRetries = context.maxRetries ?? 3;
      let lastError: ToolResult<any> | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const attemptContext = {
            ...context,
            retryCount: attempt,
          };

          this.logger.debug(
            `Executing ${toolName} (attempt ${attempt + 1}/${maxRetries + 1})`
          );

          const result: ToolResult<any> = await this.executeWithTimeout(
            handler,
            params,
            attemptContext
          );

          if (result.success || !result.error) {
            if (attempt > 0) {
              this.logger.log(
                `${toolName} succeeded after ${attempt} retries`
              );
            }
            return result as ToolResult<T>;
          }

          lastError = result;

          // Check if error is retryable
          if (!result.error || !isRetryableError(result.error)) {
            this.logger.warn(
              `${toolName} failed with non-retryable error: ${result.error?.message}`
            );
            return result;
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            this.logger.debug(`Waiting ${delayMs}ms before retry`);
            await this.delay(delayMs);
          }
        } catch (error) {
          this.logger.error(
            `Unexpected error during ${toolName} execution:`,
            error
          );
          lastError = createErrorResult(
            createToolError(
              ToolErrorCode.UNKNOWN_ERROR,
              error.message || 'Unexpected error',
              { originalError: error },
              true
            ),
            toolName,
            Date.now() - startTime,
            context.stepId
          );
        }
      }

      // All retries failed
      this.logger.error(
        `${toolName} failed after ${maxRetries + 1} attempts`
      );
      return (
        lastError ||
        createErrorResult(
          createToolError(
            ToolErrorCode.EXECUTION_ERROR,
            'Tool execution failed after all retries',
            { toolName },
            false
          ),
          toolName,
          Date.now() - startTime,
          context.stepId
        )
      );
    } catch (error) {
      this.logger.error(`Fatal error executing ${toolName}:`, error);
      return createErrorResult(
        createToolError(
          ToolErrorCode.UNKNOWN_ERROR,
          error.message || 'Fatal execution error',
          { originalError: error },
          false
        ),
        toolName,
        Date.now() - startTime,
        context.stepId
      );
    }
  }

  /**
   * Execute a complete plan (sequence of steps)
   */
  async executePlan(
    plan: TaskPlan,
    context: ExecutionContext
  ): Promise<PlanExecutionResult> {
    const startTime = Date.now();
    const results: StepExecutionResult[] = [];
    const stepResultsMap = new Map<string, ToolResult>();

    this.logger.log(
      `Executing plan with ${plan.steps.length} steps for intent: ${plan.intent}`
    );

    try {
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const stepId = step.id || `step_${i + 1}`;
        const stepStartTime = Date.now();

        this.logger.log(
          `Executing step ${i + 1}/${plan.steps.length}: ${step.tool} (${stepId})`
        );

        // Check dependencies
        if (step.dependsOn && step.dependsOn.length > 0) {
          const depCheck = this.checkDependencies(step, stepResultsMap);
          if (!depCheck.satisfied) {
            this.logger.error(
              `Step ${stepId} dependencies not satisfied: ${depCheck.message}`
            );
            
            const errorResult = createErrorResult(
              createToolError(
                ToolErrorCode.EXECUTION_ERROR,
                `Dependency check failed: ${depCheck.message}`,
                { step: stepId, dependencies: step.dependsOn },
                false
              ),
              step.tool,
              Date.now() - stepStartTime,
              stepId
            );

            results.push({
              stepId,
              toolName: step.tool,
              success: false,
              result: errorResult,
              executionTime: Date.now() - stepStartTime,
              timestamp: new Date().toISOString(),
            });

            // Stop execution if required step failed
            if (!step.optional) {
              break;
            }
            continue;
          }
        }

        // Execute step
        const stepContext: ExecutionContext = {
          ...context,
          stepId,
          previousStepResults: stepResultsMap,
        };

        const result = await this.executeTool(
          step.tool,
          step.params,
          stepContext
        );

        // Store result
        stepResultsMap.set(stepId, result);

        const stepExecutionTime = Date.now() - stepStartTime;
        results.push({
          stepId,
          toolName: step.tool,
          success: result.success,
          result,
          executionTime: stepExecutionTime,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `Step ${stepId} ${result.success ? 'succeeded' : 'failed'} in ${stepExecutionTime}ms`
        );

        // Check if we should stop on failure
        if (!result.success && !step.optional) {
          this.logger.warn(
            `Stopping plan execution due to failed required step: ${stepId}`
          );
          break;
        }
      }

      const completedSteps = results.filter((r) => r.success).length;
      const allSuccess = completedSteps === plan.steps.length;
      const executionTime = Date.now() - startTime;

      this.logger.log(
        `Plan execution completed: ${completedSteps}/${plan.steps.length} steps succeeded in ${executionTime}ms`
      );

      return {
        success: allSuccess,
        completedSteps,
        totalSteps: plan.steps.length,
        results,
        executionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Plan execution failed with error:', error);
      
      return {
        success: false,
        completedSteps: results.filter((r) => r.success).length,
        totalSteps: plan.steps.length,
        results,
        error: createToolError(
          ToolErrorCode.EXECUTION_ERROR,
          error.message || 'Plan execution failed',
          { originalError: error },
          false
        ),
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): ToolName[] {
    return this.handlerRegistry.getRegisteredToolNames();
  }

  /**
   * Check if a tool is available
   */
  isToolAvailable(toolName: ToolName): boolean {
    return this.handlerRegistry.hasHandler(toolName);
  }

  /**
   * Execute tool with timeout
   */
  private async executeWithTimeout<T>(
    handler: any,
    params: any,
    context: ExecutionContext
  ): Promise<ToolResult<T>> {
    const timeout = context.timeout || 30000; // Default 30s timeout

    const timeoutPromise = new Promise<ToolResult<T>>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeout}ms`));
      }, timeout);
    });

    const executionPromise = handler.execute(params, context);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Check if step dependencies are satisfied
   */
  private checkDependencies(
    step: PlanStep,
    results: Map<string, ToolResult>
  ): { satisfied: boolean; message?: string } {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return { satisfied: true };
    }

    for (const depId of step.dependsOn) {
      const depResult = results.get(depId);
      
      if (!depResult) {
        return {
          satisfied: false,
          message: `Dependency step "${depId}" has not been executed`,
        };
      }

      if (!depResult.success) {
        return {
          satisfied: false,
          message: `Dependency step "${depId}" failed`,
        };
      }
    }

    return { satisfied: true };
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
