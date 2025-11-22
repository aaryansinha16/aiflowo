import { Clock, MoreVertical } from 'lucide-react';
import * as React from 'react';

import { Text } from '@/components/atoms';
import { StatusBadge } from '@/components/molecules';
import type { TaskStatus } from '@/components/molecules/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  onClick?: () => void;
  onAction?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, description, status, createdAt, onClick, onAction }) => {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <Text variant="small" className="text-xs">
              {new Date(createdAt).toLocaleDateString()}
            </Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

TaskCard.displayName = 'TaskCard';

export { TaskCard };
