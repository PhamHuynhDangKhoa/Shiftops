import React from 'react';
import { Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceTableProps {
  records?: Attendance[];
  isLoading: boolean;
  showStaffColumn?: boolean;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '-';
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
    <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#e8eaec] text-[#5d5f60] text-xs font-normal">
            {showStaffColumn && <th className="py-2.5 px-3.5 font-normal">Employee</th>}
            <th className="py-2.5 px-3.5 font-normal">Shift date</th>
            <th className="py-2.5 px-3.5 font-normal">Shift name</th>
            <th className="py-2.5 px-3.5 font-normal">Status</th>
            <th className="py-2.5 px-3.5 font-normal">Clock in</th>
            <th className="py-2.5 px-3.5 font-normal">Clock out</th>
            <th className="py-2.5 px-3.5 font-normal">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
          {records.map((att) => (
            <tr key={att.id} className="hover:bg-[#f4f6f8] transition-colors">
              {showStaffColumn && (
                <td className="py-3 px-3.5 font-medium text-[#131416] whitespace-nowrap">
                  {att.userName || 'Staff Member'}
                </td>
              )}
              <td className="py-3 px-3.5 text-[#5d5f60] whitespace-nowrap tabular-nums">
                {formatDateTime(att.shiftStartTime)}
              </td>
              <td className="py-3 px-3.5 text-[#131416] font-medium whitespace-nowrap">
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
                {att.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
