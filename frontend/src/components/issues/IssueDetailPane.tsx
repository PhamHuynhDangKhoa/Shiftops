import React, { useState } from 'react';
import { Issue, User, IssueStatus } from '../../lib/types';
import { Button } from '../ui/Button';
import {
  IconCheck,
  IconPaperclip,
  IconCamera,
  IconClose,
} from '../ui/Icons';

interface IssueDetailPaneProps {
  issue: Issue | null;
  isLoading: boolean;
  isStaff: boolean;
  branchStaff?: User[];
  assigneeUserId: string;
  onAssigneeChange: (userId: string) => void;
  onAssign: () => void;
  isAssigning: boolean;
  onStartInvestigation: () => void;
  onUpdateStatus: (status: IssueStatus, comment?: string) => void;
  isUpdatingStatus: boolean;
  onUploadAttachment: (file: File) => void;
  onViewAttachment: (attachmentId: string) => void;
  newComment: string;
  onNewCommentChange: (comment: string) => void;
  onAddComment: () => void;
  isAddingComment: boolean;
  onDeselect?: () => void;
}

export const IssueDetailPane: React.FC<IssueDetailPaneProps> = ({
  issue,
  isLoading,
  isStaff,
  branchStaff,
  assigneeUserId,
  onAssigneeChange,
  onAssign,
  isAssigning,
  onStartInvestigation,
  onUpdateStatus,
  isUpdatingStatus,
  onUploadAttachment,
  onViewAttachment,
  newComment,
  onNewCommentChange,
  onAddComment,
  isAddingComment,
  onDeselect,
}) => {
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [resolveNote, setResolveNote] = useState('');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-[#5d5f60]">
        Loading issue details...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#5d5f60] bg-white">
        <p className="text-sm font-medium text-[#131416]">No issue selected</p>
        <p className="text-xs text-[#5d5f60] mt-1">Select an issue from the list to view details and updates.</p>
      </div>
    );
  }

  const isResolved = issue.status === 'RESOLVED' || issue.status === 'CLOSED';
  const isUrgent = issue.priority === 'URGENT';
  const isHigh = issue.priority === 'HIGH';

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* 1. Header Toolbar: Status + Actions */}
      <div className="px-6 py-3 border-b border-[#e8eaec] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold text-[#131416]">
            #{issue.id.slice(0, 8)}
          </span>

          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${
              isResolved
                ? 'bg-[#dcfae5] text-[#04250e]'
                : isUrgent
                ? 'bg-[#ffedea] text-[#831c1e] font-semibold'
                : isHigh
                ? 'bg-[#fffbeb] text-[#92400e]'
                : 'bg-[#ebedee] text-[#353736]'
            }`}
          >
            {issue.priority}
          </span>

          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${
              isResolved
                ? 'bg-[#dcfae5] text-[#04250e]'
                : issue.status === 'IN_PROGRESS'
                ? 'bg-[#e9f4f7] text-[#1b6c80]'
                : 'bg-[#ebedee] text-[#353736]'
            }`}
          >
            {issue.status.replace('_', ' ').toLowerCase()}
          </span>

          <span className="text-xs text-[#5d5f60] capitalize">
            {issue.category.toLowerCase()}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {issue.status === 'OPEN' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartInvestigation}
              disabled={isUpdatingStatus}
              className="text-xs h-7 px-2.5"
            >
              Start investigation
            </Button>
          )}

          {(issue.status === 'ASSIGNED' || issue.status === 'IN_PROGRESS' || issue.status === 'OPEN') && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setShowResolveInput(!showResolveInput)}
              className="text-xs h-7 px-2.5"
            >
              Resolve...
            </Button>
          )}

          {issue.status === 'RESOLVED' && !isStaff && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdateStatus('CLOSED', 'Closed by manager')}
              disabled={isUpdatingStatus}
              className="text-xs h-7 px-2.5"
            >
              Close
            </Button>
          )}

          {isResolved && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdateStatus('IN_PROGRESS', 'Reopened')}
              disabled={isUpdatingStatus}
              className="text-xs h-7 px-2.5"
            >
              Reopen
            </Button>
          )}

          {!isStaff && branchStaff && branchStaff.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={assigneeUserId}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="h-7 px-2 text-xs rounded border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                aria-label="Assign staff"
              >
                <option value="">
                  {issue.assignedToName ? `Assigned: ${issue.assignedToName}` : 'Assign staff...'}
                </option>
                {branchStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              {assigneeUserId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAssign}
                  disabled={isAssigning}
                  className="text-xs h-7 px-2 font-mono"
                >
                  {isAssigning ? '...' : 'Save'}
                </Button>
              )}
            </div>
          )}

          {onDeselect && (
            <button
              type="button"
              onClick={onDeselect}
              className="text-[#5d5f60] hover:text-[#131416] p-1 rounded hover:bg-[#f0f1f3]"
              title="Close view"
            >
              <IconClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Resolution Note Bar (Only shown when toggled) */}
      {showResolveInput && (
        <div className="p-3 bg-[#f0fbf4] border-b border-[#1e7b4f]/20 flex items-center gap-2">
          <input
            type="text"
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Resolution debrief (e.g. replaced gasket, reset circuit breaker)..."
            className="flex-1 h-8 px-2.5 text-xs rounded border border-[#1e7b4f]/30 bg-white text-[#131416] focus:outline-none focus:border-[#1e7b4f]"
          />
          <Button
            variant="emerald"
            size="sm"
            onClick={() => {
              onUpdateStatus('RESOLVED', resolveNote);
              setShowResolveInput(false);
              setResolveNote('');
            }}
            disabled={isUpdatingStatus}
            className="h-8 text-xs whitespace-nowrap"
          >
            Confirm
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowResolveInput(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* 2. Scrollable Body Canvas (Zero Box Inception, Pure Surface) */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-3xl">
        {/* Title and Metadata */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#131416] tracking-tight leading-snug">
            {issue.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#5d5f60] mt-2 flex-wrap">
            <span>
              Reported by <strong className="text-[#131416] font-medium">{issue.reportedByName}</strong>
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {new Date(issue.createdAt).toLocaleDateString()} at{' '}
              {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>·</span>
            <span>{issue.branchName}</span>
          </div>
        </div>

        {/* Description: Pure Typography directly on the canvas */}
        <div className="text-[14px] text-[#353736] leading-relaxed whitespace-pre-wrap">
          {issue.description}
        </div>

        {/* Resolution note (if resolved) */}
        {isResolved && (
          <div className="flex items-center gap-2 text-xs text-[#1e7b4f] pt-1">
            <IconCheck size={14} className="flex-shrink-0" />
            <span>
              Resolved by <strong>{issue.resolvedByName || issue.closedByName || 'Supervisor'}</strong>
              {issue.resolvedAt && (
                <span className="font-mono tabular-nums ml-1">
                  at {new Date(issue.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Photo attachments (if present) */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="pt-4 border-t border-[#f0f1f2]">
            <span className="text-xs font-semibold text-[#131416] block mb-2">
              Attached inspection photos
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {issue.attachments.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => onViewAttachment(att.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#131416] rounded border border-[#cdced1] hover:bg-[#f4f7f8] transition-colors cursor-pointer"
                >
                  <IconPaperclip size={13} className="text-[#5d5f60]" />
                  <span>{att.originalFileName}</span>
                  <span className="text-[11px] text-[#5d5f60]">({(att.fileSizeBytes / 1024).toFixed(0)} KB)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity Thread */}
        <div className="pt-6 border-t border-[#f0f1f2] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#131416]">Activity</h3>
            <label className="text-xs font-medium text-[#1b6c80] hover:text-[#145363] cursor-pointer inline-flex items-center gap-1">
              <IconCamera size={13} />
              <span>Attach photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadAttachment(file);
                }}
              />
            </label>
          </div>

          {/* Comments List: Pure clean vertical timeline */}
          <div className="space-y-4">
            {issue.comments && issue.comments.length > 0 ? (
              issue.comments.map((comment) => (
                <div key={comment.id} className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#131416]">{comment.authorName}</span>
                    <span className="text-[11px] text-[#5d5f60]">({comment.authorRole.toLowerCase()})</span>
                    <span className="font-mono text-[11px] text-[#5d5f60] tabular-nums">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#353736] leading-relaxed">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#5d5f60] italic">No comments on this issue.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Minimal Comment Input */}
      <div className="p-4 border-t border-[#e8eaec] bg-white flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
              e.preventDefault();
              onAddComment();
            }
          }}
          placeholder="Leave a comment..."
          className="flex-1 h-8 px-3 text-xs rounded border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#1b6c80] transition-colors"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddComment}
          disabled={!newComment.trim() || isAddingComment}
          className="h-8 text-xs font-mono px-3"
        >
          Post
        </Button>
      </div>
    </div>
  );
};