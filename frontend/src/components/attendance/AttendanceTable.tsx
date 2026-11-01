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
  onSelectRecord?: (record: Attendance) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records = [],
  isLoading,
  showStaffColumn = true,
  onSelectRecord,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[13px] text-[#5d5f60] border border-[#e8eaec] bg-white rounded-xl">
        Loading attendance records from store database...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center border border-[#e8eaec] bg-white rounded-xl">
        <span className="text-sm font-semibold text-[#131416] block">
          No attendance records found
        </span>
        <span className="text-[13px] text-[#5d5f60] mt-1 block">
          No shift punches match the selected date range or status filter.
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-xl">
      <table className="w-full text-left border-collapse min-w-[840px]">
        <thead>
          <tr className="border-b border-[#e8eaec] bg-[#f9fbfc] text-[#5d5f60] text-[13px] font-medium h-11">
            {showStaffColumn && (
              <th className="py-3 px-4 font-semibold w-64">
                Employee Associate
              </th>
            )}
            <th className="py-3 px-3 font-semibold">Shift Window</th>
            <th className="py-3 px-3 font-semibold">Clock In (Punctuality)</th>
            <th className="py-3 px-3 font-semibold">Clock Out</th>
            <th className="py-3 px-3 font-semibold text-right">Duration</th>
            <th className="py-3 px-3 font-semibold text-center">Status</th>
            <th className="py-3 px-4 font-semibold text-right">Audit Action</th>
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
                onClick={() => onSelectRecord?.(att)}
                className={`hover:bg-[#f9fbfc] transition-colors ${
                  onSelectRecord ? 'cursor-pointer' : ''
                }`}
              >
                {/* Employee Associate Column */}
                {showStaffColumn && (
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f4f6f8] border border-[#cdced1] flex items-center justify-center text-xs font-semibold text-[#131416] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-[#131416] block truncate">
                          {att.userName || 'Associate'}
                        </span>
                        <span className="text-[13px] text-[#5d5f60] block truncate font-mono">
                          {att.userEmail || 'store.staff@shiftops.dev'}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Shift Window Column */}
                <td className="py-3.5 px-3">
                  <span className="font-semibold text-sm text-[#131416] block">
                    {att.shiftName || 'Standard Shift'}
                  </span>
                  <span className="text-[13px] text-[#5d5f60] font-mono tabular-nums block mt-0.5">
                    {formatTimeShort(att.shiftStartTime)} –{' '}
                    {formatTimeShort(att.shiftEndTime)}
                  </span>
                </td>

                {/* Clock In + Punctuality Column */}
                <td className="py-3.5 px-3">
                  {att.checkInAt ? (
                    <div>
                      <span className="font-semibold text-[13px] text-[#131416] block font-mono tabular-nums">
                        {formatTimeShort(att.checkInAt)}
                      </span>
                      <span
                        className={`text-[13px] font-medium block mt-0.5 ${
                          punctuality.isLate
                            ? 'text-[#92400e]'
                            : 'text-[#1e7b4f]'
                        }`}
                      >
                        {punctuality.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#5d5f60] text-[13px]">
                      Not clocked in
                    </span>
                  )}
                </td>

                {/* Clock Out Column */}
                <td className="py-3.5 px-3">
                  {att.checkOutAt ? (
                    <div>
                      <span className="font-semibold text-[13px] text-[#131416] block font-mono tabular-nums">
                        {formatTimeShort(att.checkOutAt)}
                      </span>
                      <span className="text-[13px] text-[#5d5f60] block mt-0.5">
                        Shift concluded
                      </span>
                    </div>
                  ) : att.checkInAt ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 text-[13px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
                      On floor
                    </span>
                  ) : (
                    <span className="text-[#cdced1] text-[13px] font-mono">—</span>
                  )}
                </td>

                {/* Duration Column (Right-aligned) */}
                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[13px] font-semibold text-[#131416]">
                  {duration}
                </td>

                {/* Status Column */}
                <td className="py-3.5 px-3 text-center">
                  {att.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#e8eaec] bg-[#f4f6f8] text-[#5d5f60] text-[13px] font-medium">
                      Completed
                    </span>
                  ) : att.status === 'PRESENT' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#1e7b4f]/25 bg-[#dcfae5] text-[#04250e] text-[13px] font-medium">
                      Present
                    </span>
                  ) : att.status === 'LATE' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#d97706]/30 bg-[#fef3c7] text-[#92400e] text-[13px] font-medium">
                      Late Arrival
                    </span>
                  ) : att.status === 'ABSENT' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#c4242a]/30 bg-[#ffedea] text-[#831c1e] text-[13px] font-medium">
                      Absent
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#e8eaec] bg-[#f4f6f8] text-[#5d5f60] text-[13px] font-medium">
                      {att.status}
                    </span>
                  )}
                </td>

                {/* Audit Action Column */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRecord?.(att);
                    }}
                    className="h-8 px-3 rounded border border-[#cdced1] bg-white text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                  >
                    Receipt →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
