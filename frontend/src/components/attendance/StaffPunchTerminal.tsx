import React, { useState, useEffect } from 'react';
import { Shift, Attendance } from '../../lib/types';
import {
  formatTimeShort,
  calculateDurationHours,
  calculatePunctuality,
} from './attendanceUtils';

interface StaffPunchTerminalProps {
  shifts?: Shift[];
  attendanceList?: Attendance[];
  currentUserId?: string;
  isLoading: boolean;
  onCheckIn: (assignmentId: string) => void;
  onCheckOut: (assignmentId: string) => void;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
}

export const StaffPunchTerminal: React.FC<StaffPunchTerminalProps> = ({
  shifts = [],
  attendanceList = [],
  currentUserId,
  isLoading,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) => {
  // Live Store Clock in local timezone
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTimeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const liveDateStr = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Find user's active assigned shift for today
  const activeShift = shifts.find((s) =>
    s.assignments?.some((a) => a.userId === currentUserId || !currentUserId)
  ) || shifts[0];

  const myAssignment = activeShift?.assignments?.find(
    (a) => a.userId === currentUserId || !currentUserId
  ) || activeShift?.assignments?.[0];

  const attendanceRecord = attendanceList.find(
    (att) => att.shiftAssignmentId === myAssignment?.id
  ) || attendanceList[0];

  return (
    <div className="rounded-xl border border-[#e8eaec] bg-white overflow-hidden text-left mb-6">
      {/* Terminal Header Deck */}
      <div className="p-4 sm:p-5 border-b border-[#f0f1f2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#f9fbfc]">
        <div>
          <span className="text-xs font-medium text-[#5d5f60] block">
            Shift Punch Station
          </span>
          <h2 className="text-base sm:text-xl font-semibold text-[#131416] mt-0.5">
            Store Punch Terminal
          </h2>
          <p className="text-[13px] text-[#5d5f60] mt-0.5">
            Self-service attendance check-in & check-out for today&apos;s scheduled shift
          </p>
        </div>

        {/* Live Store Clock */}
        <div className="px-4 py-2.5 rounded-lg bg-white border border-[#cdced1] flex items-center gap-3.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1e7b4f]" />
          <div>
            <div className="text-lg sm:text-xl font-semibold font-mono tabular-nums text-[#131416] leading-none">
              {liveTimeStr}
            </div>
            <div className="text-xs text-[#5d5f60] font-mono mt-1">
              {liveDateStr} · JST (UTC+9)
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Main Body */}
      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="py-10 text-center text-[13px] text-[#5d5f60] font-mono">
            Loading assigned shift window...
          </div>
        ) : !activeShift || !myAssignment ? (
          <div className="py-8 text-center max-w-md mx-auto">
            <span className="text-sm font-semibold text-[#131416] block">
              No shifts assigned for today
            </span>
            <p className="text-[13px] text-[#5d5f60] mt-1">
              Your supervisor has not scheduled any shifts for your account today.
              Check the Shift Roster tab for upcoming weekly scheduling.
            </p>
          </div>
        ) : (
          (() => {
            const startTime = new Date(activeShift.startTime);
            const endTime = new Date(activeShift.endTime);
            const earlyOpenTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 mins early window

            const isTooEarly = now < earlyOpenTime;
            const isPastEnd = now > endTime;
            const isCheckedIn = !!attendanceRecord?.checkInAt;
            const isCompleted =
              attendanceRecord?.status === 'COMPLETED' ||
              !!attendanceRecord?.checkOutAt;

            const punctuality = calculatePunctuality(
              attendanceRecord?.checkInAt,
              activeShift.startTime
            );

            // Calculate countdown for early arrival
            const msUntilOpen = Math.max(0, earlyOpenTime.getTime() - now.getTime());
            const minsUntilOpen = Math.floor(msUntilOpen / (60 * 1000));
            const secsUntilOpen = Math.floor((msUntilOpen % (60 * 1000)) / 1000);
            const countdownStr = `${minsUntilOpen.toString().padStart(2, '0')}m ${secsUntilOpen
              .toString()
              .padStart(2, '0')}s`;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left Deck: Shift Details */}
                <div className="space-y-4 border-b md:border-b-0 md:border-r border-[#f0f1f2] pb-5 md:pb-0 md:pr-6">
                  <div>
                    <span className="text-xs font-medium text-[#1b6c80] block">
                      Scheduled Shift Window
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold text-[#131416] mt-0.5">
                      {activeShift.name || 'Floor Operations Shift'}
                    </h3>
                    <p className="text-sm text-[#5d5f60] mt-0.5 font-mono tabular-nums">
                      {activeShift.branchName || 'Shibuya Flagship'} ·{' '}
                      {formatTimeShort(activeShift.startTime)} –{' '}
                      {formatTimeShort(activeShift.endTime)}
                    </p>
                  </div>

                  {/* Operational Notes */}
                  {activeShift.notes && (
                    <div className="p-3 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-xs text-[#5d5f60]">
                      <span className="font-semibold text-[#131416] block text-xs">
                        Supervisor Operating Notes:
                      </span>
                      <p className="mt-1 text-[13px] text-[#131416] leading-relaxed">
                        {activeShift.notes}
                      </p>
                    </div>
                  )}

                  {/* Punch Status Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div className="p-3.5 rounded-lg border border-[#e8eaec] bg-white">
                      <span className="text-[13px] text-[#5d5f60] block font-medium">
                        Clock in time
                      </span>
                      <span className="text-base font-semibold font-mono tabular-nums text-[#131416] mt-1 block">
                        {attendanceRecord?.checkInAt
                          ? formatTimeShort(attendanceRecord.checkInAt)
                          : 'Not clocked in'}
                      </span>
                      {attendanceRecord?.checkInAt ? (
                        <span
                          className={`text-[13px] font-mono mt-0.5 block ${
                            punctuality.isLate
                              ? 'text-[#92400e]'
                              : 'text-[#1e7b4f]'
                          }`}
                        >
                          {punctuality.label}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#5d5f60] font-mono mt-0.5 block">
                          Pending start
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-lg border border-[#e8eaec] bg-white">
                      <span className="text-[13px] text-[#5d5f60] block font-medium">
                        Clock out time
                      </span>
                      <span className="text-base font-semibold font-mono tabular-nums text-[#131416] mt-1 block">
                        {attendanceRecord?.checkOutAt
                          ? formatTimeShort(attendanceRecord.checkOutAt)
                          : isCheckedIn
                          ? 'Active on floor'
                          : 'Pending'}
                      </span>
                      <span className="text-[13px] text-[#5d5f60] font-mono mt-0.5 block">
                        {attendanceRecord?.checkInAt
                          ? calculateDurationHours(
                              attendanceRecord.checkInAt,
                              attendanceRecord.checkOutAt
                            )
                          : '8.5h planned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Deck: Primary Action Trigger */}
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  {isCompleted ? (
                    <div className="space-y-3 max-w-sm">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#e8eaec] text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#5d5f60]" />
                        <span>Shift Concluded</span>
                      </div>
                      <div className="text-sm font-semibold text-[#131416]">
                        Timecard Closed · {calculateDurationHours(attendanceRecord?.checkInAt, attendanceRecord?.checkOutAt)} logged
                      </div>
                      <p className="text-[13px] text-[#5d5f60]">
                        You have successfully completed and clocked out of this shift.
                        Your attendance record has been finalized in the store database.
                      </p>
                    </div>
                  ) : isCheckedIn ? (
                    <div className="space-y-3.5 w-full max-w-sm">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
                        <span>Active on Sales Floor</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCheckOut(myAssignment.id)}
                        disabled={isCheckingOut}
                        className="w-full h-12 sm:h-14 px-5 rounded-lg bg-[#1b6c80] text-white text-base font-semibold hover:bg-[#155464] active:bg-[#0f3d4a] transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>
                          {isCheckingOut
                            ? 'Recording Clock-Out...'
                            : 'Clock Out (Conclude Shift)'}
                        </span>
                      </button>

                      <span className="text-xs text-[#5d5f60] block font-mono">
                        Terminal records verified UTC timestamp on punch
                      </span>
                    </div>
                  ) : isTooEarly ? (
                    <div className="space-y-3 max-w-sm">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#cdced1] text-xs font-medium">
                        <span>Check-in opens in {countdownStr}</span>
                      </div>
                      <div className="text-sm font-semibold text-[#131416]">
                        Early Arrival Window
                      </div>
                      <p className="text-[13px] text-[#5d5f60]">
                        Store policy permits check-in starting 15 minutes before scheduled start (at{' '}
                        <span className="font-mono font-medium text-[#131416]">
                          {formatTimeShort(earlyOpenTime.toISOString())}
                        </span>
                        ).
                      </p>
                    </div>
                  ) : isPastEnd ? (
                    <div className="space-y-3 max-w-sm">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/30 text-xs font-medium">
                        <span>Shift window ended</span>
                      </div>
                      <div className="text-sm font-semibold text-[#131416]">
                        Manual Approval Required
                      </div>
                      <p className="text-[13px] text-[#5d5f60]">
                        The scheduled shift end time has passed. Please contact
                        your floor supervisor to log manual attendance.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => onCheckIn(myAssignment.id)}
                        disabled={isCheckingIn}
                        className="w-full h-12 sm:h-14 px-5 rounded-lg bg-[#1b6c80] text-white hover:bg-[#155464] border border-[#1b6c80] shadow-xs text-base font-semibold active:bg-[#113f4c] transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>
                          {isCheckingIn
                            ? 'Verifying Check-In...'
                            : 'Clock In for Shift'}
                        </span>
                      </button>

                      <span className="text-xs text-[#5d5f60] block font-mono">
                        Scheduled start: {formatTimeShort(activeShift.startTime)} · 15m early grace window active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
