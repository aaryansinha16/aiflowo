import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { ClassifyIntentDto } from './dto/classify-intent.dto';
import { IntentResponseDto } from './dto/intent-response.dto';
import { IntentService } from './intent.service';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  /**
   * Classify user intent from natural language
   * POST /api/agent/classify
   */
  @Post('classify')
  async classifyIntent(@Body() dto: ClassifyIntentDto): Promise<IntentResponseDto> {
    const result = await this.intentService.classifyIntent(dto.message);

    const description = this.intentService.getIntentDescription(result);

    return {
      ...result,
      description,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Public endpoint for testing (remove in production)
   * POST /api/agent/classify-test
   */
  @Public()
  @Post('classify-test')
  async classifyIntentTest(@Body() dto: ClassifyIntentDto): Promise<IntentResponseDto> {
    return this.classifyIntent(dto);
  }
}
