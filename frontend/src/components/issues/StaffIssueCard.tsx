import React from 'react';
import { Issue } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';

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
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <IssuePriorityBadge priority={issue.priority} />
          <IssueCategoryBadge category={issue.category} />
          <IssueStatusBadge status={issue.status} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
            {issue.title}
          </h3>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {new Date(issue.createdAt).toLocaleString()}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
        {issue.description}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderTop: '1px solid #f3f4f6',
          paddingTop: '0.75rem',
          fontSize: '0.85rem',
          color: '#6b7280',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Reported by: <strong>{issue.reportedByName}</strong>
          </span>
          {issue.assignedToName && (
            <span>
              Assigned to: <strong style={{ color: '#2563eb' }}>{issue.assignedToName}</strong>
            </span>
          )}
          <span>💬 {issue.comments?.length || 0} comments</span>
          <span>📎 {issue.attachments?.length || 0} photos</span>
        </div>

        <button
          onClick={() => onSelectIssue(issue.id)}
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: '#f3f4f6',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View & Update →
        </button>
      </div>
    </div>
  );
};
