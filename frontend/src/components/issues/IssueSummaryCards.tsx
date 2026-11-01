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
      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Urgent incidents
          </span>
          {metrics.urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-[#c4242a]" />}
        </div>
        <div className="text-2xl font-normal text-[#c4242a] tabular-nums">
          {metrics.urgentCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] block">Immediate attention</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            High priority
          </span>
          {metrics.highCount > 0 && <span className="w-2 h-2 rounded-full bg-[#92400e]" />}
        </div>
        <div className="text-2xl font-normal text-[#92400e] tabular-nums">
          {metrics.highCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] block">Action queue active</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            In progress
          </span>
          <span className="w-2 h-2 rounded-full bg-[#1b6c80]" />
        </div>
        <div className="text-2xl font-normal text-[#131416] tabular-nums">
          {metrics.openAssignedCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] block">Active resolution</span>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Resolved
          </span>
          <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
        </div>
        <div className="text-2xl font-normal text-[#1e7b4f] tabular-nums">
          {metrics.resolvedCount}
        </div>
        <span className="text-[11px] text-[#5d5f60] block">Closed and verified</span>
      </Card>
    </div>
  );
};
