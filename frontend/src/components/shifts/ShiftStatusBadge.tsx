import React from 'react';
import { ShiftStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
  size?: 'sm' | 'md';
}

export const ShiftStatusBadge: React.FC<ShiftStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="warning" size={size}>Draft</Badge>;
    case 'PUBLISHED':
      return <Badge variant="success" size={size}>Published</Badge>;
    case 'COMPLETED':
      return <Badge variant="neutral" size={size}>Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="urgent" size={size}>Cancelled</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};
