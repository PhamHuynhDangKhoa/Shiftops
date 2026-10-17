import React from 'react';
import { TaskStatus } from '../../lib/types';
import { Badge } from '../ui';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const variant =
    status === 'COMPLETED'
      ? 'success'
      : status === 'IN_PROGRESS'
      ? 'brand'
      : status === 'CANCELLED'
      ? 'urgent'
      : 'neutral';

  return <Badge variant={variant}>{status}</Badge>;
};
