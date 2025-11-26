/**
 * Flight DTOs
 */

export interface FlightSegment {
  departure: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  arrival: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  duration: string;
}

export interface FlightOffer {
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
  segments?: FlightSegment[];
}

export interface SearchFlightsRequest {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers?: number;
  class?: 'economy' | 'premium_economy' | 'business' | 'first';
  budget?: number;
}

export interface SearchFlightsResponse {
  flights: FlightOffer[];
  totalResults: number;
  searchParams: SearchFlightsRequest;
}

export interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface AmadeusFlightOffersResponse {
  data: Array<{
    id: string;
    type: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: Array<{
      duration: string;
      segments: Array<{
        departure: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        arrival: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        carrierCode: string;
        number: string;
        aircraft: {
          code: string;
        };
        operating?: {
          carrierCode: string;
        };
        duration: string;
        id: string;
        numberOfStops: number;
        blacklistedInEU: boolean;
      }>;
    }>;
    price: {
      currency: string;
      total: string;
      base: string;
      fees: Array<{
        amount: string;
        type: string;
      }>;
      grandTotal: string;
    };
    pricingOptions: {
      fareType: string[];
      includedCheckedBagsOnly: boolean;
    };
    validatingAirlineCodes: string[];
    travelerPricings: Array<{
      travelerId: string;
      fareOption: string;
      travelerType: string;
      price: {
        currency: string;
        total: string;
        base: string;
      };
      fareDetailsBySegment: Array<{
        segmentId: string;
        cabin: string;
        fareBasis: string;
        class: string;
        includedCheckedBags: {
          weight?: number;
          weightUnit?: string;
        };
      }>;
    }>;
  }>;
  meta: {
    count: number;
  };
  dictionaries: {
    carriers: Record<string, string>;
    aircraft: Record<string, string>;
  };
}
