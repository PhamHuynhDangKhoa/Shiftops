import React from 'react';
import { Attendance, Task } from '../../lib/types';
import { IconCheckList, IconAlertTriangle } from '../ui/Icons';

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
  const onFloorCount = branchAttendance
    ? branchAttendance.filter(
        (a) => (a.status === 'PRESENT' || a.status === 'LATE') && !a.checkOutAt
      ).length
    : 0;

  const lateCount = branchAttendance
    ? branchAttendance.filter((a) => a.late).length
    : 0;

  const completedTasks = branchTasks
    ? branchTasks.filter((t) => t.status === 'COMPLETED').length
    : 0;
  const totalTasks = branchTasks?.length || 0;
  const checklistPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* Tile 1: Present Staff */}
      <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e8eaec] border-l-3 border-l-[#1e7b4f] flex flex-col justify-between">
        <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
          On Floor Now
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] tabular-nums mt-2">
          {onFloorCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-1">Clocked in staff</span>
      </div>

      {/* Tile 2: Punctuality / Late Count */}
      <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e8eaec] border-l-3 border-l-[#92400e] flex flex-col justify-between">
        <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#92400e]" />
          Late Punches
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#92400e] tabular-nums mt-2">
          {lateCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-1">Past scheduled start</span>
      </div>

      {/* Tile 3: Routine Tasks Completion */}
      <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e8eaec] border-l-3 border-l-[#1b6c80] flex flex-col justify-between">
        <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
          <IconCheckList size={14} className="text-[#1b6c80]" />
          Checklist Progress
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#131416] tabular-nums mt-2">
          {checklistPercent}%
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-1 tabular-nums">
          {completedTasks}/{totalTasks} tasks done
        </span>
      </div>

      {/* Tile 4: Incident Radar */}
      <div className="p-4 rounded-xl bg-[#ffffff] border border-[#e8eaec] border-l-3 border-l-[#c4242a] flex flex-col justify-between">
        <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
          <IconAlertTriangle size={14} className="text-[#c4242a]" />
          Active Incidents
        </span>
        <div className="text-2xl sm:text-3xl font-normal text-[#c4242a] tabular-nums mt-2">
          {activeIncidentsCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] mt-1">Require resolution</span>
      </div>
    </div>
  );
};
