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
    s.assignments?.some((a) => a.userId === currentUserId)
  );
  const myAssignment = activeShift?.assignments?.find(
    (a) => a.userId === currentUserId
  );
  const attendanceRecord = attendanceList.find(
    (att) => att.shiftAssignmentId === myAssignment?.id
  );

  return (
    <div className="rounded-xl border border-[#e8eaec] bg-white overflow-hidden text-left mb-6">
      {/* Terminal Header Deck */}
      <div className="p-4 sm:p-5 border-b border-[#f0f1f2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#f9fbfc]">
        <div>
          <span className="text-[11px] font-semibold text-[#5d5f60] uppercase tracking-normal">
            Store Punch Terminal
          </span>
          <h2 className="text-base sm:text-lg font-semibold text-[#131416] mt-0.5">
            Shift Punch Station
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            Self-service attendance check-in & check-out for today&apos;s shift
          </p>
        </div>

        {/* Live Store Clock */}
        <div className="px-3.5 py-2 rounded-lg bg-white border border-[#cdced1] flex items-center gap-3 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
          <div>
            <div className="text-base sm:text-lg font-semibold font-mono tabular-nums text-[#131416] leading-none">
              {liveTimeStr}
            </div>
            <div className="text-[11px] text-[#5d5f60] font-mono mt-0.5">
              {liveDateStr}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Main Body */}
      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#5d5f60] font-mono">
            Loading assigned shift window...
          </div>
        ) : !activeShift || !myAssignment ? (
          <div className="py-8 text-center max-w-md mx-auto">
            <span className="text-xs font-semibold text-[#131416] block">
              No shifts assigned for today
            </span>
            <p className="text-xs text-[#5d5f60] mt-1">
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

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left Deck: Shift Details */}
                <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-[#f0f1f2] pb-5 md:pb-0 md:pr-6">
                  <div>
                    <span className="text-[11px] font-semibold text-[#1b6c80] uppercase tracking-normal">
                      Scheduled Shift Window
                    </span>
                    <h3 className="text-base font-semibold text-[#131416] mt-0.5">
                      {activeShift.name || 'Floor Operations Shift'}
                    </h3>
                    <p className="text-xs text-[#5d5f60] mt-0.5 font-mono tabular-nums">
                      {activeShift.branchName || 'Shibuya Flagship'} ·{' '}
                      {formatTimeShort(activeShift.startTime)} –{' '}
                      {formatTimeShort(activeShift.endTime)}
                    </p>
                  </div>

                  {/* Operational Notes */}
                  {activeShift.notes && (
                    <div className="p-2.5 rounded bg-[#f9fbfc] border border-[#e8eaec] text-xs text-[#5d5f60]">
                      <span className="font-semibold text-[#131416] block text-[11px]">
                        Supervisor Operating Notes:
                      </span>
                      <p className="mt-0.5">{activeShift.notes}</p>
                    </div>
                  )}

                  {/* Punch Status Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded border border-[#e8eaec] bg-white">
                      <span className="text-[11px] text-[#5d5f60] block font-medium">
                        Clock in time
                      </span>
                      <span className="text-sm font-semibold font-mono tabular-nums text-[#131416] mt-0.5 block">
                        {attendanceRecord?.checkInAt
                          ? formatTimeShort(attendanceRecord.checkInAt)
                          : 'Not clocked in'}
                      </span>
                      {attendanceRecord?.checkInAt && (
                        <span
                          className={`text-[11px] font-mono mt-0.5 block ${
                            punctuality.isLate
                              ? 'text-[#92400e]'
                              : 'text-[#1e7b4f]'
                          }`}
                        >
                          {punctuality.label}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded border border-[#e8eaec] bg-white">
                      <span className="text-[11px] text-[#5d5f60] block font-medium">
                        Clock out time
                      </span>
                      <span className="text-sm font-semibold font-mono tabular-nums text-[#131416] mt-0.5 block">
                        {attendanceRecord?.checkOutAt
                          ? formatTimeShort(attendanceRecord.checkOutAt)
                          : isCheckedIn
                          ? 'Active on floor'
                          : 'Pending'}
                      </span>
                      <span className="text-[11px] text-[#5d5f60] font-mono mt-0.5 block">
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
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#e8eaec] text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#5d5f60]" />
                        <span>Shift Concluded</span>
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        You have successfully completed and clocked out of this
                        shift.
                      </p>
                    </div>
                  ) : isCheckedIn ? (
                    <div className="space-y-3 w-full max-w-xs">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
                        <span>Currently active on sales floor</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCheckOut(myAssignment.id)}
                        disabled={isCheckingOut}
                        className="w-full h-11 px-4 rounded-md bg-[#1b6c80] text-white text-sm font-medium hover:bg-[#155464] transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>
                          {isCheckingOut
                            ? 'Recording Clock-Out...'
                            : 'Clock Out (End Shift)'}
                        </span>
                      </button>

                      <span className="text-[11px] text-[#5d5f60] block font-mono">
                        Terminal records exact UTC timestamp on click
                      </span>
                    </div>
                  ) : isTooEarly ? (
                    <div className="space-y-2 max-w-xs">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#cdced1] text-xs font-medium">
                        <span>Check-in not yet open</span>
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        Shift check-in opens 15 minutes before scheduled start (at{' '}
                        <span className="font-mono font-medium text-[#131416]">
                          {formatTimeShort(earlyOpenTime.toISOString())}
                        </span>
                        ).
                      </p>
                    </div>
                  ) : isPastEnd ? (
                    <div className="space-y-2 max-w-xs">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/30 text-xs font-medium">
                        <span>Shift already ended</span>
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        The scheduled shift end time has passed. Please contact
                        your floor supervisor to log manual attendance.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={() => onCheckIn(myAssignment.id)}
                        disabled={isCheckingIn}
                        className="w-full h-11 px-4 rounded-md bg-[#131416] text-white text-sm font-medium hover:bg-[#1f2326] transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>
                          {isCheckingIn
                            ? 'Verifying Check-In...'
                            : 'Clock In for Shift'}
                        </span>
                      </button>

                      <span className="text-[11px] text-[#5d5f60] block font-mono">
                        Scheduled start: {formatTimeShort(activeShift.startTime)}
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
