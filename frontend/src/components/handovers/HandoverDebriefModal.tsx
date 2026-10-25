import React, { useState, useEffect } from 'react';
import { ShiftHandover, HandoverItemType, Issue } from '../../lib/types';
import { Modal, Button, Input, Badge } from '../ui';
import { IconPlus, IconClose, IconAlertTriangle } from '../ui/Icons';
import { HandoverStatusBadge } from './HandoverStatusBadge';

const getItemBadgeVariant = (type: HandoverItemType): 'success' | 'warning' | 'urgent' | 'brand' | 'neutral' => {
  switch (type) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'ISSUE':
      return 'urgent';
    case 'NOTE':
      return 'brand';
    default:
      return 'neutral';
  }
};

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
  const [newItemType, setNewItemType] = useState<HandoverItemType>('COMPLETED');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemIssueId, setNewItemIssueId] = useState('');

  useEffect(() => {
    if (handover) {
      setDebriefNotes(handover.notes || '');
      setDebriefItems(
        handover.items.map((it) => ({
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
      title={isDraft ? 'Prepare Shift Handover Debrief' : 'Shift Handover Details'}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 rounded-lg flex items-center gap-2">
            <IconAlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {handover && (
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs">
            <div>
              <span className="font-semibold text-zinc-900 block text-sm">{handover.shiftName || 'Shift'}</span>
              <span className="text-zinc-500">
                {new Date(handover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(handover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <HandoverStatusBadge status={handover.status} />
          </div>
        )}

        {/* Debrief Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">
            Debrief Summary & Operational Notes
          </label>
          <textarea
            value={debriefNotes}
            onChange={(e) => setDebriefNotes(e.target.value)}
            disabled={!isDraft}
            rows={3}
            placeholder="Summarize key store conditions, inventory shortages, customer highlights..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs disabled:bg-zinc-100 disabled:text-zinc-600"
          />
        </div>

        {/* Existing Items */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-[#131416]">
            Turnover checklist items ({debriefItems.length})
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {debriefItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-start justify-between gap-2.5 text-xs"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Badge variant={getItemBadgeVariant(item.type)} size="sm">{item.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-800 text-sm leading-relaxed block">{item.content}</span>
                    {item.issueId && (
                      <span className="text-xs text-rose-700 font-medium block mt-0.5">
                        Linked Issue ID: {item.issueId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>

                {isDraft && (
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Item (Only if Draft) */}
        {isDraft && (
          <div className="p-3.5 border border-zinc-200/90 bg-zinc-50/60 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-zinc-800 block">Add Turnover Item</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as HandoverItemType)}
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
              >
                <option value="COMPLETED">Completed Task</option>
                <option value="PENDING">Pending Handover</option>
                <option value="ISSUE">Linked Issue</option>
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
                  className="sm:col-span-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
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
                  placeholder="Describe status, action taken, or reminder..."
                  className="sm:col-span-2 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-2xs"
                />
              )}
            </div>

            {newItemType === 'ISSUE' && (
              <Input
                label="Custom Issue Note (Optional)"
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Additional instructions for incoming supervisor regarding this incident..."
              />
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                disabled={!newItemContent.trim()}
                className="gap-1 text-xs"
              >
                <IconPlus size={13} />
                <span>Add Item</span>
              </Button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>

          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveDraft(debriefNotes, debriefItems)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit(debriefNotes, debriefItems)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Handover'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
