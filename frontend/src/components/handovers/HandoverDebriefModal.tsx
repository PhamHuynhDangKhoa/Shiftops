import React, { useState, useEffect } from 'react';
import { ShiftHandover, HandoverItemType, Issue } from '../../lib/types';
import { Modal } from '../ui';
import { IconPlus, IconClose, IconAlertTriangle } from '../ui/Icons';
import { HandoverStatusBadge } from './HandoverStatusBadge';
import { formatHandoverTime, formatHandoverDateTime } from './handoverUtils';

export interface DebriefItemState {
  type: HandoverItemType;
  content: string;
  issueId?: string;
  orderIndex: number;
}

interface HandoverDebriefModalProps {
  isOpen: boolean;
  handover: ShiftHandover | null;
  branchIssues?: Issue[];
  errorMessage: string | null;
  onClose: () => void;
  onSaveDraft: (notes: string, items: DebriefItemState[]) => void;
  onSubmit: (notes: string, items: DebriefItemState[]) => void;
  isSaving: boolean;
  isSubmitting: boolean;
}

const getItemPillClasses = (type: HandoverItemType) => {
  switch (type) {
    case 'COMPLETED':
      return 'bg-[#eaf5ef] border-[#c2e4d0] text-[#1e7b4f]';
    case 'PENDING':
      return 'bg-[#fef3c7] border-[#fde68a] text-[#92400e]';
    case 'ISSUE':
      return 'bg-[#fdeeed] border-[#f7c5c2] text-[#c4242a]';
    case 'NOTE':
    default:
      return 'bg-[#eef7f9] border-[#cde5eb] text-[#1b6c80]';
  }
};

export const HandoverDebriefModal: React.FC<HandoverDebriefModalProps> = ({
  isOpen,
  handover,
  branchIssues,
  errorMessage,
  onClose,
  onSaveDraft,
  onSubmit,
  isSaving,
  isSubmitting,
}) => {
  const [debriefNotes, setDebriefNotes] = useState('');
  const [debriefItems, setDebriefItems] = useState<DebriefItemState[]>([]);
  const [newItemType, setNewItemType] = useState<HandoverItemType>('PENDING');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemIssueId, setNewItemIssueId] = useState('');

  useEffect(() => {
    if (handover) {
      setDebriefNotes(handover.notes || '');
      setDebriefItems(
        (handover.items || []).map((it) => ({
          type: it.type,
          content: it.content,
          issueId: it.issueId,
          orderIndex: it.orderIndex,
        }))
      );
    }
  }, [handover]);

  if (!isOpen) return null;

  const isDraft = handover?.status === 'DRAFT';

  const handleAddItem = () => {
    if (!newItemContent.trim()) return;
    setDebriefItems([
      ...debriefItems,
      {
        type: newItemType,
        content: newItemContent.trim(),
        issueId: newItemIssueId || undefined,
        orderIndex: debriefItems.length + 1,
      },
    ]);
    setNewItemContent('');
    setNewItemIssueId('');
  };

  const handleRemoveItem = (index: number) => {
    setDebriefItems(debriefItems.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDraft ? 'Prepare Shift Handover Debrief' : 'Shift Handover Dossier & Audit'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-[#fdeeed] border border-[#f7c5c2] text-[13px] font-medium text-[#c4242a] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Handover Metadata Banner */}
        {handover && (
          <div className="p-4 bg-[#f9fbfc] border border-[#e8eaec] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <div>
              <span className="font-semibold text-[#131416] block text-[15px]">
                {handover.shiftName || 'Operational Shift'}
              </span>
              <span className="text-[#5d5f60] tabular-nums mt-0.5 block">
                Window: {formatHandoverTime(handover.shiftStartTime)} – {formatHandoverTime(handover.shiftEndTime)} · Branch: {handover.branchName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HandoverStatusBadge status={handover.status} size="md" />
            </div>
          </div>
        )}

        {/* Debrief Notes */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-[#131416] block">
            Debrief Summary & Operational Narrative
          </label>
          <textarea
            value={debriefNotes}
            onChange={(e) => setDebriefNotes(e.target.value)}
            disabled={!isDraft}
            rows={3}
            placeholder="Summarize store conditions, revenue variance, refrigeration temperatures, customer highlights..."
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#e8eaec] bg-white text-[#131416] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#131416] disabled:bg-[#f0f1f2] disabled:text-[#5d5f60]"
          />
        </div>

        {/* Turnover Checklist Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#131416]">
              Turnover checklist items ({debriefItems.length})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {debriefItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-[#e8eaec] rounded-lg flex items-start justify-between gap-2.5 text-[13px]"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border uppercase flex-shrink-0 ${getItemPillClasses(
                      item.type
                    )}`}
                  >
                    {item.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#131416] text-[13px] leading-relaxed">
                      {item.content}
                    </p>
                    {item.issueId && (
                      <span className="text-[12px] text-[#c4242a] font-medium block mt-1">
                        Linked Issue ID: {item.issueId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>

                {isDraft && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-[#8c8f92] hover:text-[#c4242a] p-1 transition-colors"
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Item Form (Only when Draft) */}
        {isDraft && (
          <div className="p-3.5 border border-[#e8eaec] bg-[#f9fbfc] rounded-lg space-y-3">
            <span className="text-[13px] font-semibold text-[#131416] block">
              Add Turnover Checklist Item
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as HandoverItemType)}
                className="px-3 py-1.5 text-[13px] rounded-md border border-[#e8eaec] bg-white text-[#131416] focus:outline-none focus:border-[#131416]"
              >
                <option value="PENDING">Pending Carryover</option>
                <option value="ISSUE">Linked Incident</option>
                <option value="COMPLETED">Completed Task</option>
                <option value="NOTE">General Note</option>
              </select>

              {newItemType === 'ISSUE' ? (
                <select
                  value={newItemIssueId}
                  onChange={(e) => {
                    setNewItemIssueId(e.target.value);
                    const selected = branchIssues?.find((i) => i.id === e.target.value);
                    if (selected && !newItemContent) {
                      setNewItemContent(selected.title);
                    }
                  }}
                  className="sm:col-span-2 px-3 py-1.5 text-[13px] rounded-md border border-[#e8eaec] bg-white text-[#131416] focus:outline-none focus:border-[#131416]"
                >
                  <option value="">-- Select Active Issue --</option>
                  {branchIssues?.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      [{iss.priority}] {iss.title} ({iss.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="Describe task status, maintenance instructions, or cash note..."
                  className="sm:col-span-2 px-3 py-1.5 text-[13px] rounded-md border border-[#e8eaec] bg-white text-[#131416] focus:outline-none focus:border-[#131416]"
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newItemContent.trim()}
                className="h-8 px-3 text-xs font-medium rounded bg-[#1b6c80] text-white hover:bg-[#155464] border border-[#1b6c80] transition-colors disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <IconPlus size={13} />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        )}

        {/* Audit Trail Sign-off Details (When Not Draft) */}
        {!isDraft && handover && (
          <div className="p-3.5 border border-[#e8eaec] bg-[#f9fbfc] rounded-lg space-y-2 text-[13px]">
            <span className="text-[12px] font-medium text-[#5d5f60] block tracking-wide">
              Supervisor Sign-off Audit Trail
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[12px] text-[#5d5f60] block">Outgoing Submission</span>
                <span className="font-medium text-[#131416]">
                  {handover.submittedByName || 'Staff Member'}
                </span>
                <span className="text-[12px] text-[#5d5f60] block tabular-nums">
                  {formatHandoverDateTime(handover.submittedAt)}
                </span>
              </div>
              <div>
                <span className="text-[12px] text-[#5d5f60] block">Incoming Acknowledgment</span>
                <span className="font-medium text-[#131416]">
                  {handover.acknowledgedByName || 'Pending Incoming Signature'}
                </span>
                {handover.acknowledgedAt && (
                  <span className="text-[12px] text-[#5d5f60] block tabular-nums">
                    {formatHandoverDateTime(handover.acknowledgedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#e8eaec]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#e8eaec] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors"
          >
            Close
          </button>

          {isDraft && (
            <>
              <button
                type="button"
                onClick={() => onSaveDraft(debriefNotes, debriefItems)}
                disabled={isSaving}
                className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#e8eaec] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => onSubmit(debriefNotes, debriefItems)}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-medium rounded-md bg-[#1b6c80] text-white hover:bg-[#155464] border border-[#1b6c80] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Handover'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
