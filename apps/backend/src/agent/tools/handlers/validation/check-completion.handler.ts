/**
 * Check Completion Handler
 * Implementation for checking task completion status
 */

import { Injectable } from '@nestjs/common';

import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, CheckCompletionParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface CompletionCheckResult {
  completed: boolean;
  expectedOutcome: string;
  actualOutcome: string;
  screenshotUrl?: string;
  timestamp: string;
}

@Injectable()
export class CheckCompletionHandler extends BaseToolHandler<CheckCompletionParams, CompletionCheckResult> {
  constructor() {
    super(ToolName.CHECK_COMPLETION);
  }

  protected async executeImpl(
    params: CheckCompletionParams,
    context: ExecutionContext
  ): Promise<ToolResult<CompletionCheckResult>> {
    const startTime = Date.now();

    // Mock completion check
    const result: CompletionCheckResult = {
      completed: true,
      expectedOutcome: params.expectedOutcome,
      actualOutcome: `Mock verification: ${params.expectedOutcome} completed successfully`,
      screenshotUrl: params.screenshot
        ? `https://s3.example.com/screenshots/completion_${Date.now()}.png`
        : undefined,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Completion check ${result.completed ? 'passed' : 'failed'}: ${params.expectedOutcome}`
    );

    return createSuccessResult(
      result,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
