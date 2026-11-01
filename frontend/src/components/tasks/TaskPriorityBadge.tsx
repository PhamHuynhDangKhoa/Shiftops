import React from 'react';
import { TaskPriority } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  switch (priority) {
    case 'HIGH':
      return <Badge variant="urgent" size={size}>High</Badge>;
    case 'NORMAL':
      return <Badge variant="brand" size={size}>Normal</Badge>;
    case 'LOW':
    default:
      return <Badge variant="low" size={size}>Low</Badge>;
  }
};
