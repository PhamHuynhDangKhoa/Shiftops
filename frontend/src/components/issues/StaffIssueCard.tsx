import React from 'react';
import { Issue } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';
import { Button } from '../ui/Button';
import { IconClock, IconChevronRight } from '../ui/Icons';

interface StaffIssueCardProps {
  issue: Issue;
  onSelectIssue: (issueId: string) => void;
}

export const StaffIssueCard: React.FC<StaffIssueCardProps> = ({
  issue,
  onSelectIssue,
}) => {
  return (
    <div
      onClick={() => onSelectIssue(issue.id)}
      className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between gap-3 hover:border-zinc-300 transition-colors cursor-pointer"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueCategoryBadge category={issue.category} />
            <IssueStatusBadge status={issue.status} />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 tabular-nums flex items-center gap-1">
            <IconClock size={11} />
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="font-semibold text-sm text-zinc-950 tracking-tight">
          {issue.title}
        </h3>

        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>
      </div>

      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div>
          {issue.assignedToName ? (
            <span>Assigned to <strong className="text-zinc-800 font-medium">{issue.assignedToName}</strong></span>
          ) : (
            <span className="italic text-zinc-400">Triage in progress</span>
          )}
        </div>

        <Button variant="secondary" size="sm" className="gap-1 text-[11px] py-0.5 px-2">
          <span>Details</span>
          <IconChevronRight size={11} />
        </Button>
      </div>
    </div>
  );
};
