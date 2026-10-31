import React from 'react';
import { Attendance } from '../../lib/types';

interface AttendanceMetricsPanelProps {
  records: Attendance[];
  onSelectStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
}

export const AttendanceMetricsPanel: React.FC<AttendanceMetricsPanelProps> = ({
  records = [],
  onSelectStatusFilter,
  activeStatusFilter = 'ALL',
}) => {
  const total = records.length;
  const presentOnFloor = records.filter(
    (a) => (a.status === 'PRESENT' || a.status === 'LATE') && !a.checkOutAt
  ).length;
  const onTimeCount = records.filter(
    (a) => (a.status === 'PRESENT' || a.status === 'COMPLETED') && !a.late
  ).length;
  const lateCount = records.filter((a) => a.late).length;
  const completedCount = records.filter((a) => a.status === 'COMPLETED').length;
  const absentCount = records.filter((a) => a.status === 'ABSENT').length;

  const onTimeRate =
    total > 0 && total - absentCount > 0
      ? Math.round((onTimeCount / (total - absentCount)) * 100)
      : 100;

  const activeStaffTotal = Math.max(total, 1);
  const accountedFor = presentOnFloor + completedCount;
  const coveragePercent = Math.min(
    100,
    Math.round((accountedFor / activeStaffTotal) * 100)
  );

  return (
    <div className="rounded-xl border border-[#e8eaec] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#f0f1f2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-left transition-opacity duration-200">
      {/* 1. Floor Presence & Roster Coverage */}
      <div className="p-4 sm:p-5">
        <span className="text-[13px] font-medium text-[#5d5f60] block">
          Sales floor presence
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-[#131416] tabular-nums font-mono mt-1 flex items-baseline gap-2">
          <span>{presentOnFloor}</span>
          <span className="text-[13px] font-normal text-[#5d5f60] font-sans">
            staff clocked in
          </span>
        </div>
        <span className="text-xs text-[#5d5f60] mt-1 block">
          <span className="font-mono tabular-nums font-medium text-[#131416]">{coveragePercent}%</span> roster fulfillment (<span className="font-mono tabular-nums">{accountedFor}/{total}</span>)
        </span>
      </div>

      {/* 2. Punctuality Rate */}
      <div className="p-4 sm:p-5">
        <span className="text-[13px] font-medium text-[#5d5f60] block">
          Punctuality compliance
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-[#1e7b4f] tabular-nums font-mono mt-1">
          {onTimeRate}%
        </div>
        <span className="text-xs text-[#5d5f60] mt-1 block">
          <span className="font-mono tabular-nums font-medium text-[#1e7b4f]">{onTimeCount}</span> on-time arrivals
        </span>
      </div>

      {/* 3. Completed Shifts */}
      <div className="p-4 sm:p-5">
        <span className="text-[13px] font-medium text-[#5d5f60] block">
          Completed shifts
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-[#1b6c80] tabular-nums font-mono mt-1 flex items-baseline gap-1.5">
          <span>{completedCount}</span>
          <span className="text-[13px] font-normal text-[#5d5f60] font-sans">
            of {total} shifts
          </span>
        </div>
        <span className="text-xs text-[#5d5f60] mt-1 block">
          Concluded today
        </span>
      </div>

      {/* 4. Exceptions Triage */}
      <div className="p-4 sm:p-5">
        <span className="text-[13px] font-medium text-[#5d5f60] block">
          Exceptions triage
        </span>
        <div className="text-2xl sm:text-3xl font-semibold text-[#131416] tabular-nums font-mono mt-1 flex items-baseline gap-2">
          <span
            className={
              lateCount + absentCount > 0 ? 'text-[#92400e]' : 'text-[#1e7b4f]'
            }
          >
            {lateCount + absentCount}
          </span>
          <span className="text-[13px] font-normal text-[#5d5f60] font-sans">
            flagged
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {lateCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                onSelectStatusFilter?.(
                  activeStatusFilter === 'LATE' ? 'ALL' : 'LATE'
                )
              }
              className="text-[#92400e] hover:underline cursor-pointer"
            >
              <span className="font-mono tabular-nums font-medium">{lateCount}</span> late
            </button>
          ) : (
            <span className="text-[#1e7b4f]"><span className="font-mono tabular-nums font-medium">0</span> late</span>
          )}
          <span className="text-[#cdced1]">·</span>
          {absentCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                onSelectStatusFilter?.(
                  activeStatusFilter === 'ABSENT' ? 'ALL' : 'ABSENT'
                )
              }
              className="text-[#c4242a] hover:underline cursor-pointer"
            >
              <span className="font-mono tabular-nums font-medium">{absentCount}</span> absent
            </button>
          ) : (
            <span className="text-[#5d5f60]"><span className="font-mono tabular-nums font-medium">0</span> absent</span>
          )}
        </div>
      </div>
    </div>
  );
};
