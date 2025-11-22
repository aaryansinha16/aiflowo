import { CheckCircle2, Clock, Loader2, Pause, XCircle } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'paused';

export interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { icon: typeof CheckCircle2; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  pending: {
    icon: Clock,
    variant: 'secondary',
    label: 'Pending',
  },
  running: {
    icon: Loader2,
    variant: 'default',
    label: 'Running',
  },
  succeeded: {
    icon: CheckCircle2,
    variant: 'default',
    label: 'Succeeded',
  },
  failed: {
    icon: XCircle,
    variant: 'destructive',
    label: 'Failed',
  },
  paused: {
    icon: Pause,
    variant: 'outline',
    label: 'Paused',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1', className)}>
      <IconComponent className={cn('h-3 w-3', status === 'running' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
