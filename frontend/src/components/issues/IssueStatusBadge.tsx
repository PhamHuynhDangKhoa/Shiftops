import React from 'react';
import { IssueStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface IssueStatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'OPEN':
      return <Badge variant="brand" size={size}>Open</Badge>;
    case 'ASSIGNED':
      return <Badge variant="neutral" size={size}>Assigned</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="warning" size={size}>In Progress</Badge>;
    case 'RESOLVED':
      return <Badge variant="success" size={size}>Resolved</Badge>;
    case 'CLOSED':
      return <Badge variant="neutral" size={size}>Closed</Badge>;
    case 'CANCELLED':
      return <Badge variant="urgent" size={size}>Cancelled</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};
