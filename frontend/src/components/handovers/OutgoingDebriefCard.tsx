import React from 'react';
import { Shift } from '../../lib/types';
import { IconClock, IconUser, IconPlus } from '../ui/Icons';
import { formatHandoverTime } from './handoverUtils';

interface OutgoingDebriefCardProps {
  shifts?: Shift[];
  onOpenDebrief: (shiftId: string) => void;
}

export const OutgoingDebriefCard: React.FC<OutgoingDebriefCardProps> = ({
  shifts,
  onOpenDebrief,
}) => {
  return (
    <div className="border border-[#e8eaec] bg-white rounded-lg p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8eaec]">
        <div>
          <h2 className="text-[16px] font-semibold text-[#131416]">
            Outgoing Shift Debrief
          </h2>
          <p className="text-[13px] text-[#5d5f60] mt-0.5">
            Prepare, update, and submit turnover notes and checklist status for the next shift crew
          </p>
        </div>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-[#f9fbfc] border border-[#e8eaec] rounded-lg flex flex-col justify-between gap-3 transition-colors hover:border-[#cdced1]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#5d5f60] font-medium">
                    {shift.branchName}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-[#cde5eb] bg-[#eef7f9] text-[#1b6c80] uppercase">
                    {shift.status}
                  </span>
                </div>

                <h3 className="text-[14px] font-semibold text-[#131416]">
                  {shift.name || 'Operational Shift'}
                </h3>

                <div className="text-[13px] text-[#5d5f60] flex items-center gap-1.5 tabular-nums">
                  <IconClock size={14} className="text-[#8c8f92] flex-shrink-0" />
                  <span>
                    {formatHandoverTime(shift.startTime)} – {formatHandoverTime(shift.endTime)}
                  </span>
                </div>

                <div className="text-[13px] text-[#5d5f60] flex items-center gap-1.5 truncate">
                  <IconUser size={14} className="text-[#8c8f92] flex-shrink-0" />
                  <span className="truncate">
                    Crew: {shift.assignments?.map((a) => a.userName).join(', ') || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e8eaec] flex justify-end">
                <button
                  type="button"
                  onClick={() => onOpenDebrief(shift.id)}
                  className="w-full h-8 text-[13px] font-medium rounded border border-[#131416] bg-[#131416] text-white hover:bg-black transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <IconPlus size={13} />
                  <span>Prepare Debrief</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-[13px] text-[#5d5f60]">
          No operational shifts currently awaiting handover debrief.
        </div>
      )}
    </div>
  );
};
