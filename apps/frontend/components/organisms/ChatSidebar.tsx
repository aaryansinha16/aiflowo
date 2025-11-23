import { MessageSquarePlus, Search } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { ChatListItem, EmptyState, SearchBar } from '@/components/molecules';
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

export interface ChatSidebarProps {
  chats: Chat[];
  activeChat?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatAction?: (chatId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  onChatAction,
  isLoading,
  className,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(query) ||
        chat.lastMessage?.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col border-r border-border bg-muted/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Text variant="h3" className="text-lg font-semibold">
            Chats
          </Text>
          <Button
            size="sm"
            onClick={onNewChat}
            className="h-8 gap-2"
            title="New Chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search chats..."
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Text variant="small" className="text-muted-foreground">
              Loading chats...
            </Text>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            {searchQuery ? (
              <EmptyState
                icon={Search}
                title="No chats found"
                description={`No results for "${searchQuery}"`}
              />
            ) : (
              <EmptyState
                icon={MessageSquarePlus}
                title="No chats yet"
                description="Start a new conversation to get started"
                action={{
                  label: 'New Chat',
                  onClick: onNewChat,
                }}
              />
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                title={chat.title}
                lastMessage={chat.lastMessage || ''}
                lastActivity={chat.lastActivity || chat.updatedAt}
                taskCount={chat.taskCount || 0}
                isActive={chat.id === activeChat}
                onClick={() => onChatSelect(chat.id)}
                onAction={() => onChatAction?.(chat.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ChatSidebar.displayName = 'ChatSidebar';

export { ChatSidebar };
