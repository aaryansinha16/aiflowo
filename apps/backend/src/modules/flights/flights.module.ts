/**
 * Flights Module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AmadeusService } from './amadeus.service';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  imports: [ConfigModule],
  controllers: [FlightsController],
  providers: [AmadeusService, FlightsService],
  exports: [FlightsService],
})
export class FlightsModule {}
