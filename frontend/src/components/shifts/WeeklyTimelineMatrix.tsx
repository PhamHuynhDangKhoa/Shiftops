import React from 'react';
import { Shift } from '../../lib/types';
import {
  DayColumn,
  formatShiftDurationHours,
  formatTimeShort,
} from './shiftRosterUtils';

interface WeeklyTimelineMatrixProps {
  weekDays: DayColumn[];
  shifts: Shift[];
  isStaff: boolean;
  onSelectShift: (shift: Shift) => void;
  onQuickCreateShift: (dateIso: string) => void;
}

export const WeeklyTimelineMatrix: React.FC<WeeklyTimelineMatrixProps> = ({
  weekDays,
  shifts,
  isStaff,
  onSelectShift,
  onQuickCreateShift,
}) => {
  // Aggregate shifts by staff member and by day
  const staffMap = new Map<
    string,
    {
      userId: string;
      userName: string;
      roleTitle: string;
      initials: string;
      shiftsByDay: Record<string, Shift[]>;
      totalHours: number;
    }
  >();

  const unassignedShiftsByDay: Record<string, Shift[]> = {};
  weekDays.forEach((d) => {
    unassignedShiftsByDay[d.isoDate] = [];
  });

  shifts.forEach((shift) => {
    const shiftDate = shift.startTime.slice(0, 10);
    const duration = formatShiftDurationHours(shift.startTime, shift.endTime);

    if (shift.assignments.length === 0) {
      if (unassignedShiftsByDay[shiftDate]) {
        unassignedShiftsByDay[shiftDate].push(shift);
      } else {
        unassignedShiftsByDay[shiftDate] = [shift];
      }
    } else {
      shift.assignments.forEach((asg) => {
        let entry = staffMap.get(asg.userId);
        if (!entry) {
          const initials = asg.userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          entry = {
            userId: asg.userId,
            userName: asg.userName,
            roleTitle: asg.userRole === 'STAFF' ? 'Shift Associate' : asg.userRole,
            initials,
            shiftsByDay: {},
            totalHours: 0,
          };
          weekDays.forEach((d) => {
            entry!.shiftsByDay[d.isoDate] = [];
          });
          staffMap.set(asg.userId, entry);
        }

        entry.totalHours += duration;
        if (entry.shiftsByDay[shiftDate]) {
          entry.shiftsByDay[shiftDate].push(shift);
        } else {
          entry.shiftsByDay[shiftDate] = [shift];
        }
      });
    }
  });

  const staffRows = Array.from(staffMap.values()).sort((a, b) =>
    a.userName.localeCompare(b.userName)
  );

  const hasUnassigned = Object.values(unassignedShiftsByDay).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] overflow-hidden">
      {/* Scrollable Timeline Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[840px]">
          {/* Header Row: Days of Week */}
          <thead>
            <tr className="border-b border-[#e8eaec] bg-[#f9fbfc]">
              <th className="w-52 py-3 px-4 text-xs font-semibold text-[#5d5f60] sticky left-0 bg-[#f9fbfc] z-10 border-r border-[#e8eaec]">
                Staff member (Hours)
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.isoDate}
                  className={`py-2 px-2 text-center text-xs font-normal border-r border-[#f0f1f2] last:border-r-0 ${
                    day.isWeekend ? 'bg-[#f4f6f8]/40' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-[#5d5f60] uppercase">
                      {day.dayLabel}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        day.isToday
                          ? 'bg-[#131416] text-white font-bold'
                          : 'text-[#131416]'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0f1f2] text-xs">
            {/* Unassigned Shifts Row (Priority Attention for Managers) */}
            {!isStaff && hasUnassigned && (
              <tr className="bg-[#fffbeb]/40">
                <td className="py-2.5 px-4 font-medium text-[#92400e] sticky left-0 bg-[#fffbeb] z-10 border-r border-[#e8eaec]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#92400e]" />
                    <span className="text-xs font-semibold">Unassigned Slots</span>
                  </div>
                  <span className="text-[11px] text-[#92400e]/80">
                    Require assignment
                  </span>
                </td>
                {weekDays.map((day) => {
                  const dayShifts = unassignedShiftsByDay[day.isoDate] || [];
                  return (
                    <td
                      key={day.isoDate}
                      className="py-1.5 px-1.5 border-r border-[#f0f1f2] last:border-r-0 align-top text-center"
                    >
                      {dayShifts.map((shift) => (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => onSelectShift(shift)}
                          title={`${shift.name}: Click to assign staff`}
                          className="w-full text-left p-1.5 rounded border border-dashed border-[#92400e]/60 bg-[#fffbeb] text-[#92400e] text-[11px] font-medium hover:border-[#92400e] transition-colors cursor-pointer mb-1 block"
                        >
                          <div className="font-semibold truncate">
                            {shift.name || 'Open Shift'}
                          </div>
                          <div className="font-mono text-[11px] tabular-nums">
                            {formatTimeShort(shift.startTime)}–{formatTimeShort(shift.endTime)}
                          </div>
                          <div className="text-[11px] text-[#c4242a] font-bold mt-0.5">
                            + Assign Staff
                          </div>
                        </button>
                      ))}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Staff Rows */}
            {staffRows.map((staff) => (
              <tr key={staff.userId} className="hover:bg-[#f9fbfc]/60 transition-colors">
                {/* Staff Identity Column */}
                <td className="py-2.5 px-4 sticky left-0 bg-white hover:bg-[#f9fbfc] z-10 border-r border-[#e8eaec]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#f4f6f8] border border-[#cdced1] flex items-center justify-center text-[11px] font-semibold text-[#131416] shrink-0">
                      {staff.initials}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-[#131416] block truncate">
                        {staff.userName}
                      </span>
                      <span className="text-[11px] text-[#5d5f60] font-mono tabular-nums">
                        {Math.round(staff.totalHours * 10) / 10}h scheduled
                      </span>
                    </div>
                  </div>
                </td>

                {/* 7 Days Columns */}
                {weekDays.map((day) => {
                  const dayShifts = staff.shiftsByDay[day.isoDate] || [];
                  const isWeekend = day.isWeekend;

                  return (
                    <td
                      key={day.isoDate}
                      className={`py-1.5 px-1.5 border-r border-[#f0f1f2] last:border-r-0 align-top ${
                        isWeekend ? 'bg-[#f4f6f8]/20' : ''
                      }`}
                    >
                      {dayShifts.length > 0 ? (
                        dayShifts.map((shift) => {
                          const isDraft = shift.status === 'DRAFT';
                          const isCompleted = shift.status === 'COMPLETED';

                          return (
                            <button
                              key={shift.id}
                              type="button"
                              onClick={() => onSelectShift(shift)}
                              title={`${shift.name}: Click to view shift actions`}
                              className={`w-full text-left p-1.5 rounded transition-colors cursor-pointer mb-1 block select-none ${
                                isDraft
                                  ? 'bg-[#fffbeb] border border-dashed border-[#92400e]/50 text-[#92400e] hover:border-[#92400e]'
                                  : isCompleted
                                  ? 'bg-[#f4f6f8] border border-[#e8eaec] text-[#5d5f60] hover:border-[#cdced1]'
                                  : 'bg-[#e9f4f7] border border-[#1b6c80]/30 text-[#1b6c80] hover:border-[#1b6c80]'
                              }`}
                            >
                              <div className="font-semibold text-[11px] truncate leading-tight">
                                {shift.name || 'Floor Shift'}
                              </div>
                              <div className="font-mono text-[11px] tabular-nums mt-0.5">
                                {formatTimeShort(shift.startTime)}–{formatTimeShort(shift.endTime)}
                              </div>
                              <div className="flex items-center justify-between text-[11px] mt-0.5">
                                <span className="uppercase font-medium text-[11px] tracking-tight">
                                  {shift.status}
                                </span>
                                <span className="tabular-nums font-mono text-[11px]">
                                  {formatShiftDurationHours(shift.startTime, shift.endTime)}h
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div
                          onClick={() => !isStaff && onQuickCreateShift(day.isoDate)}
                          className={`h-14 rounded border border-transparent flex items-center justify-center text-[#cdced1] transition-colors ${
                            !isStaff
                              ? 'hover:border-dashed hover:border-[#cdced1] hover:bg-[#f9fbfc] cursor-pointer'
                              : ''
                          }`}
                        >
                          <span className="text-xs text-[#cdced1] opacity-60">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roster Legend */}
      <div className="p-3 border-t border-[#e8eaec] bg-[#f9fbfc] flex items-center justify-between gap-4 flex-wrap text-xs text-[#5d5f60]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#e9f4f7] border border-[#1b6c80]/40" />
            <span>Published Shift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#fffbeb] border border-dashed border-[#92400e]/60" />
            <span>Draft (Unpublished)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#f4f6f8] border border-[#e8eaec]" />
            <span>Completed</span>
          </div>
        </div>
        <div className="text-[11px] text-[#5d5f60]">
          Click any shift bar to inspect, publish, reassign, or cancel.
        </div>
      </div>
    </div>
  );
};
