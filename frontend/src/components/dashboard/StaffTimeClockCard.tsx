import React from 'react';
import { Link } from 'react-router-dom';
import { Shift, Attendance } from '../../lib/types';

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
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <h2 className="text-base font-bold text-[#131416]">
              Time Clock Station
            </h2>
          </div>
          <span className="text-xs font-sans tabular-nums text-[#64748b]">
            {currentTime.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Digital Time Readout (Tone Contrast, Zero Card Borders) */}
        <div className="p-5 rounded-xl bg-[#f8f9fa] text-center">
          <div className="text-3xl sm:text-4xl font-bold font-sans tabular-nums text-[#131416] tracking-tight">
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <div className="text-xs text-[#64748b] mt-1">
            Station Synchronized (JST)
          </div>
        </div>

        {/* Shift Details (Tone Contrast, Zero Card Borders) */}
        {isLoadingMyShifts ? (
          <div className="py-6 text-center text-xs text-[#64748b]">
            Loading shift schedule...
          </div>
        ) : currentStaffShift ? (
          <div className="p-4 rounded-xl bg-[#f8f9fa] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-[11px] text-[#64748b] block">Shift Assignment</span>
                <span className="font-semibold text-sm text-[#131416]">
                  {currentStaffShift.name || 'Scheduled Shift'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e2e8f0] text-[#334155]">
                {punchState.label}
              </span>
            </div>

            <div className="flex justify-between items-center text-[#64748b]">
              <span>Scheduled Window</span>
              <span className="font-sans tabular-nums text-[#131416] font-medium">
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
              <div className="pt-2 space-y-1 text-[#64748b]">
                <div className="flex justify-between">
                  <span>Clocked in:</span>
                  <span className="font-sans tabular-nums text-[#131416] font-semibold">
                    {currentAttendance.checkInAt
                      ? new Date(currentAttendance.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                    {currentAttendance.late && (
                      <span className="text-[#b45309] ml-1 font-semibold">(Late)</span>
                    )}
                  </span>
                </div>
                {currentAttendance.checkOutAt && (
                  <div className="flex justify-between">
                    <span>Clocked out:</span>
                    <span className="font-sans tabular-nums text-[#131416] font-semibold">
                      {new Date(currentAttendance.checkOutAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#f8f9fa] text-center text-xs text-[#64748b]">
            No active shift scheduled for today.
          </div>
        )}

        {/* Feedback alert if any */}
        {punchFeedback && (
          <div className="p-3.5 rounded-xl bg-[#e2e8f0] flex items-center justify-between text-xs">
            <span className="text-[#131416] font-medium">{punchFeedback}</span>
            <button
              type="button"
              onClick={onClearPunchFeedback}
              className="text-[#64748b] hover:text-[#131416] text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {punchState.canIn && (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={isCheckingIn}
            className="w-full h-11 rounded-xl bg-[#1b6c80] text-white hover:bg-[#155464] text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCheckingIn ? 'Clocking in...' : 'Clock In Now'}
          </button>
        )}

        {punchState.canOut && (
          <button
            type="button"
            onClick={onCheckOut}
            disabled={isCheckingOut}
            className="w-full h-11 rounded-xl bg-[#c4242a] text-white text-xs font-semibold hover:bg-[#a51d22] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCheckingOut ? 'Clocking out...' : 'Clock Out Now'}
          </button>
        )}

        <div className="text-center pt-1">
          <Link
            to="/attendance"
            className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium"
          >
            View personal attendance history →
          </Link>
        </div>
      </div>
    </div>
  );
};
