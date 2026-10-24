import React from 'react';
import { Issue } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
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
    <Card
      onClick={() => onSelectIssue(issue.id)}
      className="flex flex-col justify-between gap-3 hover:border-zinc-300 transition-colors cursor-pointer group p-5"
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueCategoryBadge category={issue.category} />
            <IssueStatusBadge status={issue.status} />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums flex items-center gap-1">
            <IconClock size={12} className="text-zinc-400" />
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="font-bold text-base text-zinc-900 group-hover:text-zinc-700 transition-colors">
          {issue.title}
        </h3>

        <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div>
          {issue.assignedToName ? (
            <span>Assigned: <strong className="text-zinc-800 font-semibold">{issue.assignedToName}</strong></span>
          ) : (
            <span className="italic text-zinc-400">Unassigned (Triage in progress)</span>
          )}
        </div>

        <Button variant="secondary" size="sm" className="gap-1 text-xs py-1 px-2.5">
          <span>Details</span>
          <IconChevronRight size={13} />
        </Button>
      </div>
    </Card>
  );
};
