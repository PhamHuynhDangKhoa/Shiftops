import React from 'react';
import { Attendance } from '../../lib/types';

interface AttendanceTelemetryStripProps {
  records: Attendance[];
}

export const AttendanceTelemetryStrip: React.FC<AttendanceTelemetryStripProps> = ({
  records,
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

  return (
    <div className="rounded-xl border border-[#e8eaec] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#f0f1f2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-left mb-5">
      {/* 1. Total Shifts Logged */}
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-semibold text-[#5d5f60] block tracking-normal">
          Total punches recorded
        </span>
        <div className="text-xl sm:text-2xl font-semibold text-[#131416] tabular-nums font-mono mt-0.5">
          {total}
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-0.5 block font-mono">
          {completedCount} shifts completed today
        </span>
      </div>

      {/* 2. On Floor Right Now */}
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-semibold text-[#5d5f60] block tracking-normal">
          Active on sales floor
        </span>
        <div className="text-xl sm:text-2xl font-semibold text-[#1b6c80] tabular-nums font-mono mt-0.5 flex items-center gap-2">
          <span>{presentOnFloor}</span>
          <span className="text-xs font-normal text-[#1b6c80] font-sans">
            staff clocked in
          </span>
        </div>
        <span className="text-[11px] text-[#1b6c80] mt-0.5 block font-mono">
          Live floor coverage
        </span>
      </div>

      {/* 3. On-Time Compliance Rate */}
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-semibold text-[#5d5f60] block tracking-normal">
          Punctuality compliance
        </span>
        <div className="text-xl sm:text-2xl font-semibold text-[#1e7b4f] tabular-nums font-mono mt-0.5">
          {onTimeRate}%
        </div>
        <span className="text-[11px] text-[#1e7b4f] mt-0.5 block font-mono">
          {onTimeCount} on-time arrivals
        </span>
      </div>

      {/* 4. Late Arrivals */}
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-semibold text-[#5d5f60] block tracking-normal">
          Late arrivals
        </span>
        <div className="text-xl sm:text-2xl font-semibold text-[#92400e] tabular-nums font-mono mt-0.5">
          {lateCount}
        </div>
        <span className="text-[11px] text-[#92400e] mt-0.5 block font-mono">
          {lateCount > 0 ? 'Punctuality alerts logged' : 'Zero transit delays'}
        </span>
      </div>

      {/* 5. Absences Logged */}
      <div className="p-3.5 sm:p-4">
        <span className="text-[11px] font-semibold text-[#5d5f60] block tracking-normal">
          Logged absences
        </span>
        <div
          className={`text-xl sm:text-2xl font-semibold tabular-nums font-mono mt-0.5 ${
            absentCount > 0 ? 'text-[#c4242a]' : 'text-[#5d5f60]'
          }`}
        >
          {absentCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-0.5 block font-mono">
          {absentCount > 0 ? 'Cover shifts reallocated' : 'Full shift attendance'}
        </span>
      </div>
    </div>
  );
};
