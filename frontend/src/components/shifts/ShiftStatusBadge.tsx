import React from 'react';
import { ShiftStatus } from '../../lib/types';

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
}

export const ShiftStatusBadge: React.FC<ShiftStatusBadgeProps> = ({ status }) => {
  const styles: Record<ShiftStatus, { bg: string; color: string }> = {
    DRAFT: { bg: '#fef3c7', color: '#92400e' },
    PUBLISHED: { bg: '#d1fae5', color: '#065f46' },
    COMPLETED: { bg: '#dbeafe', color: '#1e40af' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
  };

  const s = styles[status] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
};
