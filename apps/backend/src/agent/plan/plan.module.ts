import { Module } from '@nestjs/common';

import { LLMModule } from '../llm/llm.module';

import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

@Module({
  imports: [LLMModule],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
