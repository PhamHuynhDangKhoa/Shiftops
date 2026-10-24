import React from 'react';
import { IssueSummary } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';
import { Button } from '../ui/Button';
import { IconAlertTriangle, IconChevronRight } from '../ui/Icons';

interface ManagerIssueTableProps {
  issues?: IssueSummary[];
  isLoading: boolean;
  onSelectIssue: (issueId: string) => void;
}

export const ManagerIssueTable: React.FC<ManagerIssueTableProps> = ({
  issues = [],
  isLoading,
  onSelectIssue,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs font-mono text-[#00f0ff]">
        [ SYNCING_SECTOR_INCIDENTS... ]
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="py-12 text-center border border-[#262c38] bg-[#11141a] clip-chamfer-card">
        <div className="w-8 h-8 bg-[#181c24] border border-[#262c38] flex items-center justify-center text-[#606c80] mx-auto mb-2">
          <IconAlertTriangle size={16} />
        </div>
        <p className="text-xs font-mono font-bold text-white uppercase">[ NO ACTIVE SECTOR INCIDENTS ]</p>
        <p className="text-[11px] font-mono text-[#606c80] mt-0.5">
          All operating equipment and facility resources report nominal telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#262c38] bg-[#11141a] clip-chamfer-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#161922] border-b border-[#262c38] text-[#9da8b9] font-mono text-[10px] uppercase tracking-wider">
            <th className="py-3 px-3.5 font-bold">THREAT LEVEL</th>
            <th className="py-3 px-3.5 font-bold">INCIDENT SUMMARY</th>
            <th className="py-3 px-3.5 font-bold">CATEGORY</th>
            <th className="py-3 px-3.5 font-bold">TRIAGE STATUS</th>
            <th className="py-3 px-3.5 font-bold">REPORTER</th>
            <th className="py-3 px-3.5 font-bold">ASSIGNEE</th>
            <th className="py-3 px-3.5 font-bold">TIMESTAMP</th>
            <th className="py-3 px-3.5 font-bold text-right">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e222b]">
          {issues.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className="hover:bg-[#181c24] transition-colors cursor-pointer font-mono group"
            >
              <td className="py-3 px-3.5 whitespace-nowrap">
                <IssuePriorityBadge priority={issue.priority} />
              </td>
              <td className="py-3 px-3.5 font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                {issue.title}
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <IssueCategoryBadge category={issue.category} />
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <IssueStatusBadge status={issue.status} />
              </td>
              <td className="py-3 px-3.5 text-[#9da8b9]">
                {issue.reportedByName || 'Operator'}
              </td>
              <td className="py-3 px-3.5">
                {issue.assignedToName ? (
                  <span className="font-bold text-[#00f0ff]">{issue.assignedToName}</span>
                ) : (
                  <span className="text-[#606c80] italic">[ UNASSIGNED ]</span>
                )}
              </td>
              <td className="py-3 px-3.5 font-mono tabular-nums text-[#606c80] whitespace-nowrap">
                {new Date(issue.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 px-3.5 text-right">
                <Button variant="secondary" size="sm" className="gap-1 text-[11px] py-1 px-2.5">
                  <span>[ INSPECT ]</span>
                  <IconChevronRight size={11} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
