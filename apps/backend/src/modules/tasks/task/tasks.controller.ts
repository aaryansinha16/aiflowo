/**
 * Tasks Controller
 * REST API endpoints for task management (nested under chats)
 */

import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

import { JwtService } from '@nestjs/jwt';

import { Public } from '../../../auth/decorators/public.decorator';
import { CreateTaskDto, TaskResponseDto } from './dto';
import { TaskUpdatesService } from './sse/task-updates.service';
import { TasksService } from './tasks.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskUpdatesService: TaskUpdatesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create task in a chat
   * POST /api/chats/:chatId/tasks
   */
  @Post('chats/:chatId/tasks')
  async createTask(
    @Param('chatId') chatId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(chatId, user.id, dto);
  }

  /**
   * List all tasks in a chat
   * GET /api/chats/:chatId/tasks
   */
  @Get('chats/:chatId/tasks')
  async listTasksInChat(
    @Param('chatId') chatId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.listTasksInChat(chatId, user.id);
  }

  /**
   * Get specific task details
   * GET /api/tasks/:id
   */
  @Get('tasks/:id')
  async getTask(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTask(taskId, user.id);
  }

  /**
   * Start task execution
   * POST /api/tasks/:id/start
   */
  @Post('tasks/:id/start')
  async startTask(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto> {
    // Verify ownership
    await this.tasksService.getTask(taskId, user.id);
    return this.tasksService.startTask(taskId);
  }

  /**
   * Pause task execution
   * POST /api/tasks/:id/pause
   */
  @Post('tasks/:id/pause')
  async pauseTask(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto> {
    // Verify ownership
    await this.tasksService.getTask(taskId, user.id);
    return this.tasksService.pauseTask(taskId);
  }

  /**
   * Resume task execution
   * POST /api/tasks/:id/resume
   */
  @Post('tasks/:id/resume')
  async resumeTask(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto> {
    // Verify ownership
    await this.tasksService.getTask(taskId, user.id);
    return this.tasksService.resumeTask(taskId);
  }

  /**
   * Cancel task execution
   * POST /api/tasks/:id/cancel
   */
  @Post('tasks/:id/cancel')
  async cancelTask(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<TaskResponseDto> {
    // Verify ownership
    await this.tasksService.getTask(taskId, user.id);
    return this.tasksService.cancelTask(taskId);
  }

  /**
   * Get task logs
   * GET /api/tasks/:id/logs
   */
  @Get('tasks/:id/logs')
  async getTaskLogs(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ) {
    // TODO: Implement task logs retrieval
    return [];
  }

  /**
   * Stream real-time task updates via SSE
   * GET /api/tasks/:id/stream?token=xxx
   * Note: SSE doesn't support custom headers, so token is passed as query param
   */
  @Public() // Bypass JWT guard - we validate token manually from query param
  @Sse('tasks/:id/stream')
  async streamTaskUpdates(
    @Param('id') taskId: string,
    @Query('token') token: string,
  ): Promise<Observable<MessageEvent>> {
    // Verify token and task ownership
    // Since SSE doesn't support custom headers, we accept token as query param
    if (!token) {
      throw new UnauthorizedException('Token required for SSE stream');
    }

    // Verify task exists and user has access
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);
      
      // Verify task ownership
      await this.tasksService.getTask(taskId, payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Invalid token or unauthorized access');
    }

    // Return the task update stream
    return this.taskUpdatesService.getTaskStream(taskId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  /**
   * Get task artifacts (screenshots, files)
   * GET /api/tasks/:id/artifacts
   */
  @Get('tasks/:id/artifacts')
  async getTaskArtifacts(
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ): Promise<any[]> {
    // Verify ownership
    await this.tasksService.getTask(taskId, user.id);
    return this.tasksService.getArtifacts(taskId);
  }
}
