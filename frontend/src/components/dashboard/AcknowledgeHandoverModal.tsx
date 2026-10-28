import React, { useState } from 'react';
import { ShiftHandover } from '../../lib/types';
import { Modal, Button } from '../ui';

export interface AcknowledgeHandoverModalProps {
  handover: ShiftHandover | null;
  onClose: () => void;
  onConfirm: (handoverId: string, notes: string) => void;
  isSubmitting: boolean;
}

export const AcknowledgeHandoverModal: React.FC<AcknowledgeHandoverModalProps> = ({
  handover,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!handover) return;
    onConfirm(handover.id, notes);
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={!!handover}
      onClose={handleClose}
      title="Sign Shift Turnover Debrief"
      description="Formally acknowledge operational handover and assume floor responsibility"
    >
      <div className="space-y-4">
        <div className="p-3 bg-[#f4f6f8] border border-[#e8eaec] rounded-md text-xs space-y-1">
          <span className="font-semibold text-[#131416] block">
            Outgoing Shift: {handover?.shiftName || 'Shift Turnover'}
          </span>
          <span className="text-[#5d5f60]">
            Submitted by: {handover?.submittedByName || 'Staff lead'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#131416]">
            Manager Sign-off Remarks
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Reviewed shift accomplishments, proceeding with pending tasks..."
            className="w-full px-3 py-2 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#727477] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="dark"
            size="sm"
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? 'Signing...' : 'Confirm Sign-off'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
