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
    <div className="bg-[#11141a] border border-[#262c38] p-4 flex flex-col justify-between gap-4 clip-chamfer-card hover:border-[#384152] transition-colors">
      <div className="space-y-3">
        {/* Top: Shift Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-mono font-bold text-sm text-white tracking-wider uppercase">
              {shift.name || 'General Shift'}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#9da8b9] mt-0.5">
              <IconMapPin size={11} className="text-[#00f0ff]" />
              <span>{shift.branchName}</span>
            </div>
          </div>
          <ShiftStatusBadge status={shift.status} />
        </div>

        {/* Time Interval & Overnight Tag */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#00f0ff] tabular-nums font-bold bg-[#161922] border border-[#2a2f3d] px-2.5 py-1 rounded-sm">
            <IconClock size={12} className="text-[#00f0ff]" />
            {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
          </span>
          {shift.overnight && (
            <Badge variant="cyan" size="sm">
              OVERNIGHT
            </Badge>
          )}
        </div>

        {/* Notes */}
        {shift.notes && (
          <p className="text-xs text-[#9da8b9] bg-[#161922] border border-[#262c38] p-2.5 rounded-sm leading-relaxed font-mono">
            // {shift.notes}
          </p>
        )}

        {/* Assigned Staff */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <IconUsers size={12} className="text-[#00f0ff]" />
              ASSIGNED OPERATORS ({shift.assignments.length})
            </span>
          </div>

          {shift.assignments.length === 0 ? (
            <span className="text-xs font-mono text-[#606c80] italic">[ NO OPERATORS ASSIGNED ]</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shift.assignments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#181c24] border border-[#2a2f3d] text-[#f1f5f9] px-2.5 py-1 rounded-sm font-mono font-medium"
                >
                  <span>{a.userName}</span>
                  {!isStaff && shift.status === 'DRAFT' && (
                    <button
                      onClick={() => onRemoveAssignment(shift.id, a.userId)}
                      title="Remove assignment"
                      className="text-[#606c80] hover:text-[#ff1744] cursor-pointer ml-1 transition-colors"
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
        <div className="border-t border-[#1e222b] pt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {shift.status === 'DRAFT' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssignClick(shift)}
                >
                  [ + ASSIGN ]
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'PUBLISHED')}
                >
                  [ PUBLISH ]
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
                  [ REVERT DRAFT ]
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateStatus(shift.id, 'COMPLETED')}
                >
                  [ COMPLETE ]
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
                [ CANCEL ]
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
              className="text-xs font-mono text-[#606c80] hover:text-[#ff1744] transition-colors cursor-pointer px-1 py-0.5"
              title="Delete draft shift"
            >
              [ PURGE ]
            </button>
          )}
        </div>
      )}
    </div>
  );
};
