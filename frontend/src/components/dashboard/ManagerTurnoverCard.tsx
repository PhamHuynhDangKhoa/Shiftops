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
    'Opening ingredient delivery received on time. Dairy stocks replenished. Register till cash verified ($250.00 float). Cold brew tap 2 pressure valve dripped slightly at 11:30 AM; maintenance ticket logged on store radar.',
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
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      {/* Header & Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-[#131416]">
            Shift Turnover Debrief
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-tight tabular-nums ${
              handover.status === 'ACKNOWLEDGED'
                ? 'bg-[#dcfce7] text-[#14532d]'
                : 'bg-[#fef3c7] text-[#92400e]'
            }`}
          >
            {handover.status}
          </span>
        </div>
        <Link
          to="/handovers"
          className="text-xs text-[#131416] hover:underline font-semibold transition-colors"
        >
          All debriefs →
        </Link>
      </div>

      {/* Handover Details */}
      <div className="space-y-3 text-xs">
        <div>
          <span className="font-semibold text-sm text-[#131416] block">
            {handover.shiftName || 'Outgoing Shift Debrief'}
          </span>
          <span className="text-xs text-[#64748b]">
            Outgoing Lead: {handover.submittedByName || 'Kenji Sato'}
          </span>
        </div>

        {/* Debrief Note in Tone Container (Zero Card Borders) */}
        <p className="p-4 rounded-xl bg-[#f8f9fa] text-xs text-[#334155] italic leading-relaxed">
          &ldquo;{handover.notes}&rdquo;
        </p>

        {/* 3 Metrics Strip in Tone Container (Zero Card Borders) */}
        <div className="grid grid-cols-3 gap-2 bg-[#f8f9fa] rounded-xl p-3 text-center">
          <div>
            <div className="font-sans font-bold tabular-nums text-sm text-[#131416]">
              {handover.summary?.completedTasks || 8}/
              {handover.summary?.totalTasks || 8}
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">Tasks done</div>
          </div>
          <div>
            <div className="font-sans font-bold tabular-nums text-sm text-[#c4242a]">
              {handover.summary?.openBranchIssues || 1}
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">Open issues</div>
          </div>
          <div>
            <div className="font-sans font-bold tabular-nums text-sm text-[#131416]">
              {handover.summary?.staffAssignedCount || 4}
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">Staff on shift</div>
          </div>
        </div>

        {handover.status === 'SUBMITTED' && (
          <button
            type="button"
            onClick={() => onAcknowledge(handover)}
            className="w-full mt-2 h-10 px-4 rounded-xl bg-[#1e7b4f] text-white hover:bg-[#165c3b] text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Sign & Acknowledge Handover</span>
          </button>
        )}
      </div>
    </div>
  );
};
