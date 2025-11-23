/**
 * Navigate To Handler
 * Mock implementation for browser navigation
 */

import { Injectable } from '@nestjs/common';

import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, NavigateToParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface NavigationResult {
  url: string;
  title: string;
  status: number;
  loadTime: number;
}

@Injectable()
export class NavigateToHandler extends BaseToolHandler<NavigateToParams, NavigationResult> {
  constructor() {
    super(ToolName.NAVIGATE_TO);
  }

  protected async executeImpl(
    params: NavigateToParams,
    context: ExecutionContext
  ): Promise<ToolResult<NavigationResult>> {
    const startTime = Date.now();

    // Mock navigation
    const result: NavigationResult = {
      url: params.url,
      title: `Page: ${params.url}`,
      status: 200,
      loadTime: Math.floor(Math.random() * 1000 + 500),
    };

    this.logger.log(`Navigated to ${params.url} - Status: ${result.status}`);

    return createSuccessResult(
      result,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
