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
  const isUrgent = issue.priority === 'URGENT';

  return (
    <div
      onClick={() => onSelectIssue(issue.id)}
      className={`bg-[#11141a] border border-[#262c38] p-4 flex flex-col justify-between gap-3 clip-chamfer-card hover:border-[#00f0ff] transition-colors cursor-pointer group ${
        isUrgent ? 'border-l-4 border-l-[#ff1744]' : 'border-l-2 border-l-[#2a2f3d]'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueCategoryBadge category={issue.category} />
            <IssueStatusBadge status={issue.status} />
          </div>
          <span className="text-[10px] font-mono text-[#606c80] tabular-nums flex items-center gap-1">
            <IconClock size={11} className="text-[#00f0ff]" />
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="font-mono font-bold text-sm text-white group-hover:text-[#00f0ff] transition-colors uppercase">
          {issue.title}
        </h3>

        <p className="text-xs text-[#9da8b9] line-clamp-2 leading-relaxed font-mono">
          // {issue.description}
        </p>
      </div>

      <div className="pt-2 border-t border-[#1e222b] flex items-center justify-between text-xs font-mono text-[#606c80]">
        <div>
          {issue.assignedToName ? (
            <span>OPERATOR: <strong className="text-white font-bold">{issue.assignedToName}</strong></span>
          ) : (
            <span className="italic text-[#606c80]">[ TRIAGE IN PROGRESS ]</span>
          )}
        </div>

        <Button variant="secondary" size="sm" className="gap-1 text-[11px] py-1 px-2.5">
          <span>[ DETAILS ]</span>
          <IconChevronRight size={11} />
        </Button>
      </div>
    </div>
  );
};
