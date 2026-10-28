import React from 'react';
import { Link } from 'react-router-dom';
import { Shift, Attendance } from '../../lib/types';
import { IconClock, IconArrowUpRight, IconClose } from '../ui/Icons';
import { Badge } from '../ui/Badge';

export interface PunchState {
  canIn: boolean;
  canOut: boolean;
  isCompleted: boolean;
  label: string;
}

export interface StaffTimeClockCardProps {
  currentTime: Date;
  isLoadingMyShifts: boolean;
  currentStaffShift?: Shift | null;
  currentAttendance?: Attendance | null;
  punchState: PunchState;
  punchFeedback: string | null;
  onClearPunchFeedback: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
}

export const StaffTimeClockCard: React.FC<StaffTimeClockCardProps> = ({
  currentTime,
  isLoadingMyShifts,
  currentStaffShift,
  currentAttendance,
  punchState,
  punchFeedback,
  onClearPunchFeedback,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) => {
  // Clock calculations for physical analog dial
  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  return (
    <div className="p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] h-full flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e7b4f]" />
            <span className="text-sm font-bold tracking-tight text-[#131416]">
              Time Clock Station
            </span>
          </div>
          <span className="text-xs font-medium text-[#5d5f60] tabular-nums">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Physical Analog Dial + Digital Readout */}
        <div className="flex items-center justify-center gap-6 px-6 py-5 bg-[#f9fbfc] rounded-lg border border-[#e8eaec]">
          <div className="relative w-24 h-24 rounded-full border-2 border-[#cdced1] bg-white shrink-0 select-none shadow-2xs">
            {/* Cardinal Ticks */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#727477] rounded-full" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#727477] rounded-full" />
            <div className="absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-[#727477] rounded-full" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-[#727477] rounded-full" />

            {/* Dial Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#131416] border-2 border-white z-20 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-[#c4242a]" />
            </div>
            {/* Hour Hand */}
            <div
              className="absolute bottom-1/2 left-1/2 w-[2.5px] h-7 bg-[#131416] rounded-t-full origin-bottom z-10"
              style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }}
            />
            {/* Minute Hand */}
            <div
              className="absolute bottom-1/2 left-1/2 w-[1.5px] h-9 bg-[#5d5f60] rounded-t-full origin-bottom z-10"
              style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }}
            />
            {/* Second Hand */}
            <div
              className="absolute bottom-1/2 left-1/2 w-[1px] h-10 bg-[#c4242a] rounded-t-full origin-bottom z-10"
              style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }}
            />
          </div>

          {/* Digital Readout */}
          <div className="text-left space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#131416] tabular-nums font-mono">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
              <span>Server UTC Synced</span>
            </div>
          </div>
        </div>

        {/* Shift Context Card: Stamped Timecard Bay */}
        {isLoadingMyShifts ? (
          <div className="py-6 text-center text-xs text-[#5d5f60]">
            Verifying schedule...
          </div>
        ) : currentStaffShift ? (
          <div className="p-4 rounded-lg bg-[#f4f6f8] border border-[#e8eaec] space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#e8eaec]">
              <div>
                <span className="text-[10px] font-bold text-[#5d5f60] uppercase tracking-wider block font-mono">
                  TIMECARD SLIP
                </span>
                <span className="text-sm font-bold text-[#131416]">
                  {currentStaffShift.name || 'Scheduled Floor Shift'}
                </span>
              </div>
              <Badge variant="brand" size="sm">
                {punchState.label}
              </Badge>
            </div>

            <div className="text-xs text-[#131416] flex items-center gap-1.5">
              <IconClock size={14} className="text-[#5d5f60]" />
              <span className="tabular-nums font-medium">
                {new Date(currentStaffShift.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                –{' '}
                {new Date(currentStaffShift.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {currentAttendance && (
              <div className="pt-2 border-t border-[#e8eaec] text-xs space-y-1 text-[#5d5f60]">
                <div className="flex justify-between">
                  <span>PUNCH IN:</span>
                  <span className="font-semibold text-[#131416] tabular-nums">
                    {currentAttendance.checkInAt
                      ? new Date(currentAttendance.checkInAt).toLocaleTimeString()
                      : '—'}
                    {currentAttendance.late && (
                      <span className="text-[#92400e] font-bold ml-1">[LATE]</span>
                    )}
                  </span>
                </div>
                {currentAttendance.checkOutAt && (
                  <div className="flex justify-between">
                    <span>PUNCH OUT:</span>
                    <span className="font-semibold text-[#131416] tabular-nums">
                      {new Date(currentAttendance.checkOutAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ebedee] text-[10px] font-bold text-[#5d5f60] uppercase tracking-wider font-mono">
              <span>TIMECARD BAY: EMPTY</span>
            </div>
            <p className="text-sm font-semibold text-[#131416]">
              No Shift Scheduled Today
            </p>
            <p className="text-xs text-[#5d5f60] max-w-xs mx-auto leading-relaxed">
              Your attendance card will automatically slot into this bay when a shift is assigned.
            </p>
          </div>
        )}

        {/* Feedback Alert */}
        {punchFeedback && (
          <div className="p-2.5 rounded-md bg-[#dcfae5] border border-[#1e7b4f]/20 text-xs font-semibold text-[#04250e] flex items-center justify-between">
            <span>{punchFeedback}</span>
            <button
              onClick={onClearPunchFeedback}
              className="cursor-pointer text-[#04250e]/70 hover:text-[#04250e]"
            >
              <IconClose size={12} />
            </button>
          </div>
        )}

        {/* Mechanical Punch Switch */}
        <div className="pt-1">
          {currentStaffShift && punchState.canIn && (
            <button
              type="button"
              disabled={isCheckingIn}
              onClick={onCheckIn}
              className="w-full h-10 rounded-md bg-[#1e7b4f] hover:bg-[#165c3b] text-white font-medium text-xs tracking-tight flex items-center justify-center gap-2 transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              <IconClock size={15} />
              <span>
                {isCheckingIn ? 'Stamping Attendance...' : 'Punch In (Start Shift)'}
              </span>
            </button>
          )}

          {currentStaffShift && punchState.canOut && (
            <button
              type="button"
              disabled={isCheckingOut}
              onClick={onCheckOut}
              className="w-full h-10 rounded-md bg-[#92400e] hover:bg-[#78350f] text-white font-medium text-xs tracking-tight flex items-center justify-center gap-2 transition-colors cursor-pointer select-none disabled:opacity-50"
            >
              <IconClock size={15} />
              <span>
                {isCheckingOut ? 'Recording Check-Out...' : 'Punch Out (End Shift)'}
              </span>
            </button>
          )}

          {(!currentStaffShift || (!punchState.canIn && !punchState.canOut)) && (
            <div className="p-3 rounded-md bg-[#f4f6f8] border border-[#e8eaec] text-center space-y-0.5">
              <span className="text-xs font-semibold text-[#131416] block">
                {punchState.isCompleted ? 'Shift Concluded' : 'Punch Switch Standby'}
              </span>
              <span className="text-xs text-[#5d5f60] block leading-relaxed">
                {punchState.isCompleted
                  ? 'Attendance record finalized for today.'
                  : currentStaffShift
                  ? 'Clock-in mechanism unlocks 15m before shift start.'
                  : 'Awaiting shift roster assignment.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center text-xs text-[#5d5f60] pt-3 border-t border-[#f0f1f2] mt-4">
        <Link
          to="/attendance"
          className="hover:text-[#1b6c80] font-medium flex items-center gap-1 transition-colors"
        >
          <span>View Attendance Ledger</span>
          <IconArrowUpRight size={11} />
        </Link>
        <Link
          to="/handovers"
          className="hover:text-[#1b6c80] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Shift Turnover</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>
    </div>
  );
};
