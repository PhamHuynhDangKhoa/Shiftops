import React from 'react';
import { Issue, IssueStatus, User } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';

interface IssueDetailModalProps {
  issueId: string | null;
  onClose: () => void;
  issue?: Issue;
  isLoading: boolean;
  isStaff: boolean;
  branchStaff?: User[];
  // Assignment
  assigneeUserId: string;
  onAssigneeChange: (userId: string) => void;
  onAssign: () => void;
  isAssigning: boolean;
  // Status update
  statusActionTarget: IssueStatus | null;
  onSetStatusActionTarget: (status: IssueStatus | null) => void;
  statusComment: string;
  onStatusCommentChange: (comment: string) => void;
  onConfirmStatusChange: () => void;
  isUpdatingStatus: boolean;
  onStartInvestigation: () => void;
  // Attachments
  onUploadAttachment: (file: File) => void;
  onViewAttachment: (attachmentId: string) => void;
  // Comments
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onAddComment: () => void;
  isAddingComment: boolean;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issueId,
  onClose,
  issue,
  isLoading,
  isStaff,
  branchStaff,
  assigneeUserId,
  onAssigneeChange,
  onAssign,
  isAssigning,
  statusActionTarget,
  onSetStatusActionTarget,
  statusComment,
  onStatusCommentChange,
  onConfirmStatusChange,
  isUpdatingStatus,
  onStartInvestigation,
  onUploadAttachment,
  onViewAttachment,
  newComment,
  onNewCommentChange,
  onAddComment,
  isAddingComment,
}) => {
  if (!issueId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {isLoading || !issue ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Loading issue details...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <IssuePriorityBadge priority={issue.priority} />
                  <IssueCategoryBadge category={issue.category} />
                  <IssueStatusBadge status={issue.status} />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    at {issue.branchName}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                  {issue.title}
                </h2>
              </div>

              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div>
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>
                Description
              </h4>
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {issue.description}
              </div>
            </div>

            {/* Audit & Responsibility Information */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.85rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Reported By:</span>
                <strong>{issue.reportedByName}</strong> ({issue.reportedByRole})
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(issue.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Assigned To:</span>
                {issue.assignedToName ? (
                  <strong style={{ color: '#2563eb' }}>{issue.assignedToName}</strong>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </div>

              {issue.resolvedAt && (
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Resolved By:</span>
                  <strong style={{ color: '#059669' }}>{issue.resolvedByName}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(issue.resolvedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {issue.closedAt && (
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Closed By:</span>
                  <strong style={{ color: '#4b5563' }}>{issue.closedByName}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(issue.closedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Controls (Manager/Owner only, and issue not closed/cancelled) */}
            {!isStaff && issue.status !== 'CLOSED' && issue.status !== 'CANCELLED' && (
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  Assign Responsibility:
                </label>
                <select
                  value={assigneeUserId}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose staff member --</option>
                  {branchStaff?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role})
                    </option>
                  ))}
                </select>
                <button
                  disabled={!assigneeUserId || isAssigning}
                  onClick={onAssign}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            )}

            {/* Workflow Actions */}
            {issue.status === 'CLOSED' ? (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>🔒</span> <strong>Closed:</strong> This issue has been verified and permanently closed. No further status changes are permitted.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* IN_PROGRESS action */}
                {(issue.status === 'OPEN' || issue.status === 'ASSIGNED') && (
                  <button
                    onClick={onStartInvestigation}
                    style={{
                      padding: '0.45rem 0.9rem',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Start Investigation / Work
                  </button>
                )}

                {/* RESOLVED action */}
                {issue.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onSetStatusActionTarget('RESOLVED')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Mark Resolved
                  </button>
                )}

                {/* Manager / Owner closing actions */}
                {!isStaff && (
                  <>
                    {issue.status === 'RESOLVED' && (
                      <button
                        onClick={() => onSetStatusActionTarget('CLOSED')}
                        style={{
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#374151',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        🔒 Verify & Close Issue
                      </button>
                    )}

                    {issue.status !== 'CANCELLED' && (
                      <button
                        onClick={() => onSetStatusActionTarget('CANCELLED')}
                        style={{
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#9ca3af',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel Issue
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sub-form for status confirmation with resolution comment */}
            {statusActionTarget && (
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '1rem',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>
                  Confirm Transition to {statusActionTarget}
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Add an optional resolution note or closing comment to record in the audit trail:
                </p>
                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => onStatusCommentChange(e.target.value)}
                  placeholder="e.g. Replaced faulty gasket; machine tested OK."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      onSetStatusActionTarget(null);
                      onStatusCommentChange('');
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirmStatusChange}
                    disabled={isUpdatingStatus}
                    style={{
                      padding: '0.4rem 0.9rem',
                      backgroundColor:
                        statusActionTarget === 'RESOLVED'
                          ? '#10b981'
                          : statusActionTarget === 'CLOSED'
                          ? '#374151'
                          : '#64748b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm {statusActionTarget}
                  </button>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                  📎 Photos & Attachments ({issue.attachments?.length || 0})
                </h4>

                {issue.status !== 'CLOSED' && (
                  <label
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    + Upload Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onUploadAttachment(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {issue.attachments && issue.attachments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {issue.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.originalFileName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {(att.fileSizeBytes / 1024).toFixed(1)} KB • by {att.uploaderName}
                      </span>
                      <button
                        onClick={() => onViewAttachment(att.id)}
                        style={{
                          marginTop: '0.25rem',
                          padding: '0.3rem 0.6rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        View Photo
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  No photo attachments uploaded yet.
                </div>
              )}
            </div>

            {/* Comments & Discussion Thread */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                💬 Discussion & Audit Trail ({issue.comments?.length || 0})
              </h4>

              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  padding: '0.5rem',
                  border: '1px solid #f3f4f6',
                  borderRadius: '6px',
                  backgroundColor: '#fafafa',
                  marginBottom: '0.75rem',
                }}
              >
                {issue.comments && issue.comments.length > 0 ? (
                  issue.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: c.systemGenerated ? '#f1f5f9' : '#ffffff',
                        border: `1px solid ${c.systemGenerated ? '#e2e8f0' : '#e5e7eb'}`,
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ color: '#111827' }}>{c.authorName}</strong>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '9999px',
                              backgroundColor: '#e5e7eb',
                              color: '#374151',
                              fontWeight: 600,
                            }}
                          >
                            {c.authorRole}
                          </span>
                          {c.systemGenerated && (
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                              (System)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {c.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', padding: '1rem' }}>
                    No comments yet. Start the conversation below.
                  </div>
                )}
              </div>

              {/* Add comment box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onAddComment();
                }}
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  placeholder="Add an update, note, or reply..."
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isAddingComment}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isAddingComment ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
