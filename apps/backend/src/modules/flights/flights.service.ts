/**
 * Flights Service
 * Business logic for flight search and booking
 */

import { Injectable, Logger } from '@nestjs/common';

import { AmadeusService } from './amadeus.service';
import {
  FlightOffer,
  SearchFlightsRequest,
  SearchFlightsResponse,
  AmadeusFlightOffersResponse,
} from './dto/flight.dto';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);

  constructor(private readonly amadeusService: AmadeusService) {}

  /**
   * Search for flights
   */
  async searchFlights(request: SearchFlightsRequest): Promise<SearchFlightsResponse> {
    const {
      from,
      to,
      date,
      returnDate,
      passengers = 1,
      class: travelClass = 'economy',
      budget,
    } = request;

    this.logger.log(
      `Searching flights: ${from} -> ${to} on ${date} for ${passengers} passengers`
    );

    // Check if Amadeus is configured
    if (!this.amadeusService.isConfigured()) {
      this.logger.warn('Amadeus API not configured, returning mock data');
      return this.getMockFlights(request);
    }

    try {
      // Call Amadeus API
      const amadeusResponse = await this.amadeusService.searchFlights({
        originLocationCode: from.toUpperCase(),
        destinationLocationCode: to.toUpperCase(),
        departureDate: date,
        returnDate,
        adults: passengers,
        travelClass: this.mapTravelClass(travelClass),
        max: 100, // Get more results to filter by budget
      });

      // Transform Amadeus response to our format
      let flights = this.transformAmadeusResponse(amadeusResponse);

      // Filter by budget if provided
      if (budget) {
        flights = flights.filter((f) => f.price <= budget);
      }

      // Sort by price
      flights.sort((a, b) => a.price - b.price);

      // Limit to top 50 results
      flights = flights.slice(0, 50);

      this.logger.log(`Returning ${flights.length} flight offers`);

      return {
        flights,
        totalResults: flights.length,
        searchParams: request,
      };
    } catch (error) {
      this.logger.error('Error searching flights, falling back to mock data', error);
      // Fallback to mock data on error
      return this.getMockFlights(request);
    }
  }

  /**
   * Transform Amadeus API response to our FlightOffer format
   */
  private transformAmadeusResponse(response: AmadeusFlightOffersResponse): FlightOffer[] {
    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((offer) => {
      const firstItinerary = offer.itineraries[0];
      const firstSegment = firstItinerary.segments[0];
      const lastSegment = firstItinerary.segments[firstItinerary.segments.length - 1];

      const carrierCode = firstSegment.carrierCode;
      const airlineName = this.amadeusService.getAirlineName(
        carrierCode,
        response.dictionaries?.carriers
      );

      // Calculate total stops
      const stops = firstItinerary.segments.length - 1;

      // Get cabin class from first traveler pricing
      const cabin = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';

      return {
        id: offer.id,
        airline: airlineName,
        flightNumber: `${carrierCode} ${firstSegment.number}`,
        from: firstSegment.departure.iataCode,
        to: lastSegment.arrival.iataCode,
        departure: firstSegment.departure.at,
        arrival: lastSegment.arrival.at,
        duration: firstItinerary.duration,
        price: parseFloat(offer.price.grandTotal),
        currency: offer.price.currency,
        class: cabin.toLowerCase(),
        stops,
        available: offer.numberOfBookableSeats > 0,
        segments: firstItinerary.segments.map((seg) => ({
          departure: {
            iataCode: seg.departure.iataCode,
            at: seg.departure.at,
            terminal: seg.departure.terminal,
          },
          arrival: {
            iataCode: seg.arrival.iataCode,
            at: seg.arrival.at,
            terminal: seg.arrival.terminal,
          },
          carrierCode: seg.carrierCode,
          number: seg.number,
          aircraft: {
            code: seg.aircraft.code,
          },
          duration: seg.duration,
        })),
      };
    });
  }

  /**
   * Map our travel class to Amadeus format
   */
  private mapTravelClass(travelClass: string): string {
    const classMap: Record<string, string> = {
      economy: 'ECONOMY',
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    };

    return classMap[travelClass.toLowerCase()] || 'ECONOMY';
  }

  /**
   * Get mock flight data (fallback when API is not configured)
   */
  private getMockFlights(request: SearchFlightsRequest): SearchFlightsResponse {
    this.logger.log('Generating mock flight data');

    const { from, to, date, class: travelClass = 'economy', budget } = request;

    const basePrices: Record<string, number> = {
      economy: 3500,
      premium_economy: 6000,
      business: 15000,
      first: 25000,
    };

    const basePrice = basePrices[travelClass] || 3500;

    const flights: FlightOffer[] = [
      {
        id: `mock_flight_${Date.now()}_1`,
        airline: 'Air India',
        flightNumber: 'AI 123',
        from,
        to,
        departure: `${date}T06:00:00Z`,
        arrival: `${date}T08:30:00Z`,
        duration: 'PT2H30M',
        price: basePrice,
        currency: 'INR',
        class: travelClass,
        stops: 0,
        available: true,
      },
      {
        id: `mock_flight_${Date.now()}_2`,
        airline: 'IndiGo',
        flightNumber: '6E 456',
        from,
        to,
        departure: `${date}T10:15:00Z`,
        arrival: `${date}T12:45:00Z`,
        duration: 'PT2H30M',
        price: basePrice - 700,
        currency: 'INR',
        class: travelClass,
        stops: 0,
        available: true,
      },
      {
        id: `mock_flight_${Date.now()}_3`,
        airline: 'SpiceJet',
        flightNumber: 'SG 789',
        from,
        to,
        departure: `${date}T14:30:00Z`,
        arrival: `${date}T17:00:00Z`,
        duration: 'PT2H30M',
        price: basePrice - 1000,
        currency: 'INR',
        class: travelClass,
        stops: 0,
        available: true,
      },
      {
        id: `mock_flight_${Date.now()}_4`,
        airline: 'Vistara',
        flightNumber: 'UK 321',
        from,
        to,
        departure: `${date}T18:45:00Z`,
        arrival: `${date}T21:15:00Z`,
        duration: 'PT2H30M',
        price: basePrice + 500,
        currency: 'INR',
        class: travelClass,
        stops: 0,
        available: true,
      },
    ];

    // Filter by budget
    const filtered = budget ? flights.filter((f) => f.price <= budget) : flights;

    return {
      flights: filtered,
      totalResults: filtered.length,
      searchParams: request,
    };
  }
}
