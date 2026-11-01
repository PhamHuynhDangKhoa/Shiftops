import React from 'react';
import { TaskStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success" size={size}>Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="brand" size={size}>In Progress</Badge>;
    case 'CANCELLED':
      return <Badge variant="urgent" size={size}>Cancelled</Badge>;
    case 'TODO':
    default:
      return <Badge variant="neutral" size={size}>Pending</Badge>;
  }
};
