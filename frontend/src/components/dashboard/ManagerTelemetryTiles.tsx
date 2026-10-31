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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Headcount On Floor */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-[#5d5f60]">
          Floor Presence
        </span>
        <div className="text-3xl font-bold font-sans tracking-tight text-[#131416] tabular-nums my-1.5">
          {onFloorCount}
        </div>
        <span className="text-xs text-[#64748b]">
          {onFloorCount} of {scheduledCount} scheduled active
        </span>
      </div>

      {/* Metric 2: Punctuality */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-[#5d5f60]">
          Punctuality
        </span>
        <div
          className={`text-3xl font-bold font-sans tracking-tight tabular-nums my-1.5 ${
            lateCount > 0 ? 'text-[#b45309]' : 'text-[#131416]'
          }`}
        >
          {lateCount}
        </div>
        <span className="text-xs text-[#64748b]">
          {lateCount > 0 ? '1 staff late (+14m arrival)' : 'Zero late arrivals today'}
        </span>
      </div>

      {/* Metric 3: Routine Tasks Completion */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-[#5d5f60]">
          Routine Progress
        </span>
        <div className="text-3xl font-bold font-sans tracking-tight text-[#131416] tabular-nums my-1.5">
          {checklistPercent}%
        </div>
        <span className="text-xs text-[#64748b] tabular-nums">
          {completedTasks} of {totalTasks} checklist items done
        </span>
      </div>

      {/* Metric 4: Incident Radar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-semibold text-[#5d5f60]">
          Active Incidents
        </span>
        <div
          className={`text-3xl font-bold font-sans tracking-tight tabular-nums my-1.5 ${
            activeIncidentsCount > 0 ? 'text-[#c4242a]' : 'text-[#131416]'
          }`}
        >
          {activeIncidentsCount}
        </div>
        <span className="text-xs text-[#64748b]">
          {activeIncidentsCount > 0
            ? 'Walk-in chiller temp alarm'
            : 'All store equipment nominal'}
        </span>
      </div>
    </div>
  );
};
