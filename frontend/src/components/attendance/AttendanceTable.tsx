import React from 'react';
import { Attendance } from '../../lib/types';
import {
  formatTimeShort,
  calculatePunctuality,
  calculateDurationHours,
} from './attendanceUtils';

interface AttendanceTableProps {
  records?: Attendance[];
  isLoading: boolean;
  showStaffColumn?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records = [],
  isLoading,
  showStaffColumn = true,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-[#5d5f60] font-mono border border-[#e8eaec] bg-white rounded-xl">
        Loading attendance records from store database...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center border border-[#e8eaec] bg-white rounded-xl">
        <span className="text-xs font-semibold text-[#131416] block">
          No attendance records found
        </span>
        <span className="text-xs text-[#5d5f60] mt-1 block">
          No shift punches match the selected date range or status filter.
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-xl">
      <table className="w-full text-left text-xs border-collapse min-w-[780px]">
        <thead>
          <tr className="border-b border-[#e8eaec] bg-[#f9fbfc] text-[#5d5f60] text-xs font-medium h-10">
            {showStaffColumn && (
              <th className="py-2.5 px-4 font-semibold w-64">
                Employee Associate
              </th>
            )}
            <th className="py-2.5 px-3 font-semibold">Shift Window</th>
            <th className="py-2.5 px-3 font-semibold">Clock In (Punctuality)</th>
            <th className="py-2.5 px-3 font-semibold">Clock Out</th>
            <th className="py-2.5 px-3 font-semibold text-right">Duration</th>
            <th className="py-2.5 px-3 font-semibold text-center">Status</th>
            <th className="py-2.5 px-4 font-semibold">Operating Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
          {records.map((att) => {
            const punctuality = calculatePunctuality(
              att.checkInAt,
              att.shiftStartTime
            );
            const duration = calculateDurationHours(
              att.checkInAt,
              att.checkOutAt
            );

            const initials = att.userName
              ? att.userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'ST';

            return (
              <tr
                key={att.id}
                className="hover:bg-[#f9fbfc]/80 transition-colors"
              >
                {/* Employee Associate Column */}
                {showStaffColumn && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#f4f6f8] border border-[#cdced1] flex items-center justify-center text-[11px] font-semibold text-[#131416] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-[#131416] block truncate">
                          {att.userName || 'Associate'}
                        </span>
                        <span className="text-[11px] text-[#5d5f60] block truncate">
                          {att.userEmail || 'Store Associate'}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Shift Window Column */}
                <td className="py-3 px-3">
                  <span className="font-semibold text-xs text-[#131416] block">
                    {att.shiftName || 'Standard Shift'}
                  </span>
                  <span className="text-[11px] text-[#5d5f60] font-mono tabular-nums block">
                    {formatTimeShort(att.shiftStartTime)} –{' '}
                    {formatTimeShort(att.shiftEndTime)}
                  </span>
                </td>

                {/* Clock In + Punctuality Column */}
                <td className="py-3 px-3 font-mono tabular-nums">
                  {att.checkInAt ? (
                    <div>
                      <span className="font-semibold text-xs text-[#131416] block">
                        {formatTimeShort(att.checkInAt)}
                      </span>
                      <span
                        className={`text-[11px] font-medium block ${
                          punctuality.isLate
                            ? 'text-[#92400e]'
                            : 'text-[#1e7b4f]'
                        }`}
                      >
                        {punctuality.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#5d5f60] text-[11px]">
                      Not clocked in
                    </span>
                  )}
                </td>

                {/* Clock Out Column */}
                <td className="py-3 px-3 font-mono tabular-nums">
                  {att.checkOutAt ? (
                    <div>
                      <span className="font-semibold text-xs text-[#131416] block">
                        {formatTimeShort(att.checkOutAt)}
                      </span>
                      <span className="text-[11px] text-[#5d5f60] block">
                        Shift concluded
                      </span>
                    </div>
                  ) : att.checkInAt ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
                      On floor
                    </span>
                  ) : (
                    <span className="text-[#cdced1]">—</span>
                  )}
                </td>

                {/* Duration Column (Right-aligned) */}
                <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium">
                  {duration}
                </td>

                {/* Status Pill Column */}
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium tracking-tight ${
                      att.status === 'PRESENT'
                        ? 'bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20'
                        : att.status === 'LATE'
                        ? 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/30'
                        : att.status === 'COMPLETED'
                        ? 'bg-[#f4f6f8] text-[#5d5f60] border border-[#5d5f60]/20'
                        : 'bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/30'
                    }`}
                  >
                    {att.status === 'PRESENT'
                      ? 'Present'
                      : att.status === 'LATE'
                      ? 'Late'
                      : att.status === 'COMPLETED'
                      ? 'Completed'
                      : 'Absent'}
                  </span>
                </td>

                {/* Notes Column */}
                <td className="py-3 px-4 text-[#5d5f60] text-[11px] max-w-xs truncate">
                  {att.notes || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
