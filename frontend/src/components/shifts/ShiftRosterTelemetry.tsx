import React from 'react';
import { Shift } from '../../lib/types';
import { formatShiftDurationHours } from './shiftRosterUtils';

interface ShiftRosterTelemetryProps {
  shifts: Shift[];
  totalStaffCount: number;
}

export const ShiftRosterTelemetry: React.FC<ShiftRosterTelemetryProps> = ({
  shifts,
  totalStaffCount,
}) => {
  const totalShifts = shifts.length;

  const totalHours = Math.round(
    shifts.reduce((acc, s) => acc + formatShiftDurationHours(s.startTime, s.endTime), 0) * 10
  ) / 10;

  const assignedStaffIds = new Set<string>();
  let unassignedCount = 0;
  let draftCount = 0;
  let publishedCount = 0;
  let completedCount = 0;

  shifts.forEach((s) => {
    if (s.assignments.length === 0) {
      unassignedCount++;
    } else {
      s.assignments.forEach((a) => assignedStaffIds.add(a.userId));
    }

    if (s.status === 'DRAFT') draftCount++;
    else if (s.status === 'PUBLISHED') publishedCount++;
    else if (s.status === 'COMPLETED') completedCount++;
  });

  const allocatedCount = assignedStaffIds.size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#f0f1f2] bg-white rounded-lg border border-[#e8eaec]">
      {/* Metric 1: Total Shifts */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Scheduled shifts
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] font-mono tabular-nums my-1">
          {totalShifts}
        </div>
        <span className="text-xs text-[#5d5f60] tabular-nums">
          {totalHours} planned store hours
        </span>
      </div>

      {/* Metric 2: Staff Allocation */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Staff allocated
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] font-mono tabular-nums my-1">
          {allocatedCount} / {Math.max(allocatedCount, totalStaffCount)}
        </div>
        <span className="text-xs text-[#5d5f60]">
          {unassignedCount > 0 ? (
            <span className="text-[#92400e] font-medium">
              {unassignedCount} slot awaiting assignment
            </span>
          ) : (
            'All roster slots filled'
          )}
        </span>
      </div>

      {/* Metric 3: Draft Shifts */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Draft shifts
        </span>
        <div
          className={`text-2xl sm:text-3xl font-normal font-mono tabular-nums my-1 ${
            draftCount > 0 ? 'text-[#92400e]' : 'text-[#131416]'
          }`}
        >
          {draftCount}
        </div>
        <span className="text-xs text-[#5d5f60]">
          {draftCount > 0 ? 'Require manager publishing' : 'All shifts published'}
        </span>
      </div>

      {/* Metric 4: Published Coverage */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Published active
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] font-mono tabular-nums my-1">
          {publishedCount}
        </div>
        <span className="text-xs text-[#5d5f60] tabular-nums">
          {completedCount} shifts concluded
        </span>
      </div>
    </div>
  );
};
