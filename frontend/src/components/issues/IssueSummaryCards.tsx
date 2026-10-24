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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Urgent Issues
          </span>
          {metrics.urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500" />}
        </div>
        <div className="text-2xl font-bold text-rose-600 tabular-nums">
          {metrics.urgentCount}
        </div>
        <span className="text-xs text-zinc-500 block">Immediate attention required</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            High Priority
          </span>
          {metrics.highCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </div>
        <div className="text-2xl font-bold text-amber-600 tabular-nums">
          {metrics.highCount}
        </div>
        <span className="text-xs text-zinc-500 block">Action queue active</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <div className="text-2xl font-bold text-zinc-900 tabular-nums">
          {metrics.openAssignedCount}
        </div>
        <span className="text-xs text-zinc-500 block">Under active resolution</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Resolved
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-emerald-600 tabular-nums">
          {metrics.resolvedCount}
        </div>
        <span className="text-xs text-zinc-500 block">Closed and verified</span>
      </Card>
    </div>
  );
};
