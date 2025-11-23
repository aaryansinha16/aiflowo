/**
 * Search Flights Handler
 * Mock implementation for flight search
 */

import { Injectable } from '@nestjs/common';

import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, SearchFlightsParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  class: string;
  stops: number;
  available: boolean;
}

@Injectable()
export class SearchFlightsHandler extends BaseToolHandler<SearchFlightsParams, { flights: FlightOption[] }> {
  constructor() {
    super(ToolName.SEARCH_FLIGHTS);
  }

  protected async executeImpl(
    params: SearchFlightsParams,
    context: ExecutionContext
  ): Promise<ToolResult<{ flights: FlightOption[] }>> {
    const startTime = Date.now();

    // Mock flight search - return sample data
    const flights: FlightOption[] = [
      {
        id: `flight_${Date.now()}_1`,
        airline: 'Air India',
        flightNumber: 'AI 123',
        from: params.from,
        to: params.to,
        departure: `${params.date}T06:00:00Z`,
        arrival: `${params.date}T08:30:00Z`,
        duration: '2h 30m',
        price: 4500,
        currency: 'INR',
        class: params.class || 'economy',
        stops: 0,
        available: true,
      },
      {
        id: `flight_${Date.now()}_2`,
        airline: 'IndiGo',
        flightNumber: '6E 456',
        from: params.from,
        to: params.to,
        departure: `${params.date}T10:15:00Z`,
        arrival: `${params.date}T12:45:00Z`,
        duration: '2h 30m',
        price: 3800,
        currency: 'INR',
        class: params.class || 'economy',
        stops: 0,
        available: true,
      },
      {
        id: `flight_${Date.now()}_3`,
        airline: 'SpiceJet',
        flightNumber: 'SG 789',
        from: params.from,
        to: params.to,
        departure: `${params.date}T14:30:00Z`,
        arrival: `${params.date}T17:00:00Z`,
        duration: '2h 30m',
        price: 3500,
        currency: 'INR',
        class: params.class || 'economy',
        stops: 0,
        available: true,
      },
    ];

    // Filter by budget if provided
    const filtered = params.budget
      ? flights.filter((f) => f.price <= params.budget!)
      : flights;

    this.logger.log(
      `Found ${filtered.length} flights from ${params.from} to ${params.to} on ${params.date}`
    );

    return createSuccessResult(
      { flights: filtered },
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
