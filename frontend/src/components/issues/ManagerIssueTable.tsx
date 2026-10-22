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
      <div className="py-12 text-center text-xs font-mono text-zinc-400">
        Loading branch issues...
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
          <IconAlertTriangle size={16} />
        </div>
        <p className="text-xs font-medium text-zinc-800">No active incidents</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          All operating equipment and facility items are currently clear.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
            <th className="py-2.5 px-3 font-medium">Priority</th>
            <th className="py-2.5 px-3 font-medium">Issue Title</th>
            <th className="py-2.5 px-3 font-medium">Category</th>
            <th className="py-2.5 px-3 font-medium">Status</th>
            <th className="py-2.5 px-3 font-medium">Reporter</th>
            <th className="py-2.5 px-3 font-medium">Assignee</th>
            <th className="py-2.5 px-3 font-medium">Reported</th>
            <th className="py-2.5 px-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {issues.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
            >
              <td className="py-2.5 px-3 whitespace-nowrap">
                <IssuePriorityBadge priority={issue.priority} />
              </td>
              <td className="py-2.5 px-3 max-w-xs">
                <div className="font-semibold text-zinc-950 truncate">{issue.title}</div>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <IssueCategoryBadge category={issue.category} />
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <IssueStatusBadge status={issue.status} />
              </td>
              <td className="py-2.5 px-3 text-zinc-600">
                {issue.reportedByName || 'Staff Member'}
              </td>
              <td className="py-2.5 px-3">
                {issue.assignedToName ? (
                  <span className="font-medium text-zinc-800">{issue.assignedToName}</span>
                ) : (
                  <span className="text-zinc-400 italic">Unassigned</span>
                )}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-500 whitespace-nowrap">
                {new Date(issue.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2.5 px-3 text-right">
                <Button variant="secondary" size="sm" className="gap-1 text-[11px] py-0.5 px-2">
                  <span>View</span>
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
