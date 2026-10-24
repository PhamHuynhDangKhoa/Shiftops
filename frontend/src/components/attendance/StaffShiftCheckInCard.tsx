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
    <div className="bg-[#11141a] border border-[#262c38] p-5 mb-6 clip-chamfer-card">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#262c38]">
        <div>
          <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-wider block">
            // TELEMETRY CLOCK PUNCH TERMINAL
          </span>
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase mt-0.5">
            ACTIVE & UPCOMING ROSTER PUNCH-IN
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-[#00f0ff] font-mono">
          [ LOADING ASSIGNED ROSTER... ]
        </div>
      ) : !shifts || shifts.length === 0 ? (
        <div className="py-8 text-center text-[#606c80] font-mono text-xs">
          <p className="font-bold text-[#9da8b9] uppercase">[ NO ACTIVE SHIFTS IN DISPATCH WINDOW ]</p>
          <p className="text-[11px] mt-1">
            Check the Roster tab to inspect upcoming assignments.
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
                className="bg-[#161922] border border-[#262c38] border-l-2 border-l-[#00f0ff] p-4 flex flex-col justify-between gap-3 clip-chamfer-btn"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      {shift.name || 'General Shift'}
                    </span>
                    {shift.overnight && (
                      <Badge variant="cyan" size="sm">
                        OVERNIGHT
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs font-mono space-y-1">
                    <div className="flex items-center gap-1.5 text-[#9da8b9]">
                      <IconMapPin size={12} className="text-[#00f0ff]" />
                      <span>{shift.branchName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white tabular-nums">
                      <IconClock size={12} className="text-[#00f0ff]" />
                      <span>{formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}</span>
                    </div>
                    {shift.notes && (
                      <p className="text-[11px] text-[#606c80] italic mt-1 font-sans">
                        "{shift.notes}"
                      </p>
                    )}
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="pt-1">
                    {attendanceRecord ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#606c80]">STATUS:</span>
                          <AttendanceStatusBadge status={attendanceRecord.status} late={attendanceRecord.late} />
                        </div>
                        <div className="text-[11px] font-mono text-[#00f0ff] tabular-nums">
                          IN: {formatTimeOnly(attendanceRecord.checkInAt)}
                          {attendanceRecord.checkOutAt && ` · OUT: ${formatTimeOnly(attendanceRecord.checkOutAt)}`}
                        </div>
                      </div>
                    ) : isTooEarly ? (
                      <div className="text-xs font-mono text-[#ff8800] bg-[#ff6b00]/10 border border-[#ff6b00]/30 px-2.5 py-1.5 rounded-sm">
                        [WINDOW OPENS AT {formatTimeOnly(checkInOpenTime.toISOString())}]
                      </div>
                    ) : isPastEnd ? (
                      <div className="text-xs font-mono text-[#ff335c] bg-[#ff1744]/10 border border-[#ff1744]/30 px-2.5 py-1.5 rounded-sm">
                        [SCHEDULE CONCLUDED]
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/30 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5">
                        <IconCheck size={13} className="text-[#00e676]" />
                        <span>DISPATCH WINDOW ACTIVE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactical Punch Actions */}
                <div className="pt-2 border-t border-[#262c38]">
                  {!attendanceRecord && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onCheckIn(assignment.id)}
                      disabled={!canCheckIn || isCheckingIn}
                      className="w-full justify-center shadow-[0_0_12px_rgba(0,240,255,0.2)] font-bold tracking-wider"
                    >
                      {isCheckingIn ? 'LOGGING PUNCH...' : '[ CLOCK IN NOW ]'}
                    </Button>
                  )}

                  {canCheckOut && (
                    <Button
                      variant="amber"
                      size="md"
                      onClick={() => onCheckOut(assignment.id)}
                      disabled={isCheckingOut}
                      className="w-full justify-center shadow-[0_0_12px_rgba(255,107,0,0.2)] font-bold tracking-wider"
                    >
                      {isCheckingOut ? 'RECORDING DEPARTURE...' : '[ CLOCK OUT (END SHIFT) ]'}
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
