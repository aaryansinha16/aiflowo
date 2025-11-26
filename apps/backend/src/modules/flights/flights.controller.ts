/**
 * Flights Controller
 * REST endpoints for flight search
 */

import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { SearchFlightsRequest, SearchFlightsResponse } from './dto/flight.dto';
import { FlightsService } from './flights.service';

@Controller('flights')
@UseGuards(JwtAuthGuard)
export class FlightsController {
  private readonly logger = new Logger(FlightsController.name);

  constructor(private readonly flightsService: FlightsService) {}

  /**
   * Search for flights
   * POST /api/flights/search
   */
  @Post('search')
  async searchFlights(@Body() request: SearchFlightsRequest): Promise<SearchFlightsResponse> {
    this.logger.log(`Flight search request: ${request.from} -> ${request.to} on ${request.date}`);

    try {
      const result = await this.flightsService.searchFlights(request);
      return result;
    } catch (error) {
      this.logger.error('Flight search failed', error);
      throw error;
    }
  }
}
