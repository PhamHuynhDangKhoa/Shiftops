import React from 'react';
import { HandoverDerivedSummary } from '../../lib/types';

interface HandoverSummaryCountersProps {
  summary?: HandoverDerivedSummary;
}

export const HandoverSummaryCounters: React.FC<HandoverSummaryCountersProps> = ({ summary }) => {
  const total = summary?.totalTasks ?? 0;
  const completed = summary?.completedTasks ?? 0;
  const issues = summary?.openBranchIssues ?? 0;
  const staffCount = summary?.staffAssignedCount ?? 0;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 100;

  return (
    <div className="border border-[#e8eaec] bg-white rounded-md divide-y lg:divide-y-0 lg:divide-x divide-[#e8eaec] grid grid-cols-2 lg:grid-cols-4">
      {/* 1. Checklist resolution */}
      <div className="p-3">
        <span className="text-[12px] text-[#5d5f60] block">
          Checklist completion
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-mono text-[16px] font-semibold tabular-nums text-[#131416]">
            {completed}/{total}
          </span>
          <span className="font-mono text-[11px] text-[#5d5f60] tabular-nums">
            ({completionPct}%)
          </span>
        </div>
      </div>

      {/* 2. Till & safe float reconciliation */}
      <div className="p-3">
        <span className="text-[12px] text-[#5d5f60] block">
          Register cash float
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-mono text-[16px] font-semibold tabular-nums text-[#131416]">
            ¥45,000
          </span>
          <span className="font-mono text-[11px] text-[#5d5f60] tabular-nums">
            (±¥0 variance)
          </span>
        </div>
      </div>

      {/* 3. Open Issues (Only colored if issues > 0) */}
      <div className="p-3">
        <span className="text-[12px] text-[#5d5f60] block">
          Open branch tickets
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            className={`font-mono text-[16px] font-semibold tabular-nums ${
              issues > 0 ? 'text-[#92400e]' : 'text-[#131416]'
            }`}
          >
            {issues}
          </span>
          <span className="text-[12px] text-[#5d5f60]">
            {issues === 1 ? 'ticket pending' : 'tickets pending'}
          </span>
        </div>
      </div>

      {/* 4. Crew transition */}
      <div className="p-3">
        <span className="text-[12px] text-[#5d5f60] block">
          Shift roster
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-mono text-[16px] font-semibold tabular-nums text-[#131416]">
            {staffCount}
          </span>
          <span className="text-[12px] text-[#5d5f60]">staff signed off</span>
        </div>
      </div>
    </div>
  );
};
