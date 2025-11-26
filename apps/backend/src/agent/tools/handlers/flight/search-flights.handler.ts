/**
 * Search Flights Handler
 * Integration with Amadeus API for flight search
 */

import { Injectable } from '@nestjs/common';

import { FlightsService } from '../../../../modules/flights/flights.service';
import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, SearchFlightsParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

@Injectable()
export class SearchFlightsHandler extends BaseToolHandler<SearchFlightsParams, { flights: any[] }> {
  constructor(private readonly flightsService: FlightsService) {
    super(ToolName.SEARCH_FLIGHTS);
  }

  protected async executeImpl(
    params: SearchFlightsParams,
    context: ExecutionContext
  ): Promise<ToolResult<{ flights: any[] }>> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Searching flights: ${params.from} -> ${params.to} on ${params.date}`
      );

      // Call flights service
      const result = await this.flightsService.searchFlights({
        from: params.from,
        to: params.to,
        date: params.date,
        returnDate: params.returnDate,
        passengers: params.passengers || 1,
        class: params.class || 'economy',
        budget: params.budget,
      });

      this.logger.log(`Found ${result.flights.length} flights`);

      return createSuccessResult(
        { flights: result.flights },
        this.name,
        Date.now() - startTime,
        context.stepId
      );
    } catch (error) {
      this.logger.error('Flight search failed', error);
      throw error;
    }
  }
}
