import { Module } from '@nestjs/common';

import { IntentModule } from './intent/intent.module';
import { LLMModule } from './llm/llm.module';
import { PlanModule } from './plan/plan.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [LLMModule, IntentModule, PlanModule, ToolsModule],
  exports: [LLMModule, IntentModule, PlanModule, ToolsModule],
})
export class AgentModule {}
