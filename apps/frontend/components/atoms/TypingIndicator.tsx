import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const dotSize = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-1', className)}
        {...props}
        aria-label="Typing..."
      >
        <div
          className={cn(
            'animate-bounce rounded-full bg-muted-foreground/60',
            dotSize[size]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'animate-bounce rounded-full bg-muted-foreground/60',
            dotSize[size]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'animate-bounce rounded-full bg-muted-foreground/60',
            dotSize[size]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    );
  }
);

TypingIndicator.displayName = 'TypingIndicator';

export { TypingIndicator };
