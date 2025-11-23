import { Module } from '@nestjs/common';

import { IntentModule } from './intent/intent.module';
import { LLMModule } from './llm/llm.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [LLMModule, IntentModule, PlanModule],
  exports: [LLMModule, IntentModule, PlanModule],
})
export class AgentModule {}
