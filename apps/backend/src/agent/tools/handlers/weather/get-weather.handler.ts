/**
 * Get Weather Tool Handler
 * Simple test tool to verify end-to-end execution
 */

import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import type { ExecutionContext, ToolResult } from '../../../types/tool-execution.types';
import { ToolName } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

// Parameter schema
const _GetWeatherParamsSchema = z.object({
  location: z.string().min(1).describe('City name or location (e.g., "New York" or "London, UK")'),
  units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius').describe('Temperature units'),
});

type GetWeatherParams = z.infer<typeof _GetWeatherParamsSchema>;

@Injectable()
export class GetWeatherHandler extends BaseToolHandler<GetWeatherParams> {
  constructor() {
    super(ToolName.GET_WEATHER);
  }

  readonly description = 'Get current weather information for a location';
  readonly category = 'utility';

  // Not needed - base class handles tool definition

  protected async executeImpl(params: GetWeatherParams, _context: ExecutionContext): Promise<ToolResult> {
    this.logger.log(`Getting weather for ${params.location} in ${params.units}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock weather data (in production, call actual weather API)
    const mockWeatherData = this.generateMockWeather(params.location, params.units);

    this.logger.log(`Weather retrieved successfully for ${params.location}`);

    // Create user-friendly message
    const message = `The weather in ${params.location} is currently ${mockWeatherData.condition} with a temperature of ${mockWeatherData.temperature}${mockWeatherData.units}. Humidity is at ${mockWeatherData.humidity}% with wind speeds of ${mockWeatherData.windSpeed} km/h.`;

    return {
      success: true,
      data: mockWeatherData,
      message, // User-facing message for display
      error: null,
    };
  }

  /**
   * Generate mock weather data for testing
   */
  private generateMockWeather(location: string, units: string) {
    const isCelsius = units === 'celsius';
    const baseTemp = isCelsius ? 20 : 68;
    const variation = Math.floor(Math.random() * 10) - 5;
    const temp = baseTemp + variation;

    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      location,
      temperature: temp,
      units: isCelsius ? '°C' : '°F',
      condition,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h or mph
      description: `Current weather in ${location}: ${condition}, ${temp}${isCelsius ? '°C' : '°F'}`,
    };
  }

  protected validateResult(result: any): boolean {
    return (
      result &&
      typeof result.location === 'string' &&
      typeof result.temperature === 'number' &&
      typeof result.condition === 'string'
    );
  }
}
