import { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: IconComponent, title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {IconComponent && (
        <div className="mb-4 rounded-full bg-muted p-6">
          <IconComponent className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <Text variant="h3" className="mb-2">
        {title}
      </Text>
      {description && (
        <Text variant="muted" className="mb-4 max-w-sm">
          {description}
        </Text>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export { EmptyState };
