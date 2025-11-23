/**
 * Apply Job Handler
 * Mock implementation for job application
 */

import { Injectable } from '@nestjs/common';

import { ToolName, ApplyJobParams } from '../../../types/tools.types';
import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface ApplicationConfirmation {
  applicationId: string;
  jobUrl: string;
  status: string;
  appliedAt: string;
  confirmationMessage: string;
}

@Injectable()
export class ApplyJobHandler extends BaseToolHandler<ApplyJobParams, ApplicationConfirmation> {
  constructor() {
    super(ToolName.APPLY_JOB);
  }

  protected async executeImpl(
    params: ApplyJobParams,
    context: ExecutionContext
  ): Promise<ToolResult<ApplicationConfirmation>> {
    const startTime = Date.now();

    // Mock application confirmation
    const confirmation: ApplicationConfirmation = {
      applicationId: `APP${Date.now()}`,
      jobUrl: params.jobUrl,
      status: 'submitted',
      appliedAt: new Date().toISOString(),
      confirmationMessage: `Your application for ${params.jobTitle || 'the position'} at ${params.company || 'the company'} has been successfully submitted.`,
    };

    this.logger.log(
      `Applied to job: ${params.jobTitle || 'Unknown'} at ${params.company || 'Unknown'}`
    );

    return createSuccessResult(
      confirmation,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
