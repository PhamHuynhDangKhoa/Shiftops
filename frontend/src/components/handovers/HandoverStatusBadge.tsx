import React from 'react';
import { HandoverStatus } from '../../lib/types';
import { Badge } from '../ui';

interface HandoverStatusBadgeProps {
  status: HandoverStatus;
}

export const HandoverStatusBadge: React.FC<HandoverStatusBadgeProps> = ({ status }) => {
  const variant =
    status === 'ACKNOWLEDGED'
      ? 'success'
      : status === 'SUBMITTED'
      ? 'warning'
      : 'neutral';

  return <Badge variant={variant}>{status}</Badge>;
};
