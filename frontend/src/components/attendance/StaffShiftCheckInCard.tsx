import React from 'react';
import { Shift, Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconClock, IconMapPin, IconCheck } from '../ui/Icons';

interface StaffShiftCheckInCardProps {
  shifts?: Shift[];
  attendanceList?: Attendance[];
  currentUserId?: string;
  isLoading: boolean;
  onCheckIn: (assignmentId: string) => void;
  onCheckOut: (assignmentId: string) => void;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatTimeOnly = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const StaffShiftCheckInCard: React.FC<StaffShiftCheckInCardProps> = ({
  shifts,
  attendanceList,
  currentUserId,
  isLoading,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">
            Active & Upcoming Shift Clock-In
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Punch in to mark attendance within the 15-minute dispatch window
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-zinc-400 font-mono">
          Loading assigned shifts...
        </div>
      ) : !shifts || shifts.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">
          <p className="text-xs font-medium text-zinc-800">No shifts assigned in the active window</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Check the Shifts tab to review your upcoming roster.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {shifts.map((shift) => {
            const assignment = shift.assignments?.find((a) => a.userId === currentUserId);
            if (!assignment) return null;

            const attendanceRecord = attendanceList?.find((att) => att.shiftAssignmentId === assignment.id);

            const now = new Date();
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const checkInOpenTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 mins early

            const isTooEarly = now < checkInOpenTime;
            const isPastEnd = now > endTime;
            const canCheckIn = !attendanceRecord && !isTooEarly && !isPastEnd;
            const canCheckOut =
              attendanceRecord &&
              (attendanceRecord.status === 'PRESENT' || attendanceRecord.status === 'LATE') &&
              !attendanceRecord.checkOutAt;

            return (
              <div
                key={shift.id}
                className="bg-zinc-50 border border-zinc-200 rounded-md p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-zinc-950">
                      {shift.name || 'General Shift'}
                    </span>
                    {shift.overnight && (
                      <Badge variant="brand" size="sm">
                        Overnight
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-zinc-600 font-mono space-y-1">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <IconMapPin size={12} className="text-zinc-400" />
                      <span>{shift.branchName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-700 tabular-nums">
                      <IconClock size={12} className="text-zinc-400" />
                      <span>{formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}</span>
                    </div>
                    {shift.notes && (
                      <p className="text-[11px] text-zinc-500 italic mt-1 font-sans">
                        "{shift.notes}"
                      </p>
                    )}
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="pt-1">
                    {attendanceRecord ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">Status:</span>
                          <AttendanceStatusBadge status={attendanceRecord.status} late={attendanceRecord.late} />
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                          In: {formatTimeOnly(attendanceRecord.checkInAt)}
                          {attendanceRecord.checkOutAt && ` · Out: ${formatTimeOnly(attendanceRecord.checkOutAt)}`}
                        </div>
                      </div>
                    ) : isTooEarly ? (
                      <div className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded">
                        Window opens at {formatTimeOnly(checkInOpenTime.toISOString())}
                      </div>
                    ) : isPastEnd ? (
                      <div className="text-xs font-mono text-rose-800 bg-rose-50 border border-rose-200/80 px-2.5 py-1.5 rounded">
                        Shift schedule has concluded
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded flex items-center gap-1.5">
                        <IconCheck size={13} className="text-emerald-600" />
                        <span>Check-in window active</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Punch Actions */}
                <div className="pt-2 border-t border-zinc-200/70">
                  {!attendanceRecord && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onCheckIn(assignment.id)}
                      disabled={!canCheckIn || isCheckingIn}
                      className="w-full justify-center"
                    >
                      {isCheckingIn ? 'Recording Punch...' : 'Clock In Now'}
                    </Button>
                  )}

                  {canCheckOut && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCheckOut(assignment.id)}
                      disabled={isCheckingOut}
                      className="w-full justify-center font-semibold"
                    >
                      {isCheckingOut ? 'Recording Out-Punch...' : 'Clock Out (End Shift)'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
