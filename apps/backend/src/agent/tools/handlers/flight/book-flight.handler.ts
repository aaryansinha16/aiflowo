/**
 * Book Flight Handler
 * Mock implementation for flight booking
 */

import { Injectable } from '@nestjs/common';

import { ToolName, BookFlightParams } from '../../../types/tools.types';
import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface BookingConfirmation {
  bookingId: string;
  pnr: string;
  status: string;
  flightOptionId: string;
  passengers: any[];
  bookedAt: string;
}

@Injectable()
export class BookFlightHandler extends BaseToolHandler<BookFlightParams, BookingConfirmation> {
  constructor() {
    super(ToolName.BOOK_FLIGHT);
  }

  protected async executeImpl(
    params: BookFlightParams,
    context: ExecutionContext
  ): Promise<ToolResult<BookingConfirmation>> {
    const startTime = Date.now();

    // Mock booking confirmation
    const confirmation: BookingConfirmation = {
      bookingId: `BK${Date.now()}`,
      pnr: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'confirmed',
      flightOptionId: params.flightOptionId,
      passengers: params.passengers,
      bookedAt: new Date().toISOString(),
    };

    this.logger.log(
      `Booked flight ${params.flightOptionId} for ${params.passengers.length} passengers - PNR: ${confirmation.pnr}`
    );

    return createSuccessResult(
      confirmation,
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
