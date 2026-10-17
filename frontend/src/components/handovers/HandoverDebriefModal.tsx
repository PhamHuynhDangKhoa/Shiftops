import React, { useState, useEffect } from 'react';
import { ShiftHandover, HandoverItemType, Issue } from '../../lib/types';
import { Modal, Button, Input, Badge } from '../ui';
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

interface DebriefItemState {
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
      <div className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {handover && (
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900">{handover.shiftName || 'Shift'}</h3>
              <p className="text-xs text-gray-500">
                {new Date(handover.shiftStartTime).toLocaleString()} -{' '}
                {new Date(handover.shiftEndTime).toLocaleTimeString()}
              </p>
            </div>
            <Badge
              variant={
                handover.status === 'ACKNOWLEDGED'
                  ? 'success'
                  : handover.status === 'SUBMITTED'
                  ? 'warning'
                  : 'neutral'
              }
            >
              {handover.status}
            </Badge>
          </div>
        )}

        {/* Operational Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Debrief Notes
          </label>
          <textarea
            value={debriefNotes}
            onChange={(e) => setDebriefNotes(e.target.value)}
            disabled={!isDraft}
            rows={3}
            placeholder="Operational updates, inventory low warnings, customer notices..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Handover Items */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Structured Operational Items
          </label>

          {/* Item Builder (Draft only) */}
          {isDraft && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as HandoverItemType)}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-xs font-bold bg-white"
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
                    className="text-xs"
                  />
                </div>
              </div>

              {newItemType === 'ISSUE' && branchIssues && branchIssues.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Link Branch Issue:</span>
                  <select
                    value={newItemIssueId}
                    onChange={(e) => setNewItemIssueId(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700 flex-1"
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

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={!newItemContent.trim()}
                  className="text-xs"
                >
                  + Add Item
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          {debriefItems.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {debriefItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant={getItemBadgeVariant(it.type)}>{it.type}</Badge>
                    <span className="text-gray-900 text-xs md:text-sm">{it.content}</span>
                  </div>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No operational items added yet.</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={() => onSaveDraft(debriefNotes, debriefItems)}
                isLoading={isSaving}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (window.confirm('Submit handover? Once submitted, it cannot be modified.')) {
                    onSubmit(debriefNotes, debriefItems);
                  }
                }}
                isLoading={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
