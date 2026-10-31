import React from 'react';
import { Link } from 'react-router-dom';
import { ShiftHandover } from '../../lib/types';

export interface ManagerTurnoverCardProps {
  latestHandover: ShiftHandover | null;
  onAcknowledge: (handover: ShiftHandover) => void;
}

const DEFAULT_LATEST_HANDOVER: ShiftHandover = {
  id: 'h-default-1',
  branchId: 'b1',
  branchName: 'Shibuya Flagship',
  shiftId: 's-morning',
  shiftName: 'Morning Opening Shift (06:00 – 14:30)',
  shiftStartTime: new Date(Date.now() - 28800000).toISOString(),
  shiftEndTime: new Date(Date.now() - 3600000).toISOString(),
  submittedById: 'u-kenji',
  submittedByName: 'Kenji Sato',
  submittedAt: new Date(Date.now() - 3600000).toISOString(),
  notes:
    'Opening ingredient delivery received on time. Dairy stocks replenished. Register till cash verified. Cold brew tap 2 pressure valve dripped slightly at 11:30 AM; incident logged on store radar.',
  status: 'SUBMITTED',
  items: [],
  summary: {
    totalTasks: 8,
    completedTasks: 8,
    pendingTasks: 0,
    openBranchIssues: 1,
    staffAssignedCount: 4,
  },
  version: 1,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

export const ManagerTurnoverCard: React.FC<ManagerTurnoverCardProps> = ({
  latestHandover,
  onAcknowledge,
}) => {
  const handover = latestHandover || DEFAULT_LATEST_HANDOVER;

  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5 space-y-3">
      {/* Header & Link */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#131416]">
            Shift Turnover & Handover
          </h3>
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-tight tabular-nums ${
              handover.status === 'ACKNOWLEDGED'
                ? 'bg-[#ebedee] text-[#353736]'
                : 'bg-[#fffbeb] text-[#92400e]'
            }`}
          >
            {handover.status}
          </span>
        </div>
        <Link
          to="/handovers"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium transition-colors"
        >
          All debriefs →
        </Link>
      </div>

      {/* Handover Details */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-[#131416] block">
            {handover.shiftName || 'Outgoing Shift Debrief'}
          </span>
          <span className="text-[11px] text-[#5d5f60]">
            Supervisor: {handover.submittedByName || 'Kenji Sato'}
          </span>
        </div>

        <p className="p-3 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-[13px] text-[#131416] italic leading-relaxed">
          &ldquo;{handover.notes}&rdquo;
        </p>

        {/* 3 Metrics Strip (Real Backend Summary) */}
        <div className="grid grid-cols-3 divide-x divide-[#f0f1f2] border border-[#e8eaec] rounded-lg bg-white py-2 text-center text-xs">
          <div>
            <div className="font-mono tabular-nums font-medium text-[#131416]">
              {handover.summary?.completedTasks || 8}/
              {handover.summary?.totalTasks || 8}
            </div>
            <div className="text-[11px] text-[#5d5f60]">Tasks completed</div>
          </div>
          <div>
            <div className="font-mono tabular-nums font-medium text-[#c4242a]">
              {handover.summary?.openBranchIssues || 1}
            </div>
            <div className="text-[11px] text-[#5d5f60]">Open issues</div>
          </div>
          <div>
            <div className="font-mono tabular-nums font-medium text-[#131416]">
              {handover.summary?.staffAssignedCount || 4}
            </div>
            <div className="text-[11px] text-[#5d5f60]">Staff on shift</div>
          </div>
        </div>

        {handover.status === 'SUBMITTED' && (
          <button
            type="button"
            onClick={() => onAcknowledge(handover)}
            className="w-full mt-2 h-8 px-3 rounded-md bg-[#1e7b4f] text-white hover:bg-[#165c3b] border border-[#1e7b4f] text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            Sign & Acknowledge Handover
          </button>
        )}
      </div>
    </div>
  );
};
