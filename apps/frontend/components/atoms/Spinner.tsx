import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-center', className)} {...props}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
