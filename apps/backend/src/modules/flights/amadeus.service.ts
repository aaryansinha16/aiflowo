/**
 * Amadeus API Client Service
 * Handles authentication and API calls to Amadeus Travel APIs
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { AmadeusTokenResponse, AmadeusFlightOffersResponse } from './dto/flight.dto';

@Injectable()
export class AmadeusService {
  private readonly logger = new Logger(AmadeusService.name);
  private readonly baseURL = 'https://test.api.amadeus.com';
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AMADEUS_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('AMADEUS_API_SECRET') || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });
  }

  /**
   * Get access token (with caching)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.apiKey || !this.apiSecret) {
      throw new HttpException(
        'Amadeus API credentials not configured',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      this.logger.log('Fetching new Amadeus access token');

      // eslint-disable-next-line no-undef
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      });

      const response = await axios.post<AmadeusTokenResponse>(
        `${this.baseURL}/v1/security/oauth2/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      this.logger.log('Successfully obtained Amadeus access token');
      return this.accessToken!;
    } catch (error) {
      this.logger.error('Failed to get Amadeus access token', error);
      throw new HttpException(
        'Failed to authenticate with Amadeus API',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Search for flight offers
   */
  async searchFlights(params: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    travelClass?: string;
    max?: number;
  }): Promise<AmadeusFlightOffersResponse> {
    const token = await this.getAccessToken();

    try {
      this.logger.log(
        `Searching flights: ${params.originLocationCode} -> ${params.destinationLocationCode} on ${params.departureDate}`
      );

      const queryParams: Record<string, string | number> = {
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: params.adults,
        max: params.max || 50, // Default to 50 results
        currencyCode: 'INR',
      };

      if (params.returnDate) {
        queryParams.returnDate = params.returnDate;
      }

      if (params.travelClass) {
        queryParams.travelClass = params.travelClass.toUpperCase();
      }

      const response = await this.client.get<AmadeusFlightOffersResponse>(
        '/v2/shopping/flight-offers',
        {
          params: queryParams,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      this.logger.log(`Found ${response.data.meta?.count || 0} flight offers`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to search flights', {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        // Token expired, clear it and retry once
        this.accessToken = null;
        this.tokenExpiry = null;
        throw new HttpException(
          'Authentication failed. Please try again.',
          HttpStatus.UNAUTHORIZED
        );
      }

      throw new HttpException(
        error.response?.data?.errors?.[0]?.detail || 'Failed to search flights',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get airline name from code
   */
  getAirlineName(code: string, dictionaries?: Record<string, string>): string {
    if (dictionaries && dictionaries[code]) {
      return dictionaries[code];
    }

    // Fallback airline names
    const airlineNames: Record<string, string> = {
      AI: 'Air India',
      '6E': 'IndiGo',
      SG: 'SpiceJet',
      UK: 'Vistara',
      G8: 'Go First',
      I5: 'Air Asia India',
      QP: 'Akasa Air',
    };

    return airlineNames[code] || code;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiSecret);
  }
}
