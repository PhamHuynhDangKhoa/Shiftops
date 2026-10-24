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
      <div className="py-12 text-center text-xs text-[#00f0ff] font-mono">
        [ SYNCING_ATTENDANCE_TELEMETRY... ]
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-mono text-[#606c80] bg-[#11141a] border border-[#262c38]">
        [ NO ATTENDANCE LOGS FOUND FOR GIVEN QUERY ]
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#262c38] bg-[#11141a] clip-chamfer-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#161922] border-b border-[#262c38] text-[#9da8b9] font-mono text-[10px] uppercase tracking-wider">
            {showStaffColumn && <th className="py-3 px-3.5 font-bold">OPERATOR</th>}
            <th className="py-3 px-3.5 font-bold">INTERVAL</th>
            <th className="py-3 px-3.5 font-bold">ROSTER / SHIFT</th>
            <th className="py-3 px-3.5 font-bold">TELEMETRY STATUS</th>
            <th className="py-3 px-3.5 font-bold">CLOCK IN</th>
            <th className="py-3 px-3.5 font-bold">CLOCK OUT</th>
            <th className="py-3 px-3.5 font-bold">NOTES / LOG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e222b]">
          {records.map((att) => (
            <tr key={att.id} className="hover:bg-[#181c24] transition-colors font-mono">
              {showStaffColumn && (
                <td className="py-3 px-3.5 text-white font-bold whitespace-nowrap">
                  {att.userName || 'Operator'}
                </td>
              )}
              <td className="py-3 px-3.5 text-[#9da8b9] whitespace-nowrap">
                {formatDateTime(att.shiftStartTime)}
              </td>
              <td className="py-3 px-3.5 text-white font-medium whitespace-nowrap">
                {att.shiftName || 'Standard Roster'}
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <AttendanceStatusBadge status={att.status} late={att.late} />
              </td>
              <td className="py-3 px-3.5 tabular-nums text-[#00f0ff] whitespace-nowrap">
                {formatDateTime(att.checkInAt)}
              </td>
              <td className="py-3 px-3.5 tabular-nums text-[#9da8b9] whitespace-nowrap">
                {formatDateTime(att.checkOutAt)}
              </td>
              <td className="py-3 px-3.5 text-[#606c80] max-w-xs truncate">
                {att.notes || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
