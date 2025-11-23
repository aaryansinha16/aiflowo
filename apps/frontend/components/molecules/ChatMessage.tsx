import { Bot, User } from 'lucide-react';
import * as React from 'react';

import { Avatar, MessageBubble, Text, TypingIndicator } from '@/components/atoms';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isTyping?: boolean;
  avatarSrc?: string;
  userName?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  isTyping,
  avatarSrc,
  userName,
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <div className="flex w-full justify-center py-2">
        <MessageBubble variant="system">
          <Text variant="small">{content}</Text>
        </MessageBubble>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 py-6',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar
            src={avatarSrc}
            fallback={userName}
            size="md"
            className="ring-2 ring-primary/20"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        {/* Name */}
        <Text variant="small" className="text-xs font-medium text-muted-foreground">
          {isUser ? userName || 'You' : 'AI Assistant'}
        </Text>

        {/* Message Bubble */}
        <MessageBubble variant={role}>
          {isTyping ? (
            <TypingIndicator size="sm" />
          ) : (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </div>
          )}
        </MessageBubble>

        {/* Timestamp */}
        {timestamp && !isTyping && (
          <Text variant="small" className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </div>
    </div>
  );
};

ChatMessage.displayName = 'ChatMessage';

export { ChatMessage };
