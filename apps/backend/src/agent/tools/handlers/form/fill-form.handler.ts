/**
 * Fill Form Handler
 * Mock implementation for form filling
 */

import { Injectable } from '@nestjs/common';

import { ToolName, FillFormParams } from '../../../types/tools.types';
import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface FormSubmissionResult {
  success: boolean;
  url: string;
  fieldsFilled: string[];
  filesUploaded: string[];
  submittedAt: string;
  confirmationMessage?: string;
}

@Injectable()
export class FillFormHandler extends BaseToolHandler<FillFormParams, FormSubmissionResult> {
  constructor() {
    super(ToolName.FILL_FORM);
  }

  protected async executeImpl(
    params: FillFormParams,
    context: ExecutionContext
  ): Promise<ToolResult<FormSubmissionResult>> {
    const startTime = Date.now();

    // Mock form filling
    const result: FormSubmissionResult = {
      success: true,
      url: params.url,
      fieldsFilled: params.fields ? Object.keys(params.fields) : [],
      filesUploaded: params.files ? Object.keys(params.files) : [],
      submittedAt: new Date().toISOString(),
      confirmationMessage: params.submitForm
        ? 'Form submitted successfully'
        : 'Form filled but not submitted',
    };

    this.logger.log(
      `Filled form at ${params.url} - ${result.fieldsFilled.length} fields, ${result.filesUploaded.length} files`
    );

    return createSuccessResult(
      result,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
