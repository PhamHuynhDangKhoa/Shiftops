import React from 'react';
import { Attendance, Task } from '../../lib/types';

export interface ManagerTelemetryTilesProps {
  branchAttendance?: Attendance[];
  branchTasks?: Task[];
  activeIncidentsCount: number;
}

export const ManagerTelemetryTiles: React.FC<ManagerTelemetryTilesProps> = ({
  branchAttendance,
  branchTasks,
  activeIncidentsCount,
}) => {
  const scheduledCount = branchAttendance?.length || 8;
  const onFloorCount = branchAttendance
    ? branchAttendance.filter(
        (a) => (a.status === 'PRESENT' || a.status === 'LATE') && !a.checkOutAt
      ).length
    : 6;

  const lateCount = branchAttendance
    ? branchAttendance.filter((a) => a.late).length
    : 1;

  const completedTasks = branchTasks
    ? branchTasks.filter((t) => t.status === 'COMPLETED').length
    : 9;
  const totalTasks = branchTasks ? branchTasks.length : 12;
  const checklistPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#f0f1f2] bg-white rounded-lg border border-[#e8eaec]">
      {/* Metric 1: Headcount On Floor */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          On floor now
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] font-mono tabular-nums my-1">
          {onFloorCount}
        </div>
        <span className="text-xs text-[#5d5f60]">
          {onFloorCount} of {scheduledCount} scheduled
        </span>
      </div>

      {/* Metric 2: Punctuality / Late Punches */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Late punches
        </span>
        <div
          className={`text-2xl sm:text-3xl font-normal font-mono tabular-nums my-1 ${
            lateCount > 0 ? 'text-[#92400e]' : 'text-[#131416]'
          }`}
        >
          {lateCount}
        </div>
        <span className="text-xs text-[#5d5f60]">
          {lateCount > 0 ? 'Past scheduled shift start' : 'Zero late arrivals today'}
        </span>
      </div>

      {/* Metric 3: Routine Tasks Completion */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Store routines
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] font-mono tabular-nums my-1">
          {checklistPercent}%
        </div>
        <span className="text-xs text-[#5d5f60] tabular-nums">
          {completedTasks} of {totalTasks} tasks done
        </span>
      </div>

      {/* Metric 4: Incident Radar */}
      <div className="p-4 flex flex-col justify-between">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Active incidents
        </span>
        <div
          className={`text-2xl sm:text-3xl font-normal font-mono tabular-nums my-1 ${
            activeIncidentsCount > 0 ? 'text-[#c4242a]' : 'text-[#131416]'
          }`}
        >
          {activeIncidentsCount}
        </div>
        <span className="text-xs text-[#5d5f60]">
          {activeIncidentsCount > 0
            ? 'Require floor resolution'
            : 'All store equipment nominal'}
        </span>
      </div>
    </div>
  );
};
