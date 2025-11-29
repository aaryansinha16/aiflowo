/**
 * Lightweight Response Module
 * Handles conversational intents without full task execution
 */

import { Module } from '@nestjs/common';

import { LLMModule } from '../llm/llm.module';

import { LightweightResponseService } from './lightweight-response.service';

@Module({
  imports: [LLMModule],
  providers: [LightweightResponseService],
  exports: [LightweightResponseService],
})
export class LightweightModule {}
