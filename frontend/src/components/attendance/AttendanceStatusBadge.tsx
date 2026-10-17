import React from 'react';
import { AttendanceStatus } from '../../lib/types';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  late?: boolean;
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({ status, late }) => {
  switch (status) {
    case 'PRESENT':
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
          }}
        >
          🟢 PRESENT
        </span>
      );
    case 'LATE':
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#fffbeb',
            color: '#d97706',
            border: '1px solid #fde68a',
          }}
        >
          ⚠️ LATE
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
          }}
        >
          🏁 COMPLETED {late ? '(LATE START)' : ''}
        </span>
      );
    case 'ABSENT':
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          ❌ ABSENT
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};
