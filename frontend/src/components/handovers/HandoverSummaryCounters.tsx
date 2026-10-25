import React from 'react';
import { HandoverDerivedSummary } from '../../lib/types';
import { Card } from '../ui/Card';

interface HandoverSummaryCountersProps {
  summary?: HandoverDerivedSummary;
}

export const HandoverSummaryCounters: React.FC<HandoverSummaryCountersProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium text-[#5d5f60] block">
          Total tasks
        </span>
        <span className="text-2xl font-normal tabular-nums text-[#131416] block">
          {summary?.totalTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium text-[#5d5f60] block">
          Completed tasks
        </span>
        <span className="text-2xl font-normal tabular-nums text-[#1e7b4f] block">
          {summary?.completedTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium text-[#5d5f60] block">
          Pending handover
        </span>
        <span className="text-2xl font-normal tabular-nums text-[#92400e] block">
          {summary?.pendingTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium text-[#5d5f60] block">
          Open incidents
        </span>
        <span className="text-2xl font-normal tabular-nums text-[#c4242a] block">
          {summary?.openBranchIssues ?? 0}
        </span>
      </Card>
    </div>
  );
};
