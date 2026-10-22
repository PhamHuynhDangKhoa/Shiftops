import React from 'react';
import { AttendanceStatus } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  late?: boolean;
  size?: 'sm' | 'md';
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  late,
  size = 'sm',
}) => {
  switch (status) {
    case 'PRESENT':
      return (
        <Badge variant={late ? 'warning' : 'success'} size={size}>
          {late ? 'Present (Late)' : 'Present'}
        </Badge>
      );
    case 'LATE':
      return (
        <Badge variant="warning" size={size}>
          Late
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="neutral" size={size}>
          {late ? 'Completed (Late Start)' : 'Completed'}
        </Badge>
      );
    case 'ABSENT':
      return (
        <Badge variant="urgent" size={size}>
          Absent
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size={size}>
          {status}
        </Badge>
      );
  }
};
