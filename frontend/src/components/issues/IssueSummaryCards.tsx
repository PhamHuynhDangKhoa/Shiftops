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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 font-mono">
      <Card compact hazard={metrics.urgentCount > 0 ? 'crimson' : 'none'} className="space-y-1.5 border border-[#262c38] bg-[#11141a]" chamfer>
        <span className="text-[10px] font-bold text-[#ff1744] uppercase tracking-wider block">
          CRITICAL THREATS (URGENT)
        </span>
        <div className="text-2xl font-bold tabular-nums text-[#ff335c] shadow-[0_0_10px_rgba(255,23,68,0.2)]">
          {metrics.urgentCount}
        </div>
        <span className="text-[10px] text-[#ff6b81] block">Immediate sector triage required</span>
      </Card>

      <Card compact hazard={metrics.highCount > 0 ? 'amber' : 'none'} className="space-y-1.5 border border-[#262c38] bg-[#11141a]" chamfer>
        <span className="text-[10px] font-bold text-[#ff6b00] uppercase tracking-wider block">
          HIGH PRIORITY INCIDENTS
        </span>
        <div className="text-2xl font-bold tabular-nums text-[#ff8800]">
          {metrics.highCount}
        </div>
        <span className="text-[10px] text-[#9da8b9] block">Triage queue active</span>
      </Card>

      <Card compact accent="cyan" className="space-y-1.5 border border-[#262c38] bg-[#11141a]" chamfer>
        <span className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider block">
          ACTIVE IN-PROGRESS
        </span>
        <div className="text-2xl font-bold tabular-nums text-white">
          {metrics.openAssignedCount}
        </div>
        <span className="text-[10px] text-[#606c80] block">Investigation underway</span>
      </Card>

      <Card compact accent="green" className="space-y-1.5 border border-[#262c38] bg-[#11141a]" chamfer>
        <span className="text-[10px] font-bold text-[#00e676] uppercase tracking-wider block">
          RESOLVED INCIDENTS
        </span>
        <div className="text-2xl font-bold tabular-nums text-[#00e676]">
          {metrics.resolvedCount}
        </div>
        <span className="text-[10px] text-[#606c80] block">Cleared operational threats</span>
      </Card>
    </div>
  );
};
