import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name?: string; startTime: string; endTime: string; notes?: string }) => void;
  isPending: boolean;
  formError: string | null;
}

export const CreateShiftModal: React.FC<CreateShiftModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  formError,
}) => {
  const [shiftName, setShiftName] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!startDateTime || !endDateTime) {
      setLocalError('Start time and end time are required.');
      return;
    }

    const start = new Date(startDateTime).toISOString();
    const end = new Date(endDateTime).toISOString();

    if (new Date(start) >= new Date(end)) {
      setLocalError('End time must be strictly after start time.');
      return;
    }

    onSubmit({
      name: shiftName.trim() || undefined,
      startTime: start,
      endTime: end,
      notes: shiftNotes.trim() || undefined,
    });
  };

  const effectiveError = localError || formError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Shift"
      description="Define working hours, notes, and operating schedule for this shift"
    >
      {effectiveError && (
        <div className="p-3 mb-4 rounded-sm bg-[#ff1744]/10 border border-[#ff1744]/30 text-xs font-mono text-[#ff335c]">
          {effectiveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono">
        <Input
          label="Shift Name (Optional)"
          value={shiftName}
          onChange={(e) => setShiftName(e.target.value)}
          placeholder="e.g. Morning Floor Crew, Night Cashier"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-[#8a94a6]">Start Time</label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-[#8a94a6]">End Time</label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Instructions / Notes (Optional)</label>
          <textarea
            value={shiftNotes}
            onChange={(e) => setShiftNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Bring key for inventory room, deep cleaning on handoff"
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#262c38]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
          >
            {isPending ? 'Creating...' : 'Create Shift'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
