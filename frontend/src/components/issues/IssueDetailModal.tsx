import React from 'react';
import { Issue, IssueStatus, User } from '../../lib/types';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconCheck } from '../ui/Icons';

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
    <Modal
      isOpen={!!issueId}
      onClose={onClose}
      title={issue ? issue.title : 'Incident Details'}
      description={issue ? `Incident #${issue.id.slice(0, 8)} · ${issue.branchName}` : ''}
      maxWidth="xl"
    >
      {isLoading || !issue ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-400">
          Loading incident records...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status & Priority Strip */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-zinc-100">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueCategoryBadge category={issue.category} />
            <IssueStatusBadge status={issue.status} />
          </div>

          {/* Incident Description */}
          <div>
            <h4 className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Incident Description
            </h4>
            <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* Audit Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-zinc-400 block">Reported By</span>
              <span className="font-semibold text-zinc-900">{issue.reportedByName}</span>
              <div className="text-[10px] text-zinc-500 tabular-nums">
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-zinc-400 block">Assigned Staff</span>
              {issue.assignedToName ? (
                <span className="font-semibold text-zinc-900">{issue.assignedToName}</span>
              ) : (
                <span className="text-zinc-400 italic">Unassigned</span>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase text-zinc-400 block">Resolved By</span>
              {issue.resolvedByName ? (
                <span className="font-semibold text-emerald-800">{issue.resolvedByName}</span>
              ) : (
                <span className="text-zinc-400 italic">Pending</span>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase text-zinc-400 block">Closed Status</span>
              {issue.closedByName ? (
                <span className="font-semibold text-zinc-900">{issue.closedByName}</span>
              ) : (
                <span className="text-zinc-400 italic">Open</span>
              )}
            </div>
          </div>

          {/* Assignment Controls */}
          {!isStaff && issue.status !== 'CLOSED' && issue.status !== 'CANCELLED' && (
            <div className="p-3 border border-zinc-200 rounded-md flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs font-medium text-zinc-700">
                Assignee:
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <select
                  value={assigneeUserId}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="">-- Select staff member --</option>
                  {branchStaff?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role})
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!assigneeUserId || isAssigning}
                  onClick={onAssign}
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          )}

          {/* Workflow Status Actions */}
          {issue.status === 'CLOSED' ? (
            <div className="p-3 rounded-md bg-zinc-100 border border-zinc-200 text-xs text-zinc-600 font-mono">
              Closed: This incident has been verified and permanently closed.
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {(issue.status === 'OPEN' || issue.status === 'ASSIGNED') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onStartInvestigation}
                >
                  Start Investigation
                </Button>
              )}

              {issue.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSetStatusActionTarget('RESOLVED')}
                  className="gap-1.5"
                >
                  <IconCheck size={13} />
                  <span>Mark Resolved</span>
                </Button>
              )}

              {!isStaff && (
                <>
                  {issue.status === 'RESOLVED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onSetStatusActionTarget('CLOSED')}
                    >
                      Verify & Close Issue
                    </Button>
                  )}

                  {issue.status !== 'CANCELLED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onSetStatusActionTarget('CANCELLED')}
                    >
                      Cancel Issue
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sub-form for status confirmation with resolution comment */}
          {statusActionTarget && (
            <div className="p-3.5 rounded-md bg-zinc-50 border border-zinc-300 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">
                  Confirm Transition to {statusActionTarget}
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Add an optional resolution note or closing comment to record in the audit trail:
                </p>
              </div>
              <input
                type="text"
                value={statusComment}
                onChange={(e) => onStatusCommentChange(e.target.value)}
                placeholder="e.g. Replaced faulty circuit breaker; verified stable operation."
                className="w-full px-3 py-1.5 text-xs rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onSetStatusActionTarget(null);
                    onStatusCommentChange('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onConfirmStatusChange}
                  disabled={isUpdatingStatus}
                >
                  Confirm {statusActionTarget}
                </Button>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <span className="text-xs font-semibold text-zinc-900">
                Evidence Attachments ({issue.attachments?.length || 0})
              </span>
              {issue.status !== 'CLOSED' && (
                <label className="text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer">
                  + Add Attachment
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {issue.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-md border border-zinc-200 bg-zinc-50 flex flex-col justify-between gap-1 text-xs"
                  >
                    <span className="font-medium text-zinc-900 truncate">
                      {att.originalFileName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {(att.fileSizeBytes / 1024).toFixed(1)} KB · {att.uploaderName}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewAttachment(att.id)}
                      className="mt-1 w-full justify-center text-[11px] py-0.5"
                    >
                      View Photo
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic block">
                No attachments uploaded.
              </span>
            )}
          </div>

          {/* Comments & Discussion */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-zinc-900 pb-1 border-b border-zinc-100">
              Discussion Thread ({issue.comments?.length || 0})
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-md bg-zinc-50 border border-zinc-200">
              {issue.comments && issue.comments.length > 0 ? (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2 rounded border text-xs ${
                      c.systemGenerated ? 'bg-zinc-100/70 border-zinc-200 font-mono text-zinc-600' : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-zinc-950 font-semibold">{c.authorName}</strong>
                        <Badge variant="neutral" size="sm">
                          {c.authorRole}
                        </Badge>
                        {c.systemGenerated && (
                          <span className="text-[10px] text-zinc-400 italic">(System)</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-zinc-400 italic">
                  No comment entries yet.
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddComment();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => onNewCommentChange(e.target.value)}
                placeholder="Write incident update or note..."
                className="flex-1 px-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newComment.trim() || isAddingComment}
              >
                {isAddingComment ? 'Posting...' : 'Post Note'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
};
