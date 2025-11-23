import * as React from 'react';

import { cn } from '@/lib/utils';

export interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  onResize?: (width: number) => void;
}

const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(
  ({ onResize, className, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          'group relative w-1 cursor-col-resize bg-transparent transition-colors hover:bg-border',
          isDragging && 'bg-primary',
          className
        )}
        {...props}
      >
        {/* Visual indicator on hover */}
        <div
          className={cn(
            'absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border opacity-0 transition-opacity group-hover:opacity-100',
            isDragging && 'opacity-100 bg-primary'
          )}
        />
      </div>
    );
  }
);

ResizeHandle.displayName = 'ResizeHandle';

export { ResizeHandle };
