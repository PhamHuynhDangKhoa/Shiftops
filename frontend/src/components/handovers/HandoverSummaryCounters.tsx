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
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 block">
          Total Tasks
        </span>
        <span className="text-2xl font-bold tabular-nums text-zinc-900 block">
          {summary?.totalTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 block">
          Completed Tasks
        </span>
        <span className="text-2xl font-bold tabular-nums text-emerald-600 block">
          {summary?.completedTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 block">
          Pending Handover
        </span>
        <span className="text-2xl font-bold tabular-nums text-amber-600 block">
          {summary?.pendingTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3.5 space-y-1">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 block">
          Open Issues
        </span>
        <span className="text-2xl font-bold tabular-nums text-rose-600 block">
          {summary?.openBranchIssues ?? 0}
        </span>
      </Card>
    </div>
  );
};
