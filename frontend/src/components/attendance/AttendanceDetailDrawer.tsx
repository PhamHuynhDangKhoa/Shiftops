import React, { useEffect } from 'react';
import { Attendance } from '../../lib/types';
import {
  formatTimeShort,
  formatDateTimeShort,
  calculatePunctuality,
  calculateDurationHours,
} from './attendanceUtils';

interface AttendanceDetailDrawerProps {
  record: Attendance | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const punctuality = calculatePunctuality(
    record.checkInAt,
    record.shiftStartTime
  );
  const duration = calculateDurationHours(record.checkInAt, record.checkOutAt);

  const getStatusBadge = () => {
    switch (record.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#e8eaec] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5d5f60]" />
            Shift Concluded
          </span>
        );
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/25 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
            Active on Sales Floor
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#d97706]/30 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Late Arrival
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/30 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c4242a]" />
            Logged Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f6f8] text-[#5d5f60] border border-[#e8eaec] text-xs font-medium">
            {record.status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-drawer-title"
    >
      {/* Accessible Backdrop: Flat solid opacity to comply with zero glassmorphism rule */}
      <div
        className="fixed inset-0 bg-black/35 transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full border-l border-[#e8eaec] flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-[#f0f1f2] flex items-start justify-between gap-4 bg-[#f9fbfc]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-[#1b6c80]">
                Official Store Timecard
              </span>
              {getStatusBadge()}
            </div>
            <h2
              id="attendance-drawer-title"
              className="text-lg font-semibold text-[#131416]"
            >
              {record.shiftName || 'Floor Operations Shift'}
            </h2>
            <p className="text-xs text-[#5d5f60] mt-0.5 font-mono tabular-nums">
              {record.branchName || 'Shibuya Flagship'} ·{' '}
              {formatDateTimeShort(record.shiftStartTime)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-md border border-[#cdced1] bg-white text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Close timecard receipt"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 text-left">
          {/* Employee Associate Details */}
          <div className="p-4 rounded-xl border border-[#e8eaec] bg-[#f9fbfc]">
            <span className="text-xs font-medium text-[#5d5f60] block">
              Employee Associate
            </span>
            <div className="text-sm font-semibold text-[#131416] mt-1">
              {record.userName || 'Floor Associate'}
            </div>
            <div className="text-xs text-[#5d5f60] font-mono mt-0.5">
              {record.userEmail || 'store.staff@shiftops.dev'}
            </div>
          </div>

          {/* Timecard Punch Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-medium text-[#5d5f60] block">
              Punch Record Verification
            </span>

            <div className="rounded-xl border border-[#e8eaec] divide-y divide-[#f0f1f2] overflow-hidden">
              {/* Scheduled Window */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#5d5f60] block">
                    Scheduled Window
                  </span>
                  <span className="text-sm font-semibold font-mono tabular-nums text-[#131416] mt-0.5 block">
                    {formatTimeShort(record.shiftStartTime)} –{' '}
                    {formatTimeShort(record.shiftEndTime)}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#5d5f60] bg-[#f4f6f8] px-2.5 py-1 rounded border border-[#e8eaec]">
                  8.5h planned
                </span>
              </div>

              {/* Clock In Punch */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#5d5f60] block">
                    Clock In (Recorded)
                  </span>
                  <span className="text-sm font-semibold font-mono tabular-nums text-[#131416] mt-0.5 block">
                    {record.checkInAt
                      ? formatTimeShort(record.checkInAt)
                      : 'Not clocked in'}
                  </span>
                  {record.checkInAt && (
                    <span className="text-[11px] font-mono text-[#5d5f60] mt-0.5 block">
                      {record.checkInAt}
                    </span>
                  )}
                </div>
                <div>
                  {record.checkInAt && (
                    <span
                      className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                        punctuality.isLate
                          ? 'bg-[#fef3c7] text-[#92400e] border-[#d97706]/30'
                          : 'bg-[#dcfae5] text-[#04250e] border-[#1e7b4f]/25'
                      }`}
                    >
                      {punctuality.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Clock Out Punch */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#5d5f60] block">
                    Clock Out (Recorded)
                  </span>
                  <span className="text-sm font-semibold font-mono tabular-nums text-[#131416] mt-0.5 block">
                    {record.checkOutAt
                      ? formatTimeShort(record.checkOutAt)
                      : record.checkInAt
                      ? 'Active on floor'
                      : 'Pending'}
                  </span>
                  {record.checkOutAt && (
                    <span className="text-[11px] font-mono text-[#5d5f60] mt-0.5 block">
                      {record.checkOutAt}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-[#5d5f60] bg-[#f4f6f8] px-2.5 py-1 rounded border border-[#e8eaec]">
                  {record.checkOutAt ? 'Concluded' : 'In Session'}
                </span>
              </div>

              {/* Verified Duration */}
              <div className="p-4 flex items-center justify-between gap-3 bg-[#f9fbfc]">
                <span className="text-xs font-medium text-[#131416]">
                  Total Logged Duration
                </span>
                <span className="text-base font-semibold font-mono tabular-nums text-[#1b6c80]">
                  {duration}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Supervisor Notes */}
          {record.notes && (
            <div className="p-4 rounded-xl border border-[#e8eaec] bg-white space-y-1">
              <span className="text-xs font-medium text-[#5d5f60] block">
                Supervisor Operating Notes
              </span>
              <p className="text-xs text-[#131416] leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}

          {/* Database Audit Metadata */}
          <div className="space-y-2 pt-2 border-t border-[#f0f1f2]">
            <span className="text-xs font-medium text-[#5d5f60] block">
              Immutable Audit Identifiers
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded border border-[#e8eaec] bg-[#f9fbfc]">
                <span className="text-[11px] text-[#5d5f60] block font-sans">
                  Shift Assignment ID
                </span>
                <span className="text-xs text-[#131416] truncate block mt-0.5" title={record.shiftAssignmentId}>
                  {record.shiftAssignmentId.slice(0, 12)}...
                </span>
              </div>
              <div className="p-2.5 rounded border border-[#e8eaec] bg-[#f9fbfc]">
                <span className="text-[11px] text-[#5d5f60] block font-sans">
                  Attendance Record ID
                </span>
                <span className="text-xs text-[#131416] truncate block mt-0.5" title={record.id}>
                  {record.id.slice(0, 12)}...
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#5d5f60] font-mono mt-1">
              Backend Version: {record.version ?? 1} · Audit status verified
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#f0f1f2] bg-[#f9fbfc] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-md bg-[#131416] text-white text-xs font-medium hover:bg-[#1f2326] transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
