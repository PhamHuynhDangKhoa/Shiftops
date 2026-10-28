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
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5 h-full flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
            <h2 className="text-base font-semibold text-[#131416]">
              Time Clock Station
            </h2>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#5d5f60]">
            {currentTime.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Digital Time Readout */}
        <div className="p-4 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-center">
          <div className="text-3xl sm:text-4xl font-normal font-mono tabular-nums text-[#131416] tracking-tight">
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <div className="text-xs text-[#5d5f60] mt-1">
            Station Synchronized (JST)
          </div>
        </div>

        {/* Shift Details */}
        {isLoadingMyShifts ? (
          <div className="py-6 text-center text-xs text-[#5d5f60]">
            Loading shift schedule...
          </div>
        ) : currentStaffShift ? (
          <div className="p-4 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
              <div>
                <span className="text-[11px] text-[#5d5f60] block">Shift Assignment</span>
                <span className="font-semibold text-[#131416]">
                  {currentStaffShift.name || 'Scheduled Shift'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#ebedee] text-[#131416]">
                {punchState.label}
              </span>
            </div>

            <div className="flex justify-between items-center text-[#5d5f60]">
              <span>Scheduled Window</span>
              <span className="font-mono tabular-nums text-[#131416] font-medium">
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
              <div className="pt-2 border-t border-[#f0f1f2] space-y-1 text-[#5d5f60]">
                <div className="flex justify-between">
                  <span>Clocked in:</span>
                  <span className="font-mono tabular-nums text-[#131416] font-medium">
                    {currentAttendance.checkInAt
                      ? new Date(currentAttendance.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                    {currentAttendance.late && (
                      <span className="text-[#92400e] ml-1 font-semibold">(Late)</span>
                    )}
                  </span>
                </div>
                {currentAttendance.checkOutAt && (
                  <div className="flex justify-between">
                    <span>Clocked out:</span>
                    <span className="font-mono tabular-nums text-[#131416] font-medium">
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
          <div className="p-4 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-center text-xs text-[#5d5f60]">
            No active shift scheduled for today.
          </div>
        )}

        {/* Feedback alert if any */}
        {punchFeedback && (
          <div className="p-3 rounded-lg bg-[#ebedee] border border-[#cdced1] flex items-center justify-between text-xs">
            <span className="text-[#131416]">{punchFeedback}</span>
            <button
              type="button"
              onClick={onClearPunchFeedback}
              className="text-[#5d5f60] hover:text-[#131416] text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#f0f1f2] space-y-2">
        {punchState.canIn && (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={isCheckingIn}
            className="w-full h-10 rounded-md bg-[#131416] text-white text-xs font-semibold hover:bg-[#1f2326] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isCheckingIn ? 'Clocking in...' : 'Clock In Now'}
          </button>
        )}

        {punchState.canOut && (
          <button
            type="button"
            onClick={onCheckOut}
            disabled={isCheckingOut}
            className="w-full h-10 rounded-md bg-[#c4242a] text-white text-xs font-semibold hover:bg-[#a51d22] transition-colors cursor-pointer disabled:opacity-50"
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
