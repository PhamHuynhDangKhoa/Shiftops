import { Attendance } from '../../lib/types';
import {
  calculatePunctuality,
  calculateDurationHours,
} from './attendanceUtils';

const escapeCsv = (str: string): string => {
  if (!str) return '""';
  const clean = str.replace(/"/g, '""');
  return `"${clean}"`;
};

export const exportAttendanceToCsv = (
  records: Attendance[],
  branchName: string = 'Shibuya Flagship'
): void => {
  if (!records || records.length === 0) {
    alert('No attendance records available to export.');
    return;
  }

  const headers = [
    'Employee Associate',
    'Email',
    'Branch Store',
    'Shift Window',
    'Scheduled Start',
    'Scheduled End',
    'Clock In (Recorded)',
    'Clock Out (Recorded)',
    'Punctuality Delta',
    'Logged Duration',
    'Attendance Status',
    'Supervisor Operating Notes',
  ];

  const rows = records.map((r) => {
    const punctuality = calculatePunctuality(r.checkInAt, r.shiftStartTime);
    const duration = calculateDurationHours(r.checkInAt, r.checkOutAt);

    return [
      escapeCsv(r.userName || 'Associate'),
      escapeCsv(r.userEmail || ''),
      escapeCsv(r.branchName || branchName),
      escapeCsv(r.shiftName || 'Standard Shift'),
      escapeCsv(r.shiftStartTime || ''),
      escapeCsv(r.shiftEndTime || ''),
      escapeCsv(r.checkInAt || 'Not clocked in'),
      escapeCsv(r.checkOutAt || (r.checkInAt ? 'Active on floor' : 'Pending')),
      escapeCsv(punctuality.label),
      escapeCsv(duration),
      escapeCsv(r.status),
      escapeCsv(r.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `shiftops-attendance-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
