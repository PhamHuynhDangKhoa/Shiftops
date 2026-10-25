import React from 'react';
import { Shift, Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
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
  if (!isoString) return '-';
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
  if (!isoString) return '-';
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
    <Card className="mb-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Shift Punch Station
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Clock in or out for your assigned shifts today
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          Loading assigned shifts...
        </div>
      ) : !shifts || shifts.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-sm">
          <p className="font-semibold text-zinc-800">No shifts scheduled for today</p>
          <p className="text-xs text-zinc-500 mt-1">
            Check the Roster tab to inspect upcoming assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-zinc-900 text-sm">{shift.name}</span>
                    {attendanceRecord ? (
                      <AttendanceStatusBadge
                        status={attendanceRecord.status}
                        late={attendanceRecord.late}
                        size="sm"
                      />
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Unconfirmed
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-zinc-600">
                    <div className="flex items-center gap-1.5">
                      <IconClock size={13} className="text-zinc-400" />
                      <span className="font-medium text-zinc-900 tabular-nums">
                        {formatTimeOnly(shift.startTime)} – {formatTimeOnly(shift.endTime)}
                      </span>
                    </div>

                    {shift.branchName && (
                      <div className="flex items-center gap-1.5">
                        <IconMapPin size={13} className="text-zinc-400" />
                        <span className="truncate">{shift.branchName}</span>
                      </div>
                    )}
                  </div>

                  {attendanceRecord && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-200/60 text-xs space-y-1">
                      <div className="flex justify-between text-zinc-500">
                        <span>Check In:</span>
                        <span className="font-medium text-zinc-900 tabular-nums">
                          {formatDateTime(attendanceRecord.checkInAt)}
                        </span>
                      </div>
                      {attendanceRecord.checkOutAt && (
                        <div className="flex justify-between text-zinc-500">
                          <span>Check Out:</span>
                          <span className="font-medium text-zinc-900 tabular-nums">
                            {formatDateTime(attendanceRecord.checkOutAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {canCheckIn && (
                    <Button
                      variant="emerald"
                      size="sm"
                      className="w-full gap-1.5 text-xs font-semibold"
                      isLoading={isCheckingIn}
                      onClick={() => onCheckIn(assignment.id)}
                    >
                      <IconClock size={14} />
                      <span>Clock In Now</span>
                    </Button>
                  )}

                  {canCheckOut && (
                    <Button
                      variant="amber"
                      size="sm"
                      className="w-full gap-1.5 text-xs font-semibold"
                      isLoading={isCheckingOut}
                      onClick={() => onCheckOut(assignment.id)}
                    >
                      <IconClock size={14} />
                      <span>Clock Out</span>
                    </Button>
                  )}

                  {!canCheckIn && !canCheckOut && attendanceRecord?.checkOutAt && (
                    <div className="py-1.5 text-center text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg flex items-center justify-center gap-1">
                      <IconCheck size={14} />
                      <span>Shift Completed</span>
                    </div>
                  )}

                  {!canCheckIn && !canCheckOut && !attendanceRecord && isTooEarly && (
                    <div className="py-1.5 text-center text-xs text-zinc-500 bg-zinc-100 rounded-lg">
                      Punches open 15m prior
                    </div>
                  )}

                  {!canCheckIn && !canCheckOut && !attendanceRecord && isPastEnd && (
                    <div className="py-1.5 text-center text-xs text-rose-700 bg-rose-50 rounded-lg">
                      Shift window closed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
