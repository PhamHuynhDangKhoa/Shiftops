import React from 'react';
import { Card } from '../ui/Card';

export interface IssueMetrics {
  urgentCount: number;
  highCount: number;
  openAssignedCount: number;
  resolvedCount: number;
}

interface IssueSummaryCardsProps {
  metrics: IssueMetrics;
}

export const IssueSummaryCards: React.FC<IssueSummaryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <Card compact accent="red" className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-rose-700 uppercase tracking-wider block">
          Urgent Incidents
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-rose-800">
          {metrics.urgentCount}
        </div>
        <span className="text-[11px] text-rose-600 block">Immediate response required</span>
      </Card>

      <Card compact accent="orange" className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-amber-700 uppercase tracking-wider block">
          High Priority
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-amber-800">
          {metrics.highCount}
        </div>
        <span className="text-[11px] text-amber-600 block">Triage queue active</span>
      </Card>

      <Card compact accent="blue" className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-zinc-600 uppercase tracking-wider block">
          Open / Assigned
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950">
          {metrics.openAssignedCount}
        </div>
        <span className="text-[11px] text-zinc-500 block">In investigation or progress</span>
      </Card>

      <Card compact accent="green" className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-emerald-700 uppercase tracking-wider block">
          Resolved
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
          {metrics.resolvedCount}
        </div>
        <span className="text-[11px] text-emerald-600 block">Past 30 days</span>
      </Card>
    </div>
  );
};
