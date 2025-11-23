/**
 * Chats Service
 * Business logic for chat/conversation management
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Chat, Task } from '@prisma/client';

import { LLMService } from '../../../agent/llm/llm.service';
import { PrismaService } from '../../../libs/prisma';
import { ChatContext, ListChatsOptions } from '../types/chat.types';

import { ChatResponseDto, ChatWithTasksDto, CreateChatDto, UpdateChatDto } from './dto';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LLMService,
  ) {}

  /**
   * Create a new chat/conversation
   */
  async createChat(userId: string, dto: CreateChatDto): Promise<Chat> {
    this.logger.log(`Creating chat for user ${userId}`);

    // Generate title from first message if not provided
    const title = dto.title || (await this.generateTitle(dto.firstMessage));

    const chat = await this.prisma.chat.create({
      data: {
        userId,
        title,
        lastMessage: dto.firstMessage,
        lastActivity: new Date(),
      },
    });

    this.logger.log(`Chat created: ${chat.id}`);
    return chat;
  }

  /**
   * Get a chat by ID with all tasks
   */
  async getChat(chatId: string, userId: string): Promise<ChatWithTasksDto> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            logs: {
              orderBy: { timestamp: 'desc' },
              take: 5, // Last 5 logs per task
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this chat');
    }

    return {
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      summary: chat.summary || undefined,
      lastMessage: chat.lastMessage || undefined,
      taskCount: chat.tasks.length,
      lastActivity: chat.lastActivity.toISOString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      tasks: chat.tasks,
    };
  }

  /**
   * List user's chats (for sidebar)
   */
  async listChats(
    userId: string,
    options: ListChatsOptions = {},
  ): Promise<ChatResponseDto[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'lastActivity',
      order = 'desc',
    } = options;

    const chats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: { [orderBy]: order },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return chats.map((chat) => ({
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      summary: chat.summary || undefined,
      lastMessage: chat.lastMessage || undefined,
      taskCount: chat._count.tasks,
      lastActivity: chat.lastActivity.toISOString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));
  }

  /**
   * Update chat metadata
   */
  async updateChat(chatId: string, userId: string, dto: UpdateChatDto): Promise<Chat> {
    // Verify ownership
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this chat');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.summary && { summary: dto.summary }),
      },
    });
  }

  /**
   * Delete a chat (cascade deletes tasks)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    // Verify ownership
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this chat');
    }

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    this.logger.log(`Chat deleted: ${chatId}`);
  }

  /**
   * Update lastActivity timestamp
   */
  async updateLastActivity(chatId: string): Promise<void> {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Generate AI summary for chat
   */
  async generateSummary(chatId: string): Promise<string> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        tasks: {
          select: {
            title: true,
            intent: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    const tasksContext = chat.tasks
      .map((t) => `- ${t.title} (${t.status})`)
      .join('\n');

    const prompt = `Generate a concise 1-2 sentence summary of this conversation:

Title: ${chat.title}
Tasks:
${tasksContext}

Summary:`;

    try {
      const completion = await this.llmService.complete([
        { role: 'system', content: 'You generate concise conversation summaries.' },
        { role: 'user', content: prompt },
      ]);

      const summary = completion.choices[0]?.message?.content || chat.title;
      const cleanSummary = summary.trim();

      // Update chat with summary
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { summary: cleanSummary },
      });

      return cleanSummary;
    } catch (error) {
      this.logger.error(`Failed to generate summary for chat ${chatId}:`, error);
      return chat.title; // Fallback to title
    }
  }

  /**
   * Get chat context for task execution
   */
  async getChatContext(chatId: string): Promise<ChatContext> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            intent: true,
            status: true,
            result: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat ${chatId} not found`);
    }

    return {
      chatId: chat.id,
      previousTasks: chat.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        intent: task.intent,
        status: task.status,
        result: task.result,
        createdAt: task.createdAt,
      })),
      summary: chat.summary || undefined,
    };
  }

  /**
   * Get task count for a chat
   */
  async getTaskCount(chatId: string): Promise<number> {
    return this.prisma.task.count({
      where: { chatId },
    });
  }

  /**
   * Get tasks in a chat
   */
  async getTasksInChat(chatId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Generate title from first message using LLM
   */
  private async generateTitle(message: string): Promise<string> {
    const prompt = `Generate a short, descriptive title (max 5 words) for this conversation:

"${message}"

Title:`;

    try {
      const completion = await this.llmService.complete([
        { role: 'system', content: 'You generate concise conversation titles.' },
        { role: 'user', content: prompt },
      ]);

      const title = completion.choices[0]?.message?.content || message;
      
      // Clean and limit title
      const cleanTitle = title.trim().replace(/^["']|["']$/g, '');
      return cleanTitle.slice(0, 100); // Max 100 chars
    } catch (error) {
      this.logger.warn('Failed to generate title, using fallback', error);
      // Fallback: Use first few words of message
      return message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }
  }
}
