import React from 'react';
import { Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { Badge } from '../ui/Badge';

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
      <div className="py-12 text-center text-xs text-zinc-400 font-mono">
        Loading attendance records...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-zinc-500">
        No attendance records found for the selected filter range.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
            {showStaffColumn && <th className="py-2.5 px-3 font-medium">Staff Member</th>}
            <th className="py-2.5 px-3 font-medium">Shift Interval</th>
            <th className="py-2.5 px-3 font-medium">Roster / Shift</th>
            <th className="py-2.5 px-3 font-medium">Status</th>
            <th className="py-2.5 px-3 font-medium">Clock In</th>
            <th className="py-2.5 px-3 font-medium">Clock Out</th>
            <th className="py-2.5 px-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {records.map((att) => (
            <tr key={att.id} className="hover:bg-zinc-50/80 transition-colors">
              {showStaffColumn && (
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-zinc-900">{att.userName || 'Staff Member'}</div>
                  <div className="text-[11px] font-mono text-zinc-400">{att.userEmail}</div>
                </td>
              )}
              <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                <div>{formatDateTime(att.shiftStartTime)}</div>
                <div className="text-[11px] text-zinc-400">→ {formatDateTime(att.shiftEndTime)}</div>
              </td>
              <td className="py-2.5 px-3">
                <span className="font-medium text-zinc-800">{att.shiftName || 'Scheduled Shift'}</span>
                {att.overnight && (
                  <Badge variant="brand" size="sm" className="ml-1.5">
                    Overnight
                  </Badge>
                )}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <AttendanceStatusBadge status={att.status} late={att.late} />
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                {formatDateTime(att.checkInAt)}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                {formatDateTime(att.checkOutAt)}
              </td>
              <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">
                {att.notes || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
