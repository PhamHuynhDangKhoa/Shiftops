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
          <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-800 text-xs rounded-md flex items-center gap-2">
            <IconAlertTriangle size={14} className="text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {handover && (
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">{handover.shiftName || 'Shift'}</h3>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                {new Date(handover.shiftStartTime).toLocaleString()} —{' '}
                {new Date(handover.shiftEndTime).toLocaleTimeString()}
              </p>
            </div>
            <HandoverStatusBadge status={handover.status} />
          </div>
        )}

        {/* Operational Notes */}
        <div>
          <label className="block text-[11px] font-mono font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
            Debrief Notes
          </label>
          <textarea
            value={debriefNotes}
            onChange={(e) => setDebriefNotes(e.target.value)}
            disabled={!isDraft}
            rows={3}
            placeholder="Operational updates, inventory low warnings, customer notices..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
          />
        </div>

        {/* Handover Items */}
        <div className="space-y-3">
          <label className="block text-[11px] font-mono font-medium text-zinc-600 uppercase tracking-wider">
            Structured Operational Items
          </label>

          {/* Item Builder (Draft only) */}
          {isDraft && (
            <div className="p-3 bg-zinc-50 rounded-md border border-zinc-200 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as HandoverItemType)}
                  className="px-2 py-1.5 border border-zinc-300 rounded-md text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="ISSUE">ISSUE</option>
                  <option value="NOTE">NOTE</option>
                </select>

                <div className="sm:col-span-3">
                  <Input
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="Add an operational action item or observation..."
                    className="text-xs py-1.5"
                  />
                </div>
              </div>

              {newItemType === 'ISSUE' && branchIssues && branchIssues.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">Link Branch Issue:</span>
                  <select
                    value={newItemIssueId}
                    onChange={(e) => setNewItemIssueId(e.target.value)}
                    className="px-2 py-1 border border-zinc-300 rounded-md text-xs bg-white text-zinc-800 flex-1 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">-- None (Standalone Issue Item) --</option>
                    {branchIssues.map((bi) => (
                      <option key={bi.id} value={bi.id}>
                        [{bi.priority}] {bi.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!newItemContent.trim()}
                  className="gap-1.5 text-xs"
                >
                  <IconPlus size={12} />
                  <span>Add Item</span>
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          {debriefItems.length > 0 ? (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {debriefItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-md border border-zinc-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant={getItemBadgeVariant(it.type)} size="sm">{it.type}</Badge>
                    <span className="text-zinc-800 truncate">{it.content}</span>
                  </div>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Remove item"
                    >
                      <IconClose size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">No operational items added yet.</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {isDraft && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSaveDraft(debriefNotes, debriefItems)}
                isLoading={isSaving}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (window.confirm('Submit handover? Once submitted, it cannot be modified.')) {
                    onSubmit(debriefNotes, debriefItems);
                  }
                }}
                isLoading={isSubmitting}
              >
                Submit Handover
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
