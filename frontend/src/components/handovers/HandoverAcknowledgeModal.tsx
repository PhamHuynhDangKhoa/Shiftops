import React, { useState } from 'react';
import { ShiftHandover } from '../../lib/types';
import { Modal } from '../ui';
import { IconCheck, IconAlertTriangle } from '../ui/Icons';
import { formatHandoverTime } from './handoverUtils';

interface HandoverAcknowledgeModalProps {
  isOpen: boolean;
  handover: ShiftHandover | null;
  onClose: () => void;
  onAcknowledge: (handoverId: string, notes: string) => void;
  isPending: boolean;
}

export const HandoverAcknowledgeModal: React.FC<HandoverAcknowledgeModalProps> = ({
  isOpen,
  handover,
  onClose,
  onAcknowledge,
  isPending,
}) => {
  const [ackNotes, setAckNotes] = useState('');

  if (!isOpen || !handover) return null;

  const handleConfirm = () => {
    onAcknowledge(handover.id, ackNotes);
    setAckNotes('');
  };

  const pendingCount = handover.items?.filter((i) => i.type === 'PENDING').length || 0;
  const issueCount = handover.items?.filter((i) => i.type === 'ISSUE').length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acknowledge Shift Turnover"
      description="Formally accept operational accountability and checklist status from outgoing shift lead"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Turnover Summary Preview */}
        <div className="p-3.5 bg-[#f9fbfc] border border-[#e8eaec] rounded-lg space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#131416]">
              {handover.shiftName || 'Operational Shift'}
            </span>
            <span className="text-[12px] text-[#5d5f60] tabular-nums">
              {formatHandoverTime(handover.shiftStartTime)} – {formatHandoverTime(handover.shiftEndTime)}
            </span>
          </div>

          <p className="text-[#5d5f60] text-[13px]">
            Outgoing lead: <strong className="text-[#131416] font-medium">{handover.submittedByName || 'Staff Member'}</strong>
          </p>

          <div className="flex items-center gap-3 pt-1 border-t border-[#e8eaec] text-[12px]">
            <span className="text-[#5d5f60]">
              Takeover items: <strong className="text-[#131416] font-semibold tabular-nums">{handover.items?.length || 0}</strong>
            </span>
            {pendingCount > 0 && (
              <span className="text-[#92400e] font-medium">
                {pendingCount} carryover
              </span>
            )}
            {issueCount > 0 && (
              <span className="text-[#c4242a] font-medium">
                {issueCount} active issues
              </span>
            )}
          </div>
        </div>

        {/* Notes Input */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-[#131416] block">
            Incoming Supervisor Turnover Notes (Optional)
          </label>
          <textarea
            value={ackNotes}
            onChange={(e) => setAckNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Till counts confirmed at ¥45,000. Espresso wand issue escalated to engineering..."
            className="w-full px-3 py-2 border border-[#e8eaec] bg-white text-[#131416] rounded-lg text-[13px] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#131416]"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#e8eaec]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#e8eaec] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#131416] text-white hover:bg-black transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <IconCheck size={14} />
            <span>{isPending ? 'Signing Turnover...' : 'Confirm & Sign Turnover'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
