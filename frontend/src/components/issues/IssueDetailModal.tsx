import React from 'react';
import { Issue, User, IssueStatus } from '../../lib/types';
import { Modal, Button, Badge } from '../ui';
import { IssuePriorityBadge } from './IssuePriorityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueStatusBadge } from './IssueStatusBadge';
import { IconCheck } from '../ui/Icons';

interface IssueDetailModalProps {
  issueId: string | null;
  issue: Issue | null;
  isLoading: boolean;
  isStaff: boolean;
  branchStaff?: User[];
  assigneeUserId: string;
  onAssigneeChange: (userId: string) => void;
  onAssign: () => void;
  isAssigning: boolean;
  onStartInvestigation: () => void;
  statusActionTarget: IssueStatus | null;
  onSetStatusActionTarget: (status: IssueStatus | null) => void;
  statusComment: string;
  onStatusCommentChange: (comment: string) => void;
  onConfirmStatusChange: () => void;
  isUpdatingStatus: boolean;
  onUploadAttachment: (file: File) => void;
  onViewAttachment: (attachmentId: string) => void;
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onAddComment: () => void;
  isAddingComment: boolean;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issueId,
  issue,
  isLoading,
  isStaff,
  branchStaff,
  assigneeUserId,
  onAssigneeChange,
  onAssign,
  isAssigning,
  onStartInvestigation,
  statusActionTarget,
  onSetStatusActionTarget,
  statusComment,
  onStatusCommentChange,
  onConfirmStatusChange,
  isUpdatingStatus,
  onUploadAttachment,
  onViewAttachment,
  newComment,
  onNewCommentChange,
  onAddComment,
  isAddingComment,
  onClose,
}) => {
  return (
    <Modal
      isOpen={!!issueId}
      onClose={onClose}
      title={issue ? issue.title : 'Incident Details'}
      description={issue ? `Incident #${issue.id.slice(0, 8)} · ${issue.branchName}` : ''}
      maxWidth="xl"
    >
      {isLoading || !issue ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Loading incident details...
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
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Description
            </h4>
            <div className="p-3.5 bg-zinc-50/80 border border-zinc-200/80 rounded-xl text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* Audit Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50/80 border border-zinc-200/80 rounded-xl text-xs">
            <div>
              <span className="text-zinc-500 font-medium block">Reported By</span>
              <span className="font-semibold text-zinc-900 block mt-0.5">{issue.reportedByName}</span>
              <div className="text-zinc-400 tabular-nums mt-0.5">
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div>
              <span className="text-zinc-500 font-medium block">Assigned Staff</span>
              {issue.assignedToName ? (
                <span className="font-semibold text-zinc-900 block mt-0.5">{issue.assignedToName}</span>
              ) : (
                <span className="text-zinc-400 italic block mt-0.5">Unassigned</span>
              )}
            </div>

            <div>
              <span className="text-zinc-500 font-medium block">Resolved By</span>
              {issue.resolvedByName ? (
                <span className="font-semibold text-emerald-700 block mt-0.5">{issue.resolvedByName}</span>
              ) : (
                <span className="text-zinc-400 italic block mt-0.5">Pending</span>
              )}
            </div>

            <div>
              <span className="text-zinc-500 font-medium block">Closed By</span>
              {issue.closedByName ? (
                <span className="font-semibold text-zinc-900 block mt-0.5">{issue.closedByName}</span>
              ) : (
                <span className="text-zinc-400 italic block mt-0.5">Open</span>
              )}
            </div>
          </div>

          {/* Assignment Controls */}
          {!isStaff && issue.status !== 'CLOSED' && issue.status !== 'CANCELLED' && (
            <div className="p-3.5 border border-zinc-200/80 bg-zinc-50/60 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs font-semibold text-zinc-700">
                Assign Staff Member:
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <select
                  value={assigneeUserId}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
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
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 rounded-lg">
              Verified & Closed: This incident has been resolved and closed.
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
                  variant="emerald"
                  size="sm"
                  onClick={() => onSetStatusActionTarget('RESOLVED')}
                  className="gap-1.5"
                >
                  <IconCheck size={14} />
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
                      variant="outline"
                      size="sm"
                      onClick={() => onSetStatusActionTarget('CANCELLED')}
                      className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
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
            <div className="p-4 bg-zinc-50 border border-zinc-200/90 rounded-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Confirm Transition to {statusActionTarget}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Add an optional resolution note or closing comment to record in the audit trail:
                </p>
              </div>
              <input
                type="text"
                value={statusComment}
                onChange={(e) => onStatusCommentChange(e.target.value)}
                placeholder="e.g. Replaced faulty breaker; verified stable operation."
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
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
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Photo Attachments ({issue.attachments?.length || 0})
              </span>
              {issue.status !== 'CLOSED' && (
                <label className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer">
                  + Add Photo
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issue.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 border border-zinc-200/80 bg-zinc-50/70 rounded-xl flex flex-col justify-between gap-1 text-xs"
                  >
                    <span className="font-medium text-zinc-900 truncate">
                      {att.originalFileName}
                    </span>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {(att.fileSizeBytes / 1024).toFixed(1)} KB · {att.uploaderName}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewAttachment(att.id)}
                      className="mt-1 w-full justify-center text-xs py-1"
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
            <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider pb-1 border-b border-zinc-100">
              Discussion & Resolution Notes ({issue.comments?.length || 0})
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl">
              {issue.comments && issue.comments.length > 0 ? (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg border text-xs ${
                      c.systemGenerated
                        ? 'bg-zinc-100/70 border-zinc-200 text-zinc-600'
                        : 'bg-white border-zinc-200/80 text-zinc-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-zinc-900 font-semibold">{c.authorName}</strong>
                        <Badge variant="neutral" size="sm">
                          {c.authorRole}
                        </Badge>
                        {c.systemGenerated && (
                          <span className="text-[11px] text-zinc-400 italic">(System)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-zinc-400 italic">
                  No comments or notes yet.
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
                placeholder="Write an incident update or note..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
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
