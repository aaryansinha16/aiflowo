/**
 * Tasks Service
 * Business logic for task management and execution orchestration
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task, TaskLog, TaskStatus } from '@prisma/client';

import { IntentService } from '../../../agent/intent/intent.service';
import { LightweightResponseService } from '../../../agent/lightweight/lightweight-response.service';
import { LLMService } from '../../../agent/llm/llm.service';
import { PlanService } from '../../../agent/plan/plan.service';
import { ToolExecutorService } from '../../../agent/tools/executor/tool-executor.service';
import { isLightweightIntent } from '../../../agent/types/intent.types';
import { ExecutionContext } from '../../../agent/types/tool-execution.types';
import { PrismaService } from '../../../libs/prisma';
import { QueueService } from '../../../libs/queue';
import { QueueName, TaskJobType } from '../../../libs/queue/queue.constants';
import { ChatsService } from '../chat/chats.service';
import { ChatContext } from '../types/chat.types';
import { TaskStateValidator } from '../validators/task-state.validator';

import { CreateTaskDto, TaskResponseDto } from './dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly chatsService: ChatsService,
    private readonly intentService: IntentService,
    private readonly planService: PlanService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly llmService: LLMService,
    private readonly lightweightService: LightweightResponseService,
    private readonly stateValidator: TaskStateValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new task within a chat
   */
  async createTask(
    chatId: string,
    userId: string,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    this.logger.log(`Creating task in chat ${chatId} for user ${userId}`);

    // Verify chat exists and belongs to user
    await this.chatsService.getChat(chatId, userId);

    // Get chat context (previous tasks) for context-aware responses
    const chatContext = await this.chatsService.getChatContext(chatId);

    // Build intent context from previous tasks
    const intentContext = {
      previousTasks: chatContext.previousTasks.map(t => ({
        intent: t.intent,
        status: t.status,
        result: t.result,
      })),
      summary: chatContext.summary,
    };

    // Classify intent with conversation context
    this.logger.log(`Classifying intent: "${dto.intent}"`);
    const classification = await this.intentService.classifyIntent(dto.intent, intentContext);

    // Check if this is a lightweight intent (greeting, help, etc.)
    if (isLightweightIntent(classification.intent)) {
      this.logger.log(`Lightweight intent detected: ${classification.intent}`);
      return this.handleLightweightResponse(chatId, userId, dto.intent, classification, chatContext);
    }

    // Generate execution plan with context
    this.logger.log(`Generating plan for intent type: ${classification.intent}`);
    const plan = await this.planService.generatePlan(classification, {
      userId,
      userProfile: {}, // TODO: Load user profile
      chatContext, // Pass context for context-aware planning
    });

    // Validate plan
    const validation = this.planService.validatePlan(plan);
    if (!validation.valid) {
      this.logger.error('Plan validation failed:', JSON.stringify(validation, null, 2));
      throw new BadRequestException(
        `Invalid plan generated: ${JSON.stringify(validation.errors)}`,
      );
    }

    // Generate title from intent
    const title = await this.generateTaskTitle(dto.intent);

    // Create task
    const task = await this.prisma.task.create({
      data: {
        chatId,
        userId,
        intent: dto.intent,
        title,
        description: `${classification.intent} task`,
        status: TaskStatus.PENDING,
        priority: dto.priority || 'MEDIUM',
        plan: plan as any,
        totalSteps: plan.steps.length,
      },
    });

    // Update chat lastActivity
    await this.chatsService.updateLastActivity(chatId);

    // Add initial log
    await this.addLog(task.id, {
      level: 'INFO',
      message: `Task created: ${title}`,
      metadata: { classification, planSteps: plan.steps.length },
    });

    this.logger.log(`Task created: ${task.id}`);

    // Auto-start execution
    await this.startTask(task.id);

    return this.mapToResponse(task);
  }

  /**
   * Handle lightweight response for conversational intents
   * Creates a task that completes immediately with the response
   */
  private async handleLightweightResponse(
    chatId: string,
    userId: string,
    userMessage: string,
    classification: any,
    chatContext: ChatContext,
  ): Promise<TaskResponseDto> {
    // Generate quick response
    const response = await this.lightweightService.generateResponse(
      userMessage,
      classification,
      chatContext,
    );

    // Create a completed task with the response
    const task = await this.prisma.task.create({
      data: {
        chatId,
        userId,
        intent: userMessage,
        title: this.getLightweightTitle(classification.intent),
        description: `${classification.intent} response`,
        status: TaskStatus.SUCCEEDED,
        priority: 'LOW',
        plan: { intent: classification.intent, steps: [], metadata: { isLightweight: true } } as any,
        totalSteps: 0,
        currentStep: 0,
        result: {
          success: true,
          message: response.message,
          isLightweight: true,
          intent: classification.intent,
        } as any,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Update chat lastActivity
    await this.chatsService.updateLastActivity(chatId);

    this.logger.log(`Lightweight response created: ${task.id} for intent ${classification.intent}`);

    return this.mapToResponse(task);
  }

  /**
   * Get a friendly title for lightweight intents
   */
  private getLightweightTitle(intent: string): string {
    const titles: Record<string, string> = {
      greeting: 'Greeting',
      help: 'Help Request',
      clarification: 'Clarification',
      general_question: 'Question',
    };
    return titles[intent] || 'Response';
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this task');
    }

    return this.mapToResponse(task);
  }

  /**
   * List tasks in a chat
   */
  async listTasksInChat(chatId: string, userId: string): Promise<TaskResponseDto[]> {
    // Verify chat ownership
    await this.chatsService.getChat(chatId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    return tasks.map((task) => this.mapToResponse(task));
  }

  /**
   * Start task execution
   */
  async startTask(taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Validate state transition
    if (!this.stateValidator.validateTransition(task.status, TaskStatus.RUNNING)) {
      throw new BadRequestException(
        this.stateValidator.getTransitionErrorMessage(task.status, TaskStatus.RUNNING),
      );
    }

    // Update status
    const updatedTask = await this.updateStatus(taskId, TaskStatus.RUNNING);

    // Emit event for real-time updates
    this.eventEmitter.emit('task.status.changed', {
      taskId,
      status: TaskStatus.RUNNING,
      currentStep: 0,
      totalSteps: task.totalSteps,
    });

    // Enqueue for execution
    await this.queueService.addJob(
      QueueName.TASK,
      TaskJobType.EXECUTE_TASK,
      {
        taskId: task.id,
        userId: task.userId,
        payload: { plan: task.plan },
      },
    );

    await this.addLog(taskId, {
      level: 'INFO',
      message: 'Task execution started',
    });

    this.logger.log(`Task ${taskId} started and enqueued`);

    return this.mapToResponse(updatedTask);
  }

  /**
   * Pause task execution
   */
  async pauseTask(taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (!this.stateValidator.validateTransition(task.status, TaskStatus.PAUSED)) {
      throw new BadRequestException(
        this.stateValidator.getTransitionErrorMessage(task.status, TaskStatus.PAUSED),
      );
    }

    const updatedTask = await this.updateStatus(taskId, TaskStatus.PAUSED);

    await this.addLog(taskId, {
      level: 'INFO',
      message: 'Task paused by user',
    });

    return this.mapToResponse(updatedTask);
  }

  /**
   * Resume task execution
   */
  async resumeTask(taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (!this.stateValidator.validateTransition(task.status, TaskStatus.RUNNING)) {
      throw new BadRequestException(
        this.stateValidator.getTransitionErrorMessage(task.status, TaskStatus.RUNNING),
      );
    }

    const updatedTask = await this.updateStatus(taskId, TaskStatus.RUNNING);

    // Re-enqueue for execution
    await this.queueService.addJob(
      QueueName.TASK,
      TaskJobType.EXECUTE_TASK,
      {
        taskId: task.id,
        userId: task.userId,
        payload: { plan: task.plan, resume: true },
      },
    );

    await this.addLog(taskId, {
      level: 'INFO',
      message: 'Task resumed',
    });

    return this.mapToResponse(updatedTask);
  }

  /**
   * Cancel task execution
   */
  async cancelTask(taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (!this.stateValidator.validateTransition(task.status, TaskStatus.CANCELLED)) {
      throw new BadRequestException(
        this.stateValidator.getTransitionErrorMessage(task.status, TaskStatus.CANCELLED),
      );
    }

    const updatedTask = await this.updateStatus(taskId, TaskStatus.CANCELLED);

    await this.addLog(taskId, {
      level: 'WARN',
      message: 'Task cancelled by user',
    });

    return this.mapToResponse(updatedTask);
  }

  /**
   * Mark task as completed successfully
   */
  async completeTask(taskId: string, result: any): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const completedTask = await this.updateStatus(taskId, TaskStatus.SUCCEEDED);

    // Update task with result
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        result: result as any,
        completedAt: new Date(),
      },
    });

    // Add log
    await this.addLog(taskId, {
      level: 'INFO',
      message: 'Task completed successfully',
      metadata: { result },
    });

    // Emit event for real-time updates
    this.eventEmitter.emit('task.completed', {
      taskId,
      result,
    });

    this.logger.log(`Task ${taskId} completed`);

    return this.mapToResponse(completedTask);
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId: string, error: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const failedTask = await this.updateStatus(taskId, TaskStatus.FAILED);

    // Update task with error
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        error: error,
        completedAt: new Date(),
      },
    });

    // Add log
    await this.addLog(taskId, {
      level: 'ERROR',
      message: `Task failed: ${error}`,
      metadata: { error },
    });

    // Emit event for real-time updates
    this.eventEmitter.emit('task.failed', {
      taskId,
      error,
    });

    this.logger.error(`Task ${taskId} failed: ${error}`);

    return this.mapToResponse(failedTask);
  }

  /**
   * Update task status with validation
   */
  async updateStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Validate transition
    if (!this.stateValidator.validateTransition(task.status, status)) {
      throw new BadRequestException(
        this.stateValidator.getTransitionErrorMessage(task.status, status),
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === TaskStatus.RUNNING && !task.startedAt && { startedAt: new Date() }),
      },
    });

    return updatedTask;
  }

  /**
   * Add log entry to task
   */
  async addLog(
    taskId: string,
    log: { level: string; message: string; step?: number; metadata?: any },
  ): Promise<TaskLog> {
    return this.prisma.taskLog.create({
      data: {
        taskId,
        level: log.level as any,
        message: log.message,
        step: log.step,
        metadata: log.metadata as any,
      },
    });
  }

  /**
   * Get logs for a task
   */
  async getLogs(taskId: string): Promise<TaskLog[]> {
    return this.prisma.taskLog.findMany({
      where: { taskId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Add artifact to task (screenshot, file, etc.)
   */
  async addArtifact(
    taskId: string,
    artifact: { type: any; url: string; name: string; description?: string },
  ): Promise<any> {
    return this.prisma.taskArtifact.create({
      data: {
        taskId,
        type: artifact.type,
        url: artifact.url,
        name: artifact.name,
        description: artifact.description,
      },
    });
  }

  /**
   * Get artifacts for a task
   */
  async getArtifacts(taskId: string): Promise<any[]> {
    return this.prisma.taskArtifact.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update current step progress
   */
  async updateCurrentStep(taskId: string, currentStep: number): Promise<void> {
    await this.prisma.task.update({
      where: { id: taskId },
      data: { currentStep },
    });
  }

  /**
   * Get chat context for task execution
   */
  async getTaskContext(taskId: string): Promise<ChatContext> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    return this.chatsService.getChatContext(task.chatId);
  }

  /**
   * Execute task (called by TaskProcessor)
   */
  async executeTask(taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { chat: true },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    try {
      this.logger.log(`Executing task ${taskId}`);

      // Get execution context - TODO: Pass chat context to tools
      // const chatContext = await this.getTaskContext(taskId);
      const context: ExecutionContext = {
        userId: task.userId,
        taskId: task.id,
        userProfile: {}, // TODO: Load user profile
        dryRun: false,
      };

      // Execute plan
      const result = await this.toolExecutor.executePlan(task.plan as any, context);

      // Update task status based on result
      if (result.success) {
        await this.completeTask(taskId, result);
      } else {
        const firstError = result.results?.find((r: any) => !r.success);
        await this.failTask(
          taskId,
          firstError?.result?.error?.message || result.error?.message || 'Execution failed',
        );
      }
    } catch (error) {
      this.logger.error(`Task execution error for ${taskId}:`, error);
      await this.failTask(taskId, error.message || 'Unknown error');
    }
  }

  /**
   * Generate task title from intent using LLM
   */
  private async generateTaskTitle(intent: string): Promise<string> {
    const prompt = `Generate a concise task title (max 8 words) for this intent:

"${intent}"

Title:`;

    try {
      const completion = await this.llmService.complete([
        { role: 'system', content: 'You generate concise task titles.' },
        { role: 'user', content: prompt },
      ]);

      const title = completion.choices[0]?.message?.content || intent;
      return title.trim().replace(/^["']|["']$/g, '').slice(0, 100);
    } catch (error) {
      this.logger.warn('Failed to generate title, using intent', error);
      return intent.slice(0, 100);
    }
  }

  /**
   * Map Task entity to response DTO
   */
  private mapToResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      userId: task.userId,
      chatId: task.chatId,
      title: task.title,
      description: task.description,
      intent: task.intent,
      status: task.status,
      priority: task.priority,
      plan: task.plan,
      currentStep: task.currentStep,
      totalSteps: task.totalSteps,
      result: task.result,
      error: task.error || undefined,
      startedAt: task.startedAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
