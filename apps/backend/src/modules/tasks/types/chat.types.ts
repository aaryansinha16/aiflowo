/**
 * Chat Types
 * Shared types for chat/conversation functionality
 */

export interface ListChatsOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'lastActivity' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ChatContext {
  chatId: string;
  previousTasks: Array<{
    id: string;
    title: string;
    intent: string;
    status: string;
    result?: any;
    createdAt: Date;
  }>;
  summary?: string;
}
