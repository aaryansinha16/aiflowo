/**
 * Chats Controller
 * REST API endpoints for chat/conversation management
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ListChatsOptions } from '../types/chat.types';

import { ChatsService } from './chats.service';
import { ChatResponseDto, ChatWithTasksDto, CreateChatDto, UpdateChatDto } from './dto';

@ApiTags('chats')
@ApiBearerAuth('JWT')
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * Create a new chat/conversation
   * POST /api/chats
   */
  @Post()
  @ApiOperation({ summary: 'Create a new chat', description: 'Creates a new chat/conversation with an initial message' })
  @ApiResponse({ status: 201, description: 'Chat created successfully', type: ChatResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createChat(
    @CurrentUser() user: any,
    @Body() dto: CreateChatDto,
  ): Promise<ChatResponseDto> {
    const chat = await this.chatsService.createChat(user.id, dto);
    
    return {
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      summary: chat.summary || undefined,
      lastMessage: chat.lastMessage || undefined,
      taskCount: 0, // New chat has no tasks yet
      lastActivity: chat.lastActivity.toISOString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  }

  /**
   * List user's chats (for sidebar)
   * GET /api/chats
   */
  @Get()
  @ApiOperation({ summary: 'List all chats', description: 'Get all chats for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of chats', type: [ChatResponseDto] })
  async listChats(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orderBy') orderBy?: 'lastActivity' | 'createdAt',
  ): Promise<ChatResponseDto[]> {
    const options: ListChatsOptions = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      orderBy: orderBy || 'lastActivity',
      order: 'desc',
    };

    return this.chatsService.listChats(user.id, options);
  }

  /**
   * Get a chat with all tasks
   * GET /api/chats/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get chat details', description: 'Get a specific chat with all its tasks' })
  @ApiResponse({ status: 200, description: 'Chat with tasks', type: ChatWithTasksDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChat(
    @Param('id') chatId: string,
    @CurrentUser() user: any,
  ): Promise<ChatWithTasksDto> {
    return this.chatsService.getChat(chatId, user.id);
  }

  /**
   * Update chat metadata (title, summary)
   * PATCH /api/chats/:id
   */
  @Patch(':id')
  async updateChat(
    @Param('id') chatId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateChatDto,
  ): Promise<ChatResponseDto> {
    const chat = await this.chatsService.updateChat(chatId, user.id, dto);
    const taskCount = await this.chatsService.getTaskCount(chatId);

    return {
      id: chat.id,
      userId: chat.userId,
      title: chat.title,
      summary: chat.summary || undefined,
      lastMessage: chat.lastMessage || undefined,
      taskCount,
      lastActivity: chat.lastActivity.toISOString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  }

  /**
   * Delete a chat (cascade deletes tasks)
   * DELETE /api/chats/:id
   */
  @Delete(':id')
  async deleteChat(
    @Param('id') chatId: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.chatsService.deleteChat(chatId, user.id);
    return { message: 'Chat deleted successfully' };
  }

  /**
   * Generate AI summary for chat
   * POST /api/chats/:id/summary
   */
  @Post(':id/summary')
  async generateSummary(
    @Param('id') chatId: string,
    @CurrentUser() user: any,
  ): Promise<{ summary: string }> {
    // Verify ownership
    await this.chatsService.getChat(chatId, user.id);
    
    const summary = await this.chatsService.generateSummary(chatId);
    return { summary };
  }
}
