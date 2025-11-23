import { Clock, MessageSquare, MoreVertical } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatListItemProps {
  id: string;
  title: string;
  lastMessage?: string;
  lastActivity: string;
  taskCount: number;
  isActive?: boolean;
  onClick: () => void;
  onAction?: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  title,
  lastMessage,
  lastActivity,
  taskCount,
  isActive,
  onClick,
  onAction,
}) => {
  const timeAgo = React.useMemo(() => {
    const now = new Date();
    const last = new Date(lastActivity);
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  }, [lastActivity]);

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-transparent p-3 transition-all hover:bg-accent/50',
        isActive && 'border-border bg-accent'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 overflow-hidden">
          <Text
            variant="small"
            className={cn(
              'truncate font-medium',
              isActive ? 'text-foreground' : 'text-foreground/90'
            )}
          >
            {title}
          </Text>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </div>

      {/* Last Message */}
      {lastMessage && (
        <Text variant="small" className="line-clamp-2 text-xs text-muted-foreground">
          {lastMessage}
        </Text>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

ChatListItem.displayName = 'ChatListItem';

export { ChatListItem };
