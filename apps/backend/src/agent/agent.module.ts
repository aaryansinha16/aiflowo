import { Module } from '@nestjs/common';

import { IntentModule } from './intent/intent.module';
import { LightweightModule } from './lightweight/lightweight.module';
import { LLMModule } from './llm/llm.module';
import { PlanModule } from './plan/plan.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [LLMModule, IntentModule, PlanModule, ToolsModule, LightweightModule],
  exports: [LLMModule, IntentModule, PlanModule, ToolsModule, LightweightModule],
})
export class AgentModule {}
