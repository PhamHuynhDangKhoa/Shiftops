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
      <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
        Loading issues...
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="py-12 text-center border border-zinc-200/80 bg-white rounded-xl shadow-xs">
        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2">
          <IconAlertTriangle size={18} />
        </div>
        <p className="text-sm font-semibold text-zinc-800">No active incidents found</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          All equipment, facilities, and branch safety items report normal status.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200/80 bg-white rounded-xl shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Incident Summary</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Reported By</th>
            <th className="py-3 px-4">Assignee</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/70 text-zinc-800">
          {issues.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
            >
              <td className="py-3.5 px-4 whitespace-nowrap">
                <IssuePriorityBadge priority={issue.priority} />
              </td>
              <td className="py-3.5 px-4 font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                {issue.title}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <IssueCategoryBadge category={issue.category} />
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <IssueStatusBadge status={issue.status} />
              </td>
              <td className="py-3.5 px-4 text-zinc-600 text-xs">
                {issue.reportedByName || 'Staff'}
              </td>
              <td className="py-3.5 px-4">
                {issue.assignedToName ? (
                  <span className="font-medium text-zinc-900">{issue.assignedToName}</span>
                ) : (
                  <span className="text-zinc-400 italic text-xs">Unassigned</span>
                )}
              </td>
              <td className="py-3.5 px-4 tabular-nums text-zinc-500 text-xs whitespace-nowrap">
                {new Date(issue.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3.5 px-4 text-right">
                <Button variant="secondary" size="sm" className="gap-1 text-xs py-1 px-2.5">
                  <span>Inspect</span>
                  <IconChevronRight size={13} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
