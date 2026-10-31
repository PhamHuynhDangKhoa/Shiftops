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
  const isClockedIn = Boolean(currentAttendance?.checkInAt && !currentAttendance?.checkOutAt);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Segment 1: Duty Status & Timing Overview */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold ${
                isClockedIn
                  ? 'bg-[#dcfce7] text-[#14532d]'
                  : punchState.isCompleted
                  ? 'bg-[#f1f5f9] text-[#475569]'
                  : 'bg-[#f1f5f9] text-[#131416]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isClockedIn
                    ? 'bg-[#16a34a] animate-pulse'
                    : punchState.isCompleted
                    ? 'bg-[#64748b]'
                    : 'bg-[#131416]'
                }`}
              />
              <span>{isClockedIn ? 'On Duty · Active Shift' : punchState.label}</span>
            </span>

            <span className="text-xs sm:text-sm text-[#475569] font-medium font-sans tabular-nums">
              Terminal: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} JST Synchronized
            </span>
          </div>

          {isLoadingMyShifts ? (
            <div className="text-sm text-[#475569]">Loading scheduled shift...</div>
          ) : currentStaffShift ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#475569]">
              <span className="font-semibold text-[#131416]">
                {currentStaffShift.name || 'Floor Operations'}
              </span>
              <span className="text-[#cbd5e1]">·</span>
              <span>
                Window:{' '}
                <strong className="text-[#131416] font-sans tabular-nums font-semibold">
                  {new Date(currentStaffShift.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {new Date(currentStaffShift.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </span>
              <span className="text-[#cbd5e1] hidden sm:inline">·</span>
              <span>Supervisor: Marcus Tanaka (Manager)</span>

              {currentAttendance?.checkInAt && (
                <>
                  <span className="text-[#cbd5e1] hidden sm:inline">·</span>
                  <span className="text-[#14532d] font-semibold">
                    Clocked in at {new Date(currentAttendance.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="text-sm text-[#475569]">No active shift scheduled for today.</div>
          )}

          {/* User Feedback banner */}
          {punchFeedback && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#f1f5f9] flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#131416] font-medium">{punchFeedback}</span>
              <button
                type="button"
                onClick={onClearPunchFeedback}
                className="text-[#475569] hover:text-[#131416] text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Segment 2: One-Touch Action Trigger */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center pt-1 lg:pt-0">
          {punchState.canIn && (
            <button
              type="button"
              onClick={onCheckIn}
              disabled={isCheckingIn}
              className="h-10 px-5 rounded-lg bg-[#131416] hover:bg-[#282a2d] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{isCheckingIn ? 'Recording Punch...' : 'Clock In for Shift'}</span>
            </button>
          )}

          {punchState.canOut && (
            <button
              type="button"
              onClick={onCheckOut}
              disabled={isCheckingOut}
              className="h-10 px-5 rounded-lg bg-[#c4242a] hover:bg-[#a51d22] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{isCheckingOut ? 'Recording Punch...' : 'Clock Out & Complete Shift'}</span>
            </button>
          )}

          {!punchState.canIn && !punchState.canOut && punchState.isCompleted && (
            <div className="h-10 px-4 rounded-lg bg-[#f1f5f9] text-[#475569] text-xs sm:text-sm font-medium flex items-center justify-center">
              Shift Completed
            </div>
          )}

          {!punchState.canIn && !punchState.canOut && !punchState.isCompleted && (
            <div className="h-10 px-4 rounded-lg bg-[#f1f5f9] text-[#475569] text-xs sm:text-sm font-medium flex items-center justify-center">
              {punchState.label}
            </div>
          )}

          <Link
            to="/attendance"
            className="text-xs sm:text-sm text-[#131416] hover:underline font-medium whitespace-nowrap px-1"
          >
            Attendance History →
          </Link>
        </div>
      </div>
    </div>
  );
};
