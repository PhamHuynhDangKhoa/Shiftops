import React from 'react';
import { IssueStatus } from '../../lib/types';

interface IssueStatusBadgeProps {
  status: IssueStatus;
}

const getStatusBadgeStyle = (status: IssueStatus): React.CSSProperties => {
  switch (status) {
    case 'OPEN':
      return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'ASSIGNED':
      return { backgroundColor: '#ede9fe', color: '#6d28d9' };
    case 'IN_PROGRESS':
      return { backgroundColor: '#fef3c7', color: '#b45309' };
    case 'RESOLVED':
      return { backgroundColor: '#d1fae5', color: '#047857' };
    case 'CLOSED':
      return { backgroundColor: '#f3f4f6', color: '#4b5563' };
    case 'CANCELLED':
      return { backgroundColor: '#e5e7eb', color: '#6b7280' };
  }
};

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({ status }) => {
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getStatusBadgeStyle(status),
      }}
    >
      {status}
    </span>
  );
};
