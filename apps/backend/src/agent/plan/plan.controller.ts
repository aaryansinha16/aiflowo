import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IntentClassification } from '../types/intent.types';

import { GeneratePlanDto } from './dto/generate-plan.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { PlanService } from './plan.service';

@Controller('agent/plan')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  /**
   * Generate execution plan from classified intent
   * POST /api/agent/plan/generate
   */
  @Post('generate')
  async generatePlan(@Body() dto: GeneratePlanDto): Promise<PlanResponseDto> {
    const classification: IntentClassification = {
      intent: dto.intent,
      params: dto.params,
      confidence: 1,
    };

    const plan = await this.planService.generatePlan(classification, {
      userId: dto.userId || 'test_user',
      userProfile: dto.userProfile,
    });

    const validation = this.planService.validatePlan(plan);
    const description = this.planService.getPlanDescription(plan);

    return {
      intent: plan.intent,
      steps: plan.steps,
      metadata: plan.metadata,
      description,
      validationResult: {
        valid: validation.valid,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Public endpoint for testing (remove in production)
   * POST /api/agent/plan/generate-test
   */
  @Public()
  @Post('generate-test')
  async generatePlanTest(@Body() dto: GeneratePlanDto): Promise<PlanResponseDto> {
    return this.generatePlan(dto);
  }
}
