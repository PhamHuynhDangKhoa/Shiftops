import React from 'react';
import { Link } from 'react-router-dom';
import { ShiftHandover } from '../../lib/types';
import { IconHandshake, IconArrowUpRight } from '../ui/Icons';
import { Button } from '../ui/Button';

export interface ManagerTurnoverCardProps {
  latestHandover: ShiftHandover | null;
  onAcknowledge: (handover: ShiftHandover) => void;
}

export const ManagerTurnoverCard: React.FC<ManagerTurnoverCardProps> = ({
  latestHandover,
  onAcknowledge,
}) => {
  return (
    <div className="p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <h3 className="text-sm font-bold text-[#131416] flex items-center gap-2">
          <IconHandshake size={16} />
          <span>Shift Turnover & Handover</span>
        </h3>
        <Link
          to="/handovers"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Full Log</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>

      {latestHandover ? (
        <div className="p-3.5 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#131416]">
              {latestHandover.shiftName || 'Outgoing Shift Debrief'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight tabular-nums ${
                latestHandover.status === 'ACKNOWLEDGED'
                  ? 'bg-[#ebedee] text-[#5d5f60]'
                  : latestHandover.status === 'SUBMITTED'
                  ? 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20'
                  : 'bg-[#ebedee] text-[#5d5f60]'
              }`}
            >
              {latestHandover.status}
            </span>
          </div>

          <p className="text-xs text-[#5d5f60] italic bg-white p-2.5 rounded-md border border-[#e8eaec]">
            &ldquo;{latestHandover.notes || 'No handover notes provided.'}&rdquo;
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[#5d5f60] pt-1">
            <div className="p-1.5 rounded-md bg-[#f4f6f8]">
              <span className="font-bold text-[#131416] block text-xs tabular-nums">
                {latestHandover.summary?.completedTasks || 0}
              </span>
              Tasks done
            </div>
            <div className="p-1.5 rounded-md bg-[#f4f6f8]">
              <span className="font-bold text-[#131416] block text-xs tabular-nums">
                {latestHandover.summary?.pendingTasks || 0}
              </span>
              Pending
            </div>
            <div className="p-1.5 rounded-md bg-[#f4f6f8]">
              <span className="font-bold text-[#131416] block text-xs tabular-nums">
                {latestHandover.summary?.openBranchIssues || 0}
              </span>
              Issues
            </div>
          </div>

          {latestHandover.status === 'SUBMITTED' && (
            <Button
              variant="dark"
              size="sm"
              onClick={() => onAcknowledge(latestHandover)}
              className="w-full mt-2"
            >
              Sign & Acknowledge Handover
            </Button>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-[#5d5f60]">
          No shift handover recorded yet.
        </div>
      )}
    </div>
  );
};
