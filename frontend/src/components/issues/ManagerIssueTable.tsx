import React from 'react';
import { IssueSummary } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';

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
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
        Loading branch issues...
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px dashed #d1d5db',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>
          All Clear! No Matching Issues Found
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          No active operational issues match the selected filters for this branch.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <tr>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Priority</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Category</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Title</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Status</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Reported By</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Assigned To</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Created</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151', textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={issue.id}
              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
              onClick={() => onSelectIssue(issue.id)}
            >
              <td style={{ padding: '0.75rem 1rem' }}>
                <IssuePriorityBadge priority={issue.priority} />
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <IssueCategoryBadge category={issue.category} />
              </td>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827' }}>
                {issue.title}
                {issue.attachmentCount > 0 && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    📎 {issue.attachmentCount}
                  </span>
                )}
                {issue.commentCount > 0 && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    💬 {issue.commentCount}
                  </span>
                )}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <IssueStatusBadge status={issue.status} />
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{issue.reportedByName}</td>
              <td style={{ padding: '0.75rem 1rem' }}>
                {issue.assignedToName ? (
                  <span style={{ color: '#2563eb', fontWeight: 500 }}>{issue.assignedToName}</span>
                ) : (
                  <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                {new Date(issue.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIssue(issue.id);
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
