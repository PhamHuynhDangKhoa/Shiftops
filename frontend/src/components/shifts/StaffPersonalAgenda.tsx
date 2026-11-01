import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shift, ShiftAssignment } from '../../lib/types';
import { DayColumn, formatShiftDurationHours } from './shiftRosterUtils';
import { ShiftStatusBadge } from './ShiftStatusBadge';

export interface StaffPersonalAgendaProps {
  weekDays: DayColumn[];
  myShifts: Shift[];
  allWeekShifts: Shift[];
  currentUserId?: string;
  onSelectShift?: (shift: Shift) => void;
}

export const StaffPersonalAgenda: React.FC<StaffPersonalAgendaProps> = ({
  weekDays,
  myShifts,
  allWeekShifts,
  currentUserId = 'u-staff-1',
  onSelectShift,
}) => {
  // Find which day is selected for the desktop detail view (default to today, or first day with shift, or Monday)
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDayIso, setSelectedDayIso] = useState<string>(() => {
    const todayMatch = weekDays.find((d) => d.isoDate === todayIso);
    if (todayMatch) return todayMatch.isoDate;
    const firstShiftDay = weekDays.find((d) =>
      myShifts.some((s) => s.startTime.startsWith(d.isoDate))
    );
    return firstShiftDay ? firstShiftDay.isoDate : weekDays[0]!.isoDate;
  });

  const selectedDay = weekDays.find((d) => d.isoDate === selectedDayIso) || weekDays[0]!;
  const selectedShift = myShifts.find((s) => s.startTime.startsWith(selectedDay.isoDate));

  // Colleagues working on the selected day across all shifts
  const selectedDayShifts = allWeekShifts.filter((s) =>
    s.startTime.startsWith(selectedDay.isoDate)
  );

  const selectedDayColleagues = (() => {
    const map = new Map<string, ShiftAssignment & { shiftName?: string }>();
    selectedDayShifts.forEach((shift) => {
      shift.assignments.forEach((asg) => {
        if (asg.userId !== currentUserId && !map.has(asg.userId)) {
          map.set(asg.userId, { ...asg, shiftName: shift.name });
        }
      });
    });
    return Array.from(map.values());
  })();

  const extractStation = (notes?: string) => {
    if (!notes) return 'Espresso Bar 1';
    const match = notes.match(/Station:\s*([^·]+)/);
    return match ? match[1]!.trim() : 'Espresso Bar 1';
  };

  return (
    <div className="space-y-4">
      {/* 1. Ergonomic 7-Day Week Navigation Ribbon (Mobile & Desktop) */}
      <div className="bg-white rounded-xl p-2 sm:p-2.5 shadow-xs">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const hasShift = myShifts.some((s) => s.startTime.startsWith(day.isoDate));
            const isSelected = day.isoDate === selectedDayIso;
            const shiftForDay = myShifts.find((s) => s.startTime.startsWith(day.isoDate));
            const duration = shiftForDay
              ? formatShiftDurationHours(shiftForDay.startTime, shiftForDay.endTime)
              : null;

            return (
              <button
                key={day.isoDate}
                type="button"
                onClick={() => setSelectedDayIso(day.isoDate)}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-[#131416] text-white shadow-xs'
                    : hasShift
                    ? 'bg-[#f4f5f7] text-[#131416] hover:bg-[#ebedee]'
                    : 'bg-transparent text-[#5d5f60] hover:bg-[#f4f5f7]'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white/80' : 'text-[#5d5f60]'
                  }`}
                >
                  {day.dayLabel}
                </span>

                <span
                  className={`text-sm sm:text-base font-semibold font-mono tabular-nums my-0.5 ${
                    isSelected
                      ? 'text-white'
                      : day.isToday
                      ? 'text-[#131416] font-bold underline underline-offset-2'
                      : 'text-[#131416]'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {hasShift ? (
                  <span
                    className={`text-[11px] font-mono tabular-nums font-semibold px-1 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#131416] text-white'
                    }`}
                  >
                    {duration}h
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-white/70' : 'text-[#64748b]'
                    }`}
                  >
                    OFF
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Responsive Dual-Pane View:
             - On Mobile (<1024px): Full vertical day-by-day agenda list
             - On Desktop (>=1024px): Split operational workbench (7-Day List left + Active Day Console right)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column / Mobile Agenda List */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#131416]">
              Weekly Agenda Schedule
            </h2>
            <span className="text-[13px] text-[#5d5f60] font-medium font-mono tabular-nums">
              {myShifts.length} of 7 days on duty
            </span>
          </div>

          <div className="space-y-2.5">
            {weekDays.map((day) => {
              const shift = myShifts.find((s) => s.startTime.startsWith(day.isoDate));
              const isSelected = day.isoDate === selectedDayIso;
              const station = shift ? extractStation(shift.notes) : null;
              const duration = shift
                ? formatShiftDurationHours(shift.startTime, shift.endTime)
                : 0;

              return (
                <div
                  key={day.isoDate}
                  onClick={() => setSelectedDayIso(day.isoDate)}
                  className={`rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-[#131416] shadow-xs'
                      : 'bg-white hover:bg-[#fafbfc] border border-transparent shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#131416]">
                        {day.dayLabel}, {day.monthLabel} {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#131416] text-white">
                          Today
                        </span>
                      )}
                    </div>

                    {shift ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#131416] text-white font-mono tabular-nums">
                        {duration} hrs
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[13px] font-semibold bg-[#f1f5f9] text-[#1e293b]">
                        Scheduled Off
                      </span>
                    )}
                  </div>

                  {shift ? (
                    <div className="mt-3 pt-3 border-t border-[#f0f1f2] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#131416]">
                            {shift.name || 'Floor Operations'}
                          </span>
                          <ShiftStatusBadge status={shift.status} size="sm" />
                        </div>
                        <span className="text-[13px] font-semibold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#131416]">
                          {station}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[13px] text-[#5d5f60] font-mono tabular-nums">
                        <span>
                          {new Date(shift.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          –{' '}
                          {new Date(shift.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-xs text-[#131416] font-sans font-medium">
                          {shift.branchName}
                        </span>
                      </div>

                      {/* On Mobile: Quick peer hint */}
                      <div className="lg:hidden pt-1 text-[11px] text-[#5d5f60] flex items-center justify-between">
                        <span>Tap to view floor teammates & details</span>
                        <span className="font-semibold text-[#131416]">Inspect →</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[13px] text-[#334155] font-medium">
                      Rest day · No operational duties scheduled
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column / Desktop Duty Inspector Console */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#131416]">
              Operational Duty Details
            </h2>
            <span className="text-[13px] text-[#5d5f60] font-medium font-mono tabular-nums">
              {selectedDay.dayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber},{' '}
              {selectedDay.date.getFullYear()}
            </span>
          </div>

          {selectedShift ? (
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
              {/* Shift Header & Timing */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[#f0f1f2]">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[13px] font-semibold bg-[#f1f5f9] text-[#131416]">
                      {extractStation(selectedShift.notes)}
                    </span>
                    <ShiftStatusBadge status={selectedShift.status} size="sm" />
                    {selectedDay.isToday && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#131416] text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#131416] tracking-tight">
                    {selectedShift.name || 'Floor Shift'}
                  </h3>
                  <p className="text-[13px] text-[#5d5f60] mt-1">
                    {selectedShift.branchName} · Weekly Roster Cycle
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#131416] tracking-tight">
                    {new Date(selectedShift.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(selectedShift.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[13px] text-[#5d5f60] font-mono tabular-nums mt-0.5">
                    {formatShiftDurationHours(
                      selectedShift.startTime,
                      selectedShift.endTime
                    )}{' '}
                    hours planned
                  </div>
                </div>
              </div>

              {/* Station Directives / Operational Notes */}
              <div>
                <h4 className="text-xs font-bold text-[#131416] mb-2">
                  Shift Directives & Station Notes
                </h4>
                <div className="p-3.5 bg-[#f8fafc] rounded-lg text-[13px] leading-relaxed text-[#131416]">
                  {selectedShift.notes ||
                    'Standard operational opening, prep checklists, and customer floor coverage.'}
                </div>
              </div>

              {/* Teammates On Duty During This Shift */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-[#131416]">
                    Floor Colleagues on Duty ({selectedDayColleagues.length})
                  </h4>
                  <span className="text-[11px] text-[#5d5f60]">
                    Same day roster alignment
                  </span>
                </div>

                {selectedDayColleagues.length > 0 ? (
                  <div className="divide-y divide-[#f0f1f2] border border-[#f0f1f2] rounded-lg overflow-hidden">
                    {selectedDayColleagues.map((colleague) => (
                      <div
                        key={colleague.userId}
                        className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-[#fafbfc]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#131416] text-white flex items-center justify-center text-xs font-semibold">
                            {colleague.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-[#131416]">
                              {colleague.userName}
                            </div>
                            <div className="text-[11px] text-[#5d5f60]">
                              {colleague.shiftName || 'Floor Shift'}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#131416]">
                          {colleague.userRole === 'MANAGER'
                            ? 'Supervisor'
                            : 'Floor Staff'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#f8fafc] rounded-lg text-[13px] text-[#334155]">
                    Solo coverage or no other staff scheduled for this window.
                  </div>
                )}
              </div>

              {/* Action Deck */}
              <div className="pt-4 border-t border-[#f0f1f2] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {onSelectShift && (
                    <button
                      type="button"
                      onClick={() => onSelectShift(selectedShift)}
                      className="px-3 py-1.5 rounded-lg border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f5f7] cursor-pointer"
                    >
                      View Shift Record
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/attendance"
                    className="px-4 py-2 rounded-lg bg-[#131416] text-white text-xs font-semibold hover:bg-[#2a2f33] transition-colors cursor-pointer"
                  >
                    Go to Time Clock →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#f1f5f9] text-[#334155] flex items-center justify-center mx-auto text-lg font-bold">
                OFF
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#131416]">
                  Scheduled Off · Rest Day
                </h3>
                <p className="text-xs text-[#475569] max-w-sm mx-auto mt-1">
                  You have no operational duties scheduled at {weekDays[0]?.monthLabel}{' '}
                  {selectedDay.dayNumber} for Shibuya Flagship.
                </p>
              </div>
              <div className="pt-2 text-[13px] text-[#5d5f60] font-mono tabular-nums">
                Enjoy your rest day!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
