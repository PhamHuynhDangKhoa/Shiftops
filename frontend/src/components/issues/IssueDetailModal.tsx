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
        <div className="py-12 text-center text-xs font-mono text-[#8a94a6]">
          Loading incident records...
        </div>
      ) : (
        <div className="space-y-5 font-mono">
          {/* Status & Priority Strip */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-[#262c38]">
            <IssuePriorityBadge priority={issue.priority} />
            <IssueCategoryBadge category={issue.category} />
            <IssueStatusBadge status={issue.status} />
          </div>

          {/* Incident Description */}
          <div>
            <h4 className="text-[10px] font-bold text-[#8a94a6] uppercase tracking-wider mb-1.5">
              Incident Description
            </h4>
            <div className="p-3 bg-[#161922] border border-[#262c38] text-xs text-[#f1f5f9] whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* Audit Ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#161922] border border-[#262c38] text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#8a94a6] block">Reported By</span>
              <span className="font-bold text-white block mt-0.5">{issue.reportedByName}</span>
              <div className="text-[10px] text-[#606c80] tabular-nums mt-0.5">
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-[#8a94a6] block">Assigned Staff</span>
              {issue.assignedToName ? (
                <span className="font-bold text-white block mt-0.5">{issue.assignedToName}</span>
              ) : (
                <span className="text-[#606c80] italic block mt-0.5">Unassigned</span>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase text-[#8a94a6] block">Resolved By</span>
              {issue.resolvedByName ? (
                <span className="font-bold text-[#00e676] block mt-0.5">{issue.resolvedByName}</span>
              ) : (
                <span className="text-[#606c80] italic block mt-0.5">Pending</span>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase text-[#8a94a6] block">Closed Status</span>
              {issue.closedByName ? (
                <span className="font-bold text-white block mt-0.5">{issue.closedByName}</span>
              ) : (
                <span className="text-[#606c80] italic block mt-0.5">Open</span>
              )}
            </div>
          </div>

          {/* Assignment Controls */}
          {!isStaff && issue.status !== 'CLOSED' && issue.status !== 'CANCELLED' && (
            <div className="p-3 border border-[#262c38] bg-[#161922] flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs font-semibold text-[#8a94a6] uppercase">
                Assignee:
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <select
                  value={assigneeUserId}
                  onChange={(e) => onAssigneeChange(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <div className="p-3 bg-[#161922] border border-[#262c38] text-xs text-[#8a94a6]">
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
            <div className="p-3.5 bg-[#161922] border border-[#262c38] space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Confirm Transition to {statusActionTarget}
                </h4>
                <p className="text-[11px] text-[#8a94a6] mt-0.5">
                  Add an optional resolution note or closing comment to record in the audit trail:
                </p>
              </div>
              <input
                type="text"
                value={statusComment}
                onChange={(e) => onStatusCommentChange(e.target.value)}
                placeholder="e.g. Replaced faulty circuit breaker; verified stable operation."
                className="w-full px-3 py-1.5 text-xs border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <div className="flex items-center justify-between pb-1 border-b border-[#262c38]">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Evidence Attachments ({issue.attachments?.length || 0})
              </span>
              {issue.status !== 'CLOSED' && (
                <label className="text-xs font-mono text-[#00f0ff] hover:underline cursor-pointer">
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
                    className="p-2.5 border border-[#262c38] bg-[#161922] flex flex-col justify-between gap-1 text-xs"
                  >
                    <span className="font-medium text-white truncate">
                      {att.originalFileName}
                    </span>
                    <span className="text-[10px] text-[#606c80] tabular-nums">
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
              <span className="text-xs text-[#606c80] italic block">
                No attachments uploaded.
              </span>
            )}
          </div>

          {/* Comments & Discussion */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-[#262c38]">
              Discussion Thread ({issue.comments?.length || 0})
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 p-2 bg-[#161922] border border-[#262c38]">
              {issue.comments && issue.comments.length > 0 ? (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2 border text-xs ${
                      c.systemGenerated
                        ? 'bg-[#181c24] border-[#262c38] text-[#8a94a6]'
                        : 'bg-[#13151a] border-[#2a2f3d] text-[#f1f5f9]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white font-bold">{c.authorName}</strong>
                        <Badge variant="neutral" size="sm">
                          {c.authorRole}
                        </Badge>
                        {c.systemGenerated && (
                          <span className="text-[10px] text-[#606c80] italic">(System)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#606c80] tabular-nums">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#606c80] italic">
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
                className="flex-1 px-3 py-1.5 text-xs border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
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
