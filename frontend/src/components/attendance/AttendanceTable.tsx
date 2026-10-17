import React from 'react';
import { Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceTableProps {
  records?: Attendance[];
  isLoading: boolean;
  showStaffColumn?: boolean;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records = [],
  isLoading,
  showStaffColumn = false,
}) => {
  if (isLoading) {
    return <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>Loading attendance records...</p>;
  }

  if (records.length === 0) {
    return <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No attendance records match the current filters.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
            {showStaffColumn && <th style={{ padding: '0.75rem' }}>Staff Member</th>}
            <th style={{ padding: '0.75rem' }}>Shift Date & Time</th>
            <th style={{ padding: '0.75rem' }}>Shift Name</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
            <th style={{ padding: '0.75rem' }}>Check In</th>
            <th style={{ padding: '0.75rem' }}>Check Out</th>
            <th style={{ padding: '0.75rem' }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((att) => (
            <tr key={att.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              {showStaffColumn && (
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{att.userName || 'Staff Member'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{att.userEmail}</div>
                </td>
              )}
              <td style={{ padding: '0.75rem' }}>
                <div>{formatDateTime(att.shiftStartTime)}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>to {formatDateTime(att.shiftEndTime)}</div>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>{att.shiftName || 'Scheduled Shift'}</span>
                {att.overnight && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#6d28d9' }}>🌙 Overnight</span>
                )}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <AttendanceStatusBadge status={att.status} late={att.late} />
              </td>
              <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkInAt)}</td>
              <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkOutAt)}</td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>{att.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
