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
      description="Define scheduled hours, notes, and operating requirements for this shift"
    >
      {effectiveError && (
        <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {effectiveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Shift Name (Optional)"
          value={shiftName}
          onChange={(e) => setShiftName(e.target.value)}
          placeholder="e.g. Morning Floor Crew, Night Cashier"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Start Time</label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">End Time</label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Instructions / Notes (Optional)</label>
          <textarea
            value={shiftNotes}
            onChange={(e) => setShiftNotes(e.target.value)}
            placeholder="Special operational duties, supervisor handover details, etc."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
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
