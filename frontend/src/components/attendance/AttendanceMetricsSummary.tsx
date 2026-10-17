import React from 'react';
import { Attendance } from '../../lib/types';

interface AttendanceMetricsSummaryProps {
  records?: Attendance[];
}

export const AttendanceMetricsSummary: React.FC<AttendanceMetricsSummaryProps> = ({ records = [] }) => {
  const total = records.length;
  const present = records.filter((a) => a.status === 'PRESENT' && !a.late).length;
  const late = records.filter((a) => a.late).length;
  const completed = records.filter((a) => a.status === 'COMPLETED').length;
  const absent = records.filter((a) => a.status === 'ABSENT').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Records</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{total}</div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>Present (On-Time)</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>{present}</div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 600 }}>Late Arrivals</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>{late}</div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>{completed}</div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>Absent</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>{absent}</div>
      </div>
    </div>
  );
};
