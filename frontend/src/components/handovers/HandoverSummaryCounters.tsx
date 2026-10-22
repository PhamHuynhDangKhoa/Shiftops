import React from 'react';
import { HandoverDerivedSummary } from '../../lib/types';
import { Card } from '../ui/Card';

interface HandoverSummaryCountersProps {
  summary?: HandoverDerivedSummary;
}

export const HandoverSummaryCounters: React.FC<HandoverSummaryCountersProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">
          Total Tasks
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-zinc-950 block">
          {summary?.totalTasks ?? 0}
        </span>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-emerald-700 uppercase tracking-wider block">
          Completed Tasks
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-emerald-800 block">
          {summary?.completedTasks ?? 0}
        </span>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-amber-700 uppercase tracking-wider block">
          Pending Handover
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-amber-800 block">
          {summary?.pendingTasks ?? 0}
        </span>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-rose-700 uppercase tracking-wider block">
          Open Incidents
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-rose-800 block">
          {summary?.openBranchIssues ?? 0}
        </span>
      </Card>
    </div>
  );
};
