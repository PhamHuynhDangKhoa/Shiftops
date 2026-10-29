import React, { useMemo } from 'react';
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
  const { staffMap, unassignedShiftsByDay } = useMemo(() => {
    const sMap = new Map<
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

    const unassigned: Record<string, Shift[]> = {};
    weekDays.forEach((d) => {
      unassigned[d.isoDate] = [];
    });

    shifts.forEach((shift) => {
      const shiftDate = shift.startTime.slice(0, 10);
      const duration = formatShiftDurationHours(shift.startTime, shift.endTime);

      if (shift.assignments.length === 0) {
        if (unassigned[shiftDate]) {
          unassigned[shiftDate].push(shift);
        } else {
          unassigned[shiftDate] = [shift];
        }
      } else {
        shift.assignments.forEach((asg) => {
          let entry = sMap.get(asg.userId);
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
              roleTitle:
                asg.userRole === 'STAFF' ? 'Shift Associate' : asg.userRole,
              initials,
              shiftsByDay: {},
              totalHours: 0,
            };
            weekDays.forEach((d) => {
              entry!.shiftsByDay[d.isoDate] = [];
            });
            sMap.set(asg.userId, entry);
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

    return { staffMap: sMap, unassignedShiftsByDay: unassigned };
  }, [shifts, weekDays]);

  const allStaffRows = useMemo(
    () =>
      Array.from(staffMap.values()).sort((a, b) =>
        a.userName.localeCompare(b.userName)
      ),
    [staffMap]
  );

  // Group staff into operational tiers (Shift Leadership vs Floor Operations)
  const { leadershipRows, operationsRows } = useMemo(() => {
    const leads = allStaffRows.filter(
      (s) =>
        s.roleTitle.toLowerCase().includes('lead') ||
        s.roleTitle.toLowerCase().includes('supervisor') ||
        s.roleTitle.toLowerCase().includes('manager')
    );
    const ops = allStaffRows.filter((s) => !leads.includes(s));
    return { leadershipRows: leads, operationsRows: ops };
  }, [allStaffRows]);

  const hasUnassigned = Object.values(unassignedShiftsByDay).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] overflow-hidden">
      {/* Scrollable Timeline Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[880px]">
          {/* Header Rows */}
          <thead>
            {/* Primary Day Columns Header */}
            <tr className="border-b border-[#e8eaec] bg-[#f9fbfc]">
              <th className="w-60 py-3 px-4 text-xs font-semibold text-[#5d5f60] sticky left-0 bg-[#f9fbfc] z-20 border-r border-[#e8eaec]">
                Staff member (Planned hours)
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.isoDate}
                  className={`py-2 px-2 text-center text-xs font-normal border-r border-[#f0f1f2] last:border-r-0 ${
                    day.isWeekend ? 'bg-[#f4f6f8]/50' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-[#5d5f60] font-medium">
                      {day.dayLabel}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums px-2 py-0.5 rounded mt-0.5 ${
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

            {/* Floor Coverage Equilibrium Ribbon (Derived from Stitch Variant 2, Anti-Slop Polished) */}
            <tr className="border-b border-[#e8eaec] bg-[#f4f6f8]/70">
              <th className="py-2 px-4 text-[11px] font-semibold text-[#5d5f60] sticky left-0 bg-[#f4f6f8] z-20 border-r border-[#e8eaec]">
                Store floor coverage
              </th>
              {weekDays.map((day) => {
                const unassignedCount =
                  unassignedShiftsByDay[day.isoDate]?.length || 0;
                const assignedCount = allStaffRows.reduce((acc, staff) => {
                  return acc + (staff.shiftsByDay[day.isoDate]?.length || 0);
                }, 0);

                return (
                  <th
                    key={`coverage-${day.isoDate}`}
                    className="py-1.5 px-2 text-center border-r border-[#f0f1f2] last:border-r-0 font-normal"
                  >
                    {unassignedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fffbeb] text-[#92400e] border border-[#92400e]/30 text-[11px] font-mono tabular-nums font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#92400e]" />
                        {unassignedCount} open
                      </span>
                    ) : assignedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#131416] border border-[#e8eaec] text-[11px] font-mono tabular-nums font-medium">
                        {assignedCount} on floor
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#cdced1] font-mono">
                        —
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0f1f2] text-xs">
            {/* Unassigned Shifts Row (Priority Operational Queue) */}
            {!isStaff && hasUnassigned && (
              <tr className="bg-[#fffbeb]/40">
                <td className="py-2.5 px-4 font-medium text-[#92400e] sticky left-0 bg-[#fffbeb] z-10 border-r border-[#e8eaec]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#92400e]" />
                    <span className="text-xs font-semibold">
                      Unassigned Slots
                    </span>
                  </div>
                  <span className="text-[11px] text-[#92400e]/80 block">
                    Immediate manager action required
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
                          className="w-full text-left p-1.5 rounded border border-dashed border-[#92400e]/70 bg-[#fffbeb] text-[#92400e] text-[11px] font-medium hover:border-[#92400e] hover:bg-[#fef3c7]/60 transition-colors cursor-pointer mb-1 block select-none"
                        >
                          <div className="font-semibold truncate text-[#92400e]">
                            {shift.name || 'Open Shift'}
                          </div>
                          <div className="font-mono text-[11px] tabular-nums text-[#92400e]/90">
                            {formatTimeShort(shift.startTime)}–
                            {formatTimeShort(shift.endTime)}
                          </div>
                          <div className="text-[11px] text-[#c4242a] font-semibold mt-0.5 flex items-center gap-1">
                            <span>+</span>
                            <span>Assign staff</span>
                          </div>
                        </button>
                      ))}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Team Tier 1: Shift Leadership & Floor Leads */}
            {leadershipRows.length > 0 && (
              <>
                <tr className="bg-[#f4f6f8]/80 border-y border-[#e8eaec]">
                  <td
                    colSpan={8}
                    className="py-1.5 px-4 text-[11px] font-semibold text-[#5d5f60] sticky left-0 bg-[#f4f6f8] z-10"
                  >
                    Shift Leadership & Floor Leads ({leadershipRows.length} staff)
                  </td>
                </tr>
                {leadershipRows.map((staff) => renderStaffRow(staff))}
              </>
            )}

            {/* Team Tier 2: Store Operations & Service Team */}
            {operationsRows.length > 0 && (
              <>
                <tr className="bg-[#f4f6f8]/80 border-y border-[#e8eaec]">
                  <td
                    colSpan={8}
                    className="py-1.5 px-4 text-[11px] font-semibold text-[#5d5f60] sticky left-0 bg-[#f4f6f8] z-10"
                  >
                    Store Operations & Service Team ({operationsRows.length} staff)
                  </td>
                </tr>
                {operationsRows.map((staff) => renderStaffRow(staff))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Roster Operational Legend */}
      <div className="p-3 border-t border-[#e8eaec] bg-[#f9fbfc] flex items-center justify-between gap-4 flex-wrap text-xs text-[#5d5f60]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#e9f4f7] border border-[#1b6c80]/40" />
            <span className="text-[11px] text-[#131416] font-medium">
              Published shift
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#fffbeb] border border-dashed border-[#92400e]/60" />
            <span className="text-[11px] text-[#131416] font-medium">
              Draft (Unpublished)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#f4f6f8] border border-[#e8eaec]" />
            <span className="text-[11px] text-[#131416] font-medium">
              Concluded
            </span>
          </div>
        </div>
        <div className="text-[11px] text-[#5d5f60] font-mono tabular-nums">
          Click any shift bar to inspect details, breaks, or reassign associate.
        </div>
      </div>
    </div>
  );

  function renderStaffRow(staff: {
    userId: string;
    userName: string;
    roleTitle: string;
    initials: string;
    shiftsByDay: Record<string, Shift[]>;
    totalHours: number;
  }) {
    return (
      <tr
        key={staff.userId}
        className="hover:bg-[#f9fbfc]/60 transition-colors"
      >
        {/* Pinned Left Staff Info Column */}
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
                {Math.round(staff.totalHours * 10) / 10}h scheduled · {staff.roleTitle}
              </span>
            </div>
          </div>
        </td>

        {/* 7 Calendar Days Columns */}
        {weekDays.map((day) => {
          const dayShifts = staff.shiftsByDay[day.isoDate] || [];
          return (
            <td
              key={day.isoDate}
              className={`py-1.5 px-1.5 border-r border-[#f0f1f2] last:border-r-0 align-top ${
                day.isWeekend ? 'bg-[#f4f6f8]/20' : ''
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
                      title={`${shift.name}: Click to inspect shift`}
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
                        {formatTimeShort(shift.startTime)}–
                        {formatTimeShort(shift.endTime)}
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-0.5">
                        <span className="font-medium text-[11px] tracking-tight">
                          {isDraft
                            ? 'Draft'
                            : isCompleted
                            ? 'Completed'
                            : 'Published'}
                        </span>
                        <span className="tabular-nums font-mono text-[11px]">
                          {formatShiftDurationHours(
                            shift.startTime,
                            shift.endTime
                          )}
                          h
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
    );
  }
};
