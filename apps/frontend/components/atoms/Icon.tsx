import { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ icon: IconComponent, size = 'md', className, ...props }, ref) => {
    return (
      <span ref={ref} className={cn('inline-flex items-center justify-center', className)} {...props}>
        <IconComponent className={sizeClasses[size]} />
      </span>
    );
  }
);

Icon.displayName = 'Icon';

export { Icon };
