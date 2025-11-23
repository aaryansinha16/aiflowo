/**
 * Calculate Tool Handler
 * Simple calculator for testing task execution
 */

import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ToolErrorCode, createToolError } from '../../../types/tool-error.types';
import type { ExecutionContext, ToolResult } from '../../../types/tool-execution.types';
import { ToolName } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

// Parameter schema
const _CalculateParamsSchema = z.object({
  expression: z.string().min(1).describe('Mathematical expression to evaluate (e.g., "2 + 2" or "10 * 5")'),
});

type CalculateParams = z.infer<typeof _CalculateParamsSchema>;

@Injectable()
export class CalculateHandler extends BaseToolHandler<CalculateParams> {
  constructor() {
    super(ToolName.CALCULATE);
  }

  readonly description = 'Perform mathematical calculations';
  readonly category = 'utility';

  // Not needed - base class handles tool definition

  protected async executeImpl(params: CalculateParams, _context: ExecutionContext): Promise<ToolResult> {
    this.logger.log(`Calculating: ${params.expression}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Basic safe evaluation (in production, use a proper math parser)
      const result = this.evaluateExpression(params.expression);

      this.logger.log(`Calculation result: ${result}`);

      return {
        success: true,
        data: {
          expression: params.expression,
          result,
          formatted: `${params.expression} = ${result}`,
        },
        message: `${params.expression} = ${result}`, // User-facing message for display
        error: null,
      };
    } catch (_error: any) {
      return {
        success: false,
        data: null,
        error: createToolError(
          ToolErrorCode.INVALID_PARAMS,
          `Failed to calculate: ${_error.message}`
        ),
      };
    }
  }

  /**
   * Safe evaluation of mathematical expressions
   * Only allows numbers and basic operators
   */
  private evaluateExpression(expression: string): number {
    // Remove whitespace
    const cleaned = expression.replace(/\s/g, '');

    // Validate only contains numbers and basic operators
    if (!/^[\d+\-*/.()]+$/.test(cleaned)) {
      throw new Error('Invalid characters in expression');
    }

    // Evaluate using Function constructor (safer than eval)
    // In production, use a proper math parser library
    try {
      const result = new Function(`return ${cleaned}`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid result');
      }

      return result;
    } catch {
      throw new Error('Failed to evaluate expression');
    }
  }

  protected validateResult(result: any): boolean {
    return (
      result &&
      typeof result.expression === 'string' &&
      typeof result.result === 'number' &&
      isFinite(result.result)
    );
  }
}
