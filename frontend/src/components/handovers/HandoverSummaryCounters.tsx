import React from 'react';
import { HandoverDerivedSummary } from '../../lib/types';

interface HandoverSummaryCountersProps {
  summary?: HandoverDerivedSummary;
}

export const HandoverSummaryCounters: React.FC<HandoverSummaryCountersProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">Total Tasks</span>
        <span className="text-2xl font-black text-blue-900">{summary?.totalTasks ?? 0}</span>
      </div>
      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Completed</span>
        <span className="text-2xl font-black text-emerald-900">{summary?.completedTasks ?? 0}</span>
      </div>
      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Pending Tasks</span>
        <span className="text-2xl font-black text-amber-900">{summary?.pendingTasks ?? 0}</span>
      </div>
      <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-100">
        <span className="text-xs font-semibold text-red-800 uppercase tracking-wider block">Open Branch Issues</span>
        <span className="text-2xl font-black text-red-900">{summary?.openBranchIssues ?? 0}</span>
      </div>
    </div>
  );
};
