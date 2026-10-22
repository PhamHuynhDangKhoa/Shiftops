import React from 'react';
import { Shift, ShiftStatus } from '../../lib/types';
import { ShiftStatusBadge } from './ShiftStatusBadge';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
    <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors">
      <div className="space-y-3">
        {/* Top: Shift Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-zinc-950 tracking-tight leading-tight">
              {shift.name || 'General Shift'}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 mt-0.5">
              <IconMapPin size={11} className="text-zinc-400" />
              <span>{shift.branchName}</span>
            </div>
          </div>
          <ShiftStatusBadge status={shift.status} />
        </div>

        {/* Time Interval & Overnight Tag */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="flex items-center gap-1.5 text-zinc-800 tabular-nums font-medium bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
            <IconClock size={12} className="text-zinc-500" />
            {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
          </span>
          {shift.overnight && (
            <Badge variant="brand" size="sm">
              Overnight
            </Badge>
          )}
        </div>

        {/* Notes */}
        {shift.notes && (
          <p className="text-xs text-zinc-600 bg-zinc-50/70 border border-zinc-100 p-2 rounded leading-relaxed">
            {shift.notes}
          </p>
        )}

        {/* Assigned Staff */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <IconUsers size={12} className="text-zinc-400" />
              Assigned ({shift.assignments.length})
            </span>
          </div>

          {shift.assignments.length === 0 ? (
            <span className="text-xs text-zinc-400 italic">No personnel assigned</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shift.assignments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 text-xs bg-zinc-100 border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-medium"
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

      {/* Action Footer for Management */}
      {!isStaff && (
        <div className="border-t border-zinc-100 pt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {shift.status === 'DRAFT' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssignClick(shift)}
                >
                  + Assign
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
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'DRAFT')}
                >
                  Revert to Draft
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'COMPLETED')}
                >
                  Mark Complete
                </Button>
              </>
            )}

            {(shift.status === 'DRAFT' || shift.status === 'PUBLISHED') && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('Cancel this operational shift?')) {
                    onUpdateStatus(shift.id, 'CANCELLED');
                  }
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          {shift.status === 'DRAFT' && (
            <button
              onClick={() => {
                if (confirm('Delete this draft shift permanently?')) {
                  onDeleteShift(shift.id);
                }
              }}
              className="text-xs font-mono text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer px-1 py-0.5"
              title="Delete draft shift"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
