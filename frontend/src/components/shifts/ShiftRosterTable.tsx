import React from 'react';
import { Shift, ShiftStatus } from '../../lib/types';
import { formatShiftDurationHours, formatTimeShort } from './shiftRosterUtils';

interface ShiftRosterTableProps {
  shifts: Shift[];
  isStaff: boolean;
  onAssignClick: (shift: Shift) => void;
  onRemoveAssignment: (shiftId: string, userId: string) => void;
  onUpdateStatus: (shiftId: string, status: ShiftStatus) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const ShiftRosterTable: React.FC<ShiftRosterTableProps> = ({
  shifts,
  isStaff,
  onAssignClick,
  onRemoveAssignment,
  onUpdateStatus,
  onDeleteShift,
}) => {
  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#f0f1f2] text-[#5d5f60] font-normal">
              <th className="py-2.5 px-4 font-normal">Shift window</th>
              <th className="py-2.5 px-3 font-normal">Shift title</th>
              <th className="py-2.5 px-3 font-normal">Assigned staff</th>
              <th className="py-2.5 px-3 font-normal text-right">Hours</th>
              <th className="py-2.5 px-3 font-normal text-center">Status</th>
              {!isStaff && (
                <th className="py-2.5 px-4 font-normal text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f2]">
            {shifts.map((shift) => {
              const startDate = new Date(shift.startTime).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              const duration = formatShiftDurationHours(
                shift.startTime,
                shift.endTime
              );

              return (
                <tr
                  key={shift.id}
                  className="h-12 hover:bg-[#f9fbfc] transition-colors"
                >
                  {/* Shift Window */}
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-xs text-[#131416] block">
                      {startDate}
                    </span>
                    <span className="text-[11px] text-[#5d5f60] font-mono tabular-nums">
                      {formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)}
                      {shift.overnight && (
                        <span className="ml-1 text-[11px] text-[#1b6c80] font-medium">
                          (Overnight)
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Shift Title & Branch */}
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-xs text-[#131416] block">
                      {shift.name || 'Floor Shift'}
                    </span>
                    <span className="text-[11px] text-[#5d5f60]">
                      {shift.branchName}
                    </span>
                  </td>

                  {/* Assigned Staff */}
                  <td className="py-2.5 px-3">
                    {shift.assignments.length === 0 ? (
                      <span className="text-[11px] text-[#92400e] font-medium bg-[#fffbeb] px-2 py-0.5 rounded border border-[#92400e]/30">
                        Unassigned
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {shift.assignments.map((a) => (
                          <div
                            key={a.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4f6f8] border border-[#cdced1] text-xs text-[#131416]"
                          >
                            <span>{a.userName}</span>
                            {!isStaff && shift.status === 'DRAFT' && (
                              <button
                                type="button"
                                onClick={() => onRemoveAssignment(shift.id, a.userId)}
                                title="Remove staff assignment"
                                className="text-[#5d5f60] hover:text-[#c4242a] cursor-pointer ml-0.5 inline-flex items-center"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-[#131416]">
                    {duration}h
                  </td>

                  {/* Status Pill */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium tabular-nums ${
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
                  </td>

                  {/* Actions (Manager only) */}
                  {!isStaff && (
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {shift.status === 'DRAFT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onAssignClick(shift)}
                              className="h-7 px-2.5 rounded border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                            >
                              Assign
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(shift.id, 'PUBLISHED')}
                              className="h-7 px-2.5 rounded bg-[#131416] text-white text-xs font-medium hover:bg-[#1f2326] transition-colors cursor-pointer"
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteShift(shift.id)}
                              className="h-7 px-2 rounded border border-[#cdced1] text-xs font-medium text-[#5d5f60] hover:text-[#c4242a] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {shift.status === 'PUBLISHED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(shift.id, 'COMPLETED')}
                              className="h-7 px-2 rounded border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(shift.id, 'CANCELLED')}
                              className="h-7 px-2 rounded border border-[#cdced1] text-xs font-medium text-[#5d5f60] hover:text-[#c4242a] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {shift.status === 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(shift.id, 'DRAFT')}
                            className="h-7 px-2.5 rounded border border-[#cdced1] bg-white text-xs font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
