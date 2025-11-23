import * as React from 'react';

import { cn } from '@/lib/utils';

export interface MessageBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'user' | 'assistant' | 'system';
  children: React.ReactNode;
}

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ variant = 'assistant', children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl px-4 py-3 text-sm',
          variant === 'user' &&
            'bg-primary text-primary-foreground ml-auto max-w-[80%]',
          variant === 'assistant' &&
            'bg-muted text-foreground max-w-[85%]',
          variant === 'system' &&
            'bg-accent/50 text-accent-foreground text-center text-xs italic max-w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export { MessageBubble };
