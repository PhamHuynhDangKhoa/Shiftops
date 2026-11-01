import React from 'react';
import { Link } from 'react-router-dom';
import { Shift } from '../../lib/types';
import { formatShiftDurationHours } from './shiftRosterUtils';

export interface StaffPersonalTelemetryProps {
  myShifts: Shift[];
  allWeekShifts?: Shift[];
  userName?: string;
  branchName?: string;
}

export const StaffPersonalTelemetry: React.FC<StaffPersonalTelemetryProps> = ({
  myShifts,
  userName = 'Jordan Kim',
  branchName = 'Shibuya Flagship',
}) => {
  const totalHours = Math.round(
    myShifts.reduce((acc, s) => acc + formatShiftDurationHours(s.startTime, s.endTime), 0) * 10
  ) / 10;

  const totalShifts = myShifts.length;
  const daysOff = Math.max(0, 7 - totalShifts);

  // Find next shift relative to now
  const now = new Date();
  const sortedUpcoming = [...myShifts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const activeOrNextShift =
    sortedUpcoming.find((s) => new Date(s.endTime) >= now) || sortedUpcoming[0];

  const nextShiftLabel = (() => {
    if (!activeOrNextShift) return 'None scheduled';
    const start = new Date(activeOrNextShift.startTime);
    const end = new Date(activeOrNextShift.endTime);
    const isToday = start.toDateString() === now.toDateString();
    const isTomorrow =
      start.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const dayPrefix = isToday
      ? 'Today'
      : isTomorrow
      ? 'Tomorrow'
      : start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const timeRange = `${start.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return { dayPrefix, timeRange, name: activeOrNextShift.name || 'Floor Shift' };
  })();

  const extractStation = (notes?: string) => {
    if (!notes) return 'Espresso Bar 1';
    const match = notes.match(/Station:\s*([^·]+)/);
    return match ? match[1]!.trim() : 'Espresso Bar 1';
  };

  const currentStation = extractStation(activeOrNextShift?.notes);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:gap-3 lg:gap-4 bg-transparent">
      {/* 1. Weekly Scheduled Hours */}
      <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Weekly Scheduled Hours
        </span>
        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-semibold text-[#131416] font-mono tabular-nums tracking-tight">
            {totalHours}
          </span>
          <span className="text-xs font-medium text-[#5d5f60]">hours</span>
        </div>
        <span className="text-[13px] text-[#5d5f60] tabular-nums font-medium">
          {totalShifts} shifts · {daysOff} rest days
        </span>
      </div>

      {/* 2. Next Duty Window */}
      <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Next Scheduled Duty
        </span>
        <div className="my-1.5">
          {typeof nextShiftLabel === 'string' ? (
            <span className="text-lg font-semibold text-[#131416]">{nextShiftLabel}</span>
          ) : (
            <div>
              <div className="text-base sm:text-lg font-semibold text-[#131416] tracking-tight">
                {nextShiftLabel.dayPrefix}
              </div>
              <div className="text-xs font-mono tabular-nums text-[#5d5f60] font-medium mt-0.5">
                {nextShiftLabel.timeRange}
              </div>
            </div>
          )}
        </div>
        <span className="text-[13px] text-[#131416] font-medium truncate">
          {activeOrNextShift?.name || 'Opening Shift'} · {currentStation}
        </span>
      </div>

      {/* 3. Primary Station Assignment */}
      <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <span className="text-[13px] font-medium text-[#5d5f60]">
          Assigned Station
        </span>
        <div className="my-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold bg-[#f1f5f9] text-[#131416]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#131416]" />
            {currentStation}
          </span>
        </div>
        <span className="text-[13px] text-[#5d5f60] truncate font-medium">
          {userName} · {branchName}
        </span>
      </div>

      {/* 4. Attendance Quick Link */}
      <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#5d5f60]">
            Time Clock Punch
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#16a34a]" />
        </div>
        <div className="my-1.5">
          <span className="text-xs sm:text-sm font-semibold text-[#131416]">
            Terminal Synchronized
          </span>
        </div>
        <div>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#131416] hover:underline"
          >
            <span>Open Attendance Terminal</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
