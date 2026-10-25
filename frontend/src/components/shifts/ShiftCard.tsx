import React from 'react';
import { Shift, ShiftStatus } from '../../lib/types';
import { ShiftStatusBadge } from './ShiftStatusBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { IconClock, IconMapPin, IconUsers, IconClose } from '../ui/Icons';

interface ShiftCardProps {
  shift: Shift;
  isStaff: boolean;
  onAssignClick: (shift: Shift) => void;
  onRemoveAssignment: (shiftId: string, userId: string) => void;
  onUpdateStatus: (shiftId: string, status: ShiftStatus) => void;
  onDeleteShift: (shiftId: string) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  isStaff,
  onAssignClick,
  onRemoveAssignment,
  onUpdateStatus,
  onDeleteShift,
}) => {
  return (
    <Card className="flex flex-col justify-between gap-4 p-5 hover:border-zinc-300 transition-colors">
      <div className="space-y-3">
        {/* Top: Shift Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-zinc-900">
              {shift.name || 'General Shift'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
              <IconMapPin size={12} className="text-zinc-400" />
              <span>{shift.branchName}</span>
            </div>
          </div>
          <ShiftStatusBadge status={shift.status} />
        </div>

        {/* Time Interval & Overnight Tag */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="flex items-center gap-1.5 text-zinc-800 tabular-nums font-semibold bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
            <IconClock size={13} className="text-zinc-500" />
            {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
          </span>
          {shift.overnight && (
            <Badge variant="cyan" size="sm">
              Overnight
            </Badge>
          )}
        </div>

        {/* Notes */}
        {shift.notes && (
          <p className="text-xs text-zinc-600 bg-zinc-50/70 border border-zinc-200/60 p-2.5 rounded-lg leading-relaxed">
            {shift.notes}
          </p>
        )}

        {/* Assigned Staff */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#5d5f60] mb-2">
            <span className="flex items-center gap-1.5">
              <IconUsers size={13} className="text-[#5d5f60]" />
              Assigned staff ({shift.assignments.length})
            </span>
          </div>

          {shift.assignments.length === 0 ? (
            <span className="text-xs text-zinc-400 italic">No staff assigned</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shift.assignments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 border border-zinc-200/80 text-zinc-800 px-2.5 py-1 rounded-full font-medium"
                >
                  <span>{a.userName}</span>
                  {!isStaff && shift.status === 'DRAFT' && (
                    <button
                      onClick={() => onRemoveAssignment(shift.id, a.userId)}
                      title="Remove assignment"
                      className="text-zinc-400 hover:text-rose-600 cursor-pointer ml-0.5 transition-colors"
                    >
                      <IconClose size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manager Actions */}
      {!isStaff && (
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {shift.status === 'DRAFT' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssignClick(shift)}
                >
                  Assign Staff
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'PUBLISHED')}
                >
                  Publish
                </Button>
              </>
            )}

            {shift.status === 'PUBLISHED' && (
              <>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'COMPLETED')}
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'CANCELLED')}
                >
                  Cancel
                </Button>
              </>
            )}

            {shift.status === 'CANCELLED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUpdateStatus(shift.id, 'DRAFT')}
              >
                Reopen as Draft
              </Button>
            )}
          </div>

          {shift.status === 'DRAFT' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this shift?')) {
                  onDeleteShift(shift.id);
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
