import React from 'react';
import { Link } from 'react-router-dom';
import { Attendance } from '../../lib/types';
import { IconUsers, IconArrowUpRight } from '../ui/Icons';

export interface ManagerFloorRosterCardProps {
  branchAttendance?: Attendance[];
}

export const ManagerFloorRosterCard: React.FC<ManagerFloorRosterCardProps> = ({
  branchAttendance,
}) => {
  return (
    <div className="p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <h3 className="text-sm font-bold text-[#131416] flex items-center gap-2">
          <IconUsers size={16} />
          <span>Active Floor Coverage Roster</span>
        </h3>
        <Link
          to="/attendance"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Attendance Log</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>

      {!branchAttendance || branchAttendance.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#5d5f60]">
          No attendance punches recorded yet today.
        </div>
      ) : (
        <div className="divide-y divide-[#f0f1f2]">
          {branchAttendance.slice(0, 6).map((att) => (
            <div
              key={att.id}
              className="py-2.5 flex items-center justify-between text-xs hover:bg-[#f4f6f8] px-1 rounded transition-colors"
            >
              <div>
                <span className="font-semibold text-[#131416] block">
                  {att.userName}
                </span>
                <span className="text-[11px] text-[#5d5f60] tabular-nums">
                  {att.shiftName || 'Floor Shift'} · In:{' '}
                  {att.checkInAt
                    ? new Date(att.checkInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight tabular-nums ${
                  att.status === 'COMPLETED'
                    ? 'bg-[#ebedee] text-[#5d5f60]'
                    : att.status === 'LATE'
                    ? 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20'
                    : 'bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20'
                }`}
              >
                {att.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
