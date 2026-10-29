import React from 'react';
import { Shift, ShiftStatus } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { formatShiftDurationHours, formatTimeShort } from './shiftRosterUtils';

interface ShiftDetailModalProps {
  shift: Shift | null;
  isStaff: boolean;
  onClose: () => void;
  onAssignClick: (shift: Shift) => void;
  onRemoveAssignment: (shiftId: string, userId: string) => void;
  onUpdateStatus: (shiftId: string, status: ShiftStatus) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shift,
  isStaff,
  onClose,
  onAssignClick,
  onRemoveAssignment,
  onUpdateStatus,
  onDeleteShift,
}) => {
  if (!shift) return null;

  const startDate = new Date(shift.startTime).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const duration = formatShiftDurationHours(shift.startTime, shift.endTime);

  return (
    <Modal
      isOpen={!!shift}
      onClose={onClose}
      title={shift.name || 'Floor Shift Details'}
      description={`${startDate} · ${shift.branchName}`}
    >
      <div className="space-y-4 text-xs">
        {/* Timing Strip */}
        <div className="p-3 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#5d5f60] block">
              Scheduled window
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-[#131416]">
              {formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#5d5f60] block">Duration</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-[#131416]">
              {duration} hours
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-1">
          <span className="font-medium text-[#5d5f60]">Roster status:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-tight tabular-nums ${
              shift.status === 'PUBLISHED'
                ? 'bg-[#dcfae5] text-[#04250e]'
                : shift.status === 'DRAFT'
                ? 'bg-[#fffbeb] text-[#92400e]'
                : shift.status === 'COMPLETED'
                ? 'bg-[#ebedee] text-[#353736]'
                : 'bg-[#ffedea] text-[#831c1e]'
            }`}
          >
            {shift.status}
          </span>
        </div>

        {/* Assigned Staff */}
        <div>
          <div className="flex items-center justify-between pb-1.5 border-b border-[#f0f1f2]">
            <span className="font-medium text-[#131416]">
              Assigned personnel ({shift.assignments.length})
            </span>
            {!isStaff && shift.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssignClick(shift);
                }}
                className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium cursor-pointer"
              >
                + Assign staff
              </button>
            )}
          </div>

          <div className="pt-2 space-y-1.5">
            {shift.assignments.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#92400e] bg-[#fffbeb] rounded-lg border border-[#92400e]/20">
                No staff assigned yet. This shift slot is unstaffed.
              </div>
            ) : (
              shift.assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-2 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-[#131416] block">
                      {asg.userName}
                    </span>
                    <span className="text-[11px] text-[#5d5f60]">
                      {asg.userRole} · {asg.userEmail}
                    </span>
                  </div>
                  {!isStaff && shift.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => onRemoveAssignment(shift.id, asg.userId)}
                      className="text-xs text-[#c4242a] hover:underline cursor-pointer px-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shift Notes */}
        {shift.notes && (
          <div className="space-y-1">
            <span className="font-medium text-[#5d5f60] text-[11px] uppercase tracking-wider">
              Operating Notes
            </span>
            <p className="p-3 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-xs text-[#131416] leading-relaxed">
              {shift.notes}
            </p>
          </div>
        )}

        {/* Manager Action Footer */}
        {!isStaff && (
          <div className="pt-3 border-t border-[#f0f1f2] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {shift.status === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(shift.id, 'PUBLISHED');
                      onClose();
                    }}
                    className="h-8 px-3 rounded bg-[#131416] text-white text-xs font-medium hover:bg-[#1f2326] transition-colors cursor-pointer"
                  >
                    Publish Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAssignClick(shift);
                    }}
                    className="h-8 px-3 rounded border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                  >
                    Assign Staff
                  </button>
                </>
              )}

              {shift.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(shift.id, 'COMPLETED');
                    onClose();
                  }}
                  className="h-8 px-3 rounded bg-[#1e7b4f] text-white text-xs font-medium hover:bg-[#186440] transition-colors cursor-pointer"
                >
                  Mark Completed
                </button>
              )}

              {shift.status === 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(shift.id, 'DRAFT');
                    onClose();
                  }}
                  className="h-8 px-3 rounded border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                >
                  Reopen Draft
                </button>
              )}
            </div>

            {shift.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => {
                  onDeleteShift(shift.id);
                  onClose();
                }}
                className="text-xs text-[#c4242a] hover:underline cursor-pointer"
              >
                Cancel Shift
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
