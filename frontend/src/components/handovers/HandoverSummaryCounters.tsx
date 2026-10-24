import React from 'react';
import { HandoverDerivedSummary } from '../../lib/types';
import { Card } from '../ui/Card';

interface HandoverSummaryCountersProps {
  summary?: HandoverDerivedSummary;
}

export const HandoverSummaryCounters: React.FC<HandoverSummaryCountersProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card compact className="p-3 bg-[#161922] border border-[#262c38] space-y-1" chamfer>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a94a6] block">
          Total Tasks
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-white block">
          {summary?.totalTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3 bg-[#161922] border border-[#262c38] space-y-1" chamfer>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#00e676] block">
          Completed Tasks
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-[#00e676] block">
          {summary?.completedTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3 bg-[#161922] border border-[#262c38] space-y-1" chamfer>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff6b00] block">
          Pending Handover
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-[#ff6b00] block">
          {summary?.pendingTasks ?? 0}
        </span>
      </Card>

      <Card compact className="p-3 bg-[#161922] border border-[#262c38] space-y-1" chamfer>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff1744] block">
          Open Incidents
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-[#ff1744] block">
          {summary?.openBranchIssues ?? 0}
        </span>
      </Card>
    </div>
  );
};
