import { AlertCircle, Bot, Menu } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { ChatInput, ChatMessage, EmptyState } from '@/components/molecules';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  lastActivity?: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatViewProps {
  chatId?: string;
  messages: Message[];
  isLoading?: boolean;
  error?: string;
  userName?: string;
  userAvatar?: string;
  onSendMessage: (message: string) => void;
  onStop?: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}

const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  messages,
  isLoading,
  error,
  userName,
  userAvatar,
  onSendMessage,
  onStop,
  onToggleSidebar,
  className,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className={cn('flex h-full w-full flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Text variant="small" className="font-medium">
              AI Assistant
            </Text>
            <Text variant="small" className="text-xs text-muted-foreground">
              {isLoading ? 'Thinking...' : 'Online'}
            </Text>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {!chatId ? (
          // Empty state when no chat selected
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={Bot}
              title="Welcome to AI Flow"
              description="Start a new conversation or select an existing chat from the sidebar"
            />
          </div>
        ) : messages.length === 0 ? (
          // Empty state when chat has no messages
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={Bot}
              title="Start the conversation"
              description="Ask me anything or describe a task you'd like me to help with"
            />
          </div>
        ) : (
          // Messages list
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                userName={userName}
                avatarSrc={userAvatar}
              />
            ))}
            
            {/* Typing indicator */}
            {isLoading && (
              <ChatMessage
                role="assistant"
                content=""
                isTyping
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={onStop}
            disabled={!chatId}
            isLoading={isLoading}
            placeholder={
              chatId
                ? 'Send a message...'
                : 'Select or create a chat to start messaging'
            }
          />
          
          {/* Disclaimer */}
          <Text variant="small" className="mt-2 text-center text-xs text-muted-foreground">
            AI can make mistakes. Check important info.
          </Text>
        </div>
      </div>
    </div>
  );
};

ChatView.displayName = 'ChatView';

export { ChatView };
