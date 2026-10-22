import React from 'react';
import { HandoverStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface HandoverStatusBadgeProps {
  status: HandoverStatus;
  size?: 'sm' | 'md';
}

export const HandoverStatusBadge: React.FC<HandoverStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'ACKNOWLEDGED':
      return <Badge variant="success" size={size}>Acknowledged</Badge>;
    case 'SUBMITTED':
      return <Badge variant="warning" size={size}>Pending Ack</Badge>;
    case 'DRAFT':
    default:
      return <Badge variant="neutral" size={size}>Draft</Badge>;
  }
};
