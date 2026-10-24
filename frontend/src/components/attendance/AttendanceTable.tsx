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
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
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
    return (
      <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
        Loading attendance records...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
        No attendance records found for the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200/80 bg-white rounded-xl shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            {showStaffColumn && <th className="py-3 px-4">Employee</th>}
            <th className="py-3 px-4">Shift Date</th>
            <th className="py-3 px-4">Shift Name</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Clock In</th>
            <th className="py-3 px-4">Clock Out</th>
            <th className="py-3 px-4">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/70 text-zinc-800">
          {records.map((att) => (
            <tr key={att.id} className="hover:bg-zinc-50/70 transition-colors">
              {showStaffColumn && (
                <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                  {att.userName || 'Staff Member'}
                </td>
              )}
              <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap tabular-nums">
                {formatDateTime(att.shiftStartTime)}
              </td>
              <td className="py-3.5 px-4 text-zinc-900 font-medium whitespace-nowrap">
                {att.shiftName || 'Standard Shift'}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <AttendanceStatusBadge status={att.status} late={att.late} />
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-900 font-medium whitespace-nowrap">
                {formatDateTime(att.checkInAt)}
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-600 whitespace-nowrap">
                {formatDateTime(att.checkOutAt)}
              </td>
              <td className="py-3.5 px-4 text-zinc-500 max-w-xs truncate">
                {att.notes || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
