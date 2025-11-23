import { Module } from '@nestjs/common';

import { IntentModule } from './intent/intent.module';
import { LLMModule } from './llm/llm.module';

@Module({
  imports: [LLMModule, IntentModule],
  exports: [LLMModule, IntentModule],
})
export class AgentModule {}
