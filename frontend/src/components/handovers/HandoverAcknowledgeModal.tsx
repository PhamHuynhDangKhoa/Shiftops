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
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You are formally acknowledging receipt of the operational debrief from the previous shift.
        </p>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Acknowledgement Notes (Optional)
          </label>
          <textarea
            value={ackNotes}
            onChange={(e) => setAckNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Reviewed tasks, continuing unresolved inventory count..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Confirm Acknowledgement
          </Button>
        </div>
      </div>
    </Modal>
  );
};
