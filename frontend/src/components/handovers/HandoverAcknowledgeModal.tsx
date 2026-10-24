import React, { useState } from 'react';
import { ShiftHandover } from '../../lib/types';
import { Modal, Button } from '../ui';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acknowledge Shift Handover"
      description="Formally acknowledge receipt of operational notes and ongoing responsibilities from outgoing staff"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">
            Acknowledgement Notes (Optional)
          </label>
          <textarea
            value={ackNotes}
            onChange={(e) => setAckNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Reviewed task backlog, proceeding with unresolved equipment issue..."
            className="w-full px-3 py-2 border border-zinc-300 bg-white text-zinc-900 rounded-lg text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Confirming...' : 'Confirm Acknowledgement'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
