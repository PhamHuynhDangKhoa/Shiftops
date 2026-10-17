import React from 'react';
import { IssuePriority } from '../../lib/types';

interface IssuePriorityBadgeProps {
  priority: IssuePriority;
}

const getPriorityBadgeStyle = (priority: IssuePriority): React.CSSProperties => {
  switch (priority) {
    case 'URGENT':
      return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' };
    case 'HIGH':
      return { backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' };
    case 'NORMAL':
      return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
    case 'LOW':
      return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
  }
};

export const IssuePriorityBadge: React.FC<IssuePriorityBadgeProps> = ({ priority }) => {
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 700,
        ...getPriorityBadgeStyle(priority),
      }}
    >
      {priority}
    </span>
  );
};
