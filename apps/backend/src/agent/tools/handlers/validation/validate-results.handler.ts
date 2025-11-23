/**
 * Validate Results Handler
 * Implementation for validating step execution results
 */

import { Injectable } from '@nestjs/common';

import { ToolName, ValidateResultsParams } from '../../../types/tools.types';
import { ExecutionContext, ToolResult, createSuccessResult, createErrorResult } from '../../../types/tool-execution.types';
import { createToolError, ToolErrorCode } from '../../../types/tool-error.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface ValidationResult {
  valid: boolean;
  stepId?: string;
  checks: Array<{
    type: string;
    passed: boolean;
    message: string;
  }>;
}

@Injectable()
export class ValidateResultsHandler extends BaseToolHandler<ValidateResultsParams, ValidationResult> {
  constructor() {
    super(ToolName.VALIDATE_RESULTS);
  }

  protected async executeImpl(
    params: ValidateResultsParams,
    context: ExecutionContext
  ): Promise<ToolResult<ValidationResult>> {
    const startTime = Date.now();

    const checks: Array<{ type: string; passed: boolean; message: string }> = [];

    // Check if step to validate exists
    if (params.stepId && context.previousStepResults) {
      const stepResult = context.previousStepResults.get(params.stepId);
      
      if (!stepResult) {
        return createErrorResult(
          createToolError(
            ToolErrorCode.RESOURCE_NOT_FOUND,
            `Step ${params.stepId} not found in previous results`,
            { stepId: params.stepId },
            false
          ),
          this.name,
          Date.now() - startTime,
          context.stepId
        );
      }

      checks.push({
        type: 'step_exists',
        passed: true,
        message: `Step ${params.stepId} found`,
      });

      checks.push({
        type: 'step_success',
        passed: stepResult.success,
        message: stepResult.success
          ? `Step ${params.stepId} succeeded`
          : `Step ${params.stepId} failed`,
      });

      // Check minimum results if specified
      if (params.minResults !== undefined && stepResult.data) {
        const dataArray = Array.isArray(stepResult.data)
          ? stepResult.data
          : stepResult.data.flights || stepResult.data.jobs || [];
        
        const resultCount = Array.isArray(dataArray) ? dataArray.length : 0;
        const meetsMinimum = resultCount >= params.minResults;

        checks.push({
          type: 'min_results',
          passed: meetsMinimum,
          message: `Result count (${resultCount}) ${meetsMinimum ? 'meets' : 'does not meet'} minimum (${params.minResults})`,
        });
      }
    } else {
      // General validation without specific step
      checks.push({
        type: 'general',
        passed: true,
        message: 'General validation passed',
      });
    }

    const allPassed = checks.every((c) => c.passed);

    const validationResult: ValidationResult = {
      valid: allPassed,
      stepId: params.stepId,
      checks,
    };

    this.logger.log(
      `Validation ${allPassed ? 'passed' : 'failed'} - ${checks.length} checks`
    );

    return createSuccessResult(
      validationResult,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
