import React from 'react';
import { IssuePriority } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface IssuePriorityBadgeProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

export const IssuePriorityBadge: React.FC<IssuePriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  switch (priority) {
    case 'URGENT':
      return <Badge variant="urgent" size={size}>Urgent</Badge>;
    case 'HIGH':
      return <Badge variant="high" size={size}>High</Badge>;
    case 'NORMAL':
      return <Badge variant="neutral" size={size}>Normal</Badge>;
    case 'LOW':
    default:
      return <Badge variant="low" size={size}>Low</Badge>;
  }
};
