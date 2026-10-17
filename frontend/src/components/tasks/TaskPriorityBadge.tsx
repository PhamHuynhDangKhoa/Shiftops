import React from 'react';
import { TaskPriority } from '../../lib/types';
import { Badge } from '../ui';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority }) => {
  const variant =
    priority === 'HIGH'
      ? 'urgent'
      : priority === 'NORMAL'
      ? 'brand'
      : 'neutral';

  return <Badge variant={variant}>{priority}</Badge>;
};
