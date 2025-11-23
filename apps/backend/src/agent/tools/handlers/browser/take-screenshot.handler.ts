/**
 * Take Screenshot Handler
 * Mock implementation for taking screenshots
 */

import { Injectable } from '@nestjs/common';

import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, TakeScreenshotParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface ScreenshotResult {
  url: string;
  path: string;
  timestamp: string;
  fullPage: boolean;
  size: {
    width: number;
    height: number;
  };
}

@Injectable()
export class TakeScreenshotHandler extends BaseToolHandler<TakeScreenshotParams, ScreenshotResult> {
  constructor() {
    super(ToolName.TAKE_SCREENSHOT);
  }

  protected async executeImpl(
    params: TakeScreenshotParams,
    context: ExecutionContext
  ): Promise<ToolResult<ScreenshotResult>> {
    const startTime = Date.now();

    // Mock screenshot
    const result: ScreenshotResult = {
      url: `https://s3.example.com/screenshots/${Date.now()}.png`,
      path: `/tmp/screenshots/${Date.now()}.png`,
      timestamp: new Date().toISOString(),
      fullPage: params.fullPage || false,
      size: {
        width: params.fullPage ? 1920 : 1280,
        height: params.fullPage ? 4000 : 720,
      },
    };

    this.logger.log(
      `Screenshot captured - ${params.fullPage ? 'Full page' : 'Viewport'}${params.selector ? ` (selector: ${params.selector})` : ''}`
    );

    return createSuccessResult(
      result,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
