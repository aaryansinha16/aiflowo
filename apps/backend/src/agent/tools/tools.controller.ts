/**
 * Tools Controller
 * REST API endpoints for testing tool execution
 */

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';

import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ToolName } from '../types/tools.types';

import { ToolExecutorService } from './executor/tool-executor.service';
import { ToolHandlerRegistry } from './registry/tool-handler-registry';

/**
 * DTO for tool execution request
 */
class ExecuteToolDto {
  @IsEnum(ToolName)
  toolName: ToolName;

  @IsObject()
  params: any;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

/**
 * Controller for tool execution
 */
@Controller('agent/tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(
    private readonly toolExecutor: ToolExecutorService,
    private readonly handlerRegistry: ToolHandlerRegistry
  ) {}

  /**
   * Get list of available tools
   * GET /api/agent/tools
   */
  @Public()
  @Get()
  async getAvailableTools() {
    const tools = this.toolExecutor.getAvailableTools();
    const count = this.handlerRegistry.getHandlerCount();

    return {
      tools,
      count,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute a single tool (protected)
   * POST /api/agent/tools/execute
   */
  @Post('execute')
  async executeTool(@Body() dto: ExecuteToolDto) {
    const result = await this.toolExecutor.executeTool(
      dto.toolName,
      dto.params,
      {
        userId: dto.userId || 'test_user',
        taskId: dto.taskId,
        dryRun: dto.dryRun,
      }
    );

    return {
      toolName: dto.toolName,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Public endpoint for testing tool execution (no auth)
   * POST /api/agent/tools/execute-test
   */
  @Public()
  @Post('execute-test')
  async executeToolTest(@Body() dto: ExecuteToolDto) {
    return this.executeTool(dto);
  }
}
