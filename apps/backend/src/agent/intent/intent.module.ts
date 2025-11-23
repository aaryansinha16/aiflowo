import { Module } from '@nestjs/common';

import { LLMModule } from '../llm/llm.module';

import { IntentController } from './intent.controller';
import { IntentService } from './intent.service';

@Module({
  imports: [LLMModule],
  controllers: [IntentController],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule {}
