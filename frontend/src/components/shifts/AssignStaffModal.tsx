import React, { useState } from 'react';
import { Shift, User } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AssignStaffModalProps {
  shift: Shift | null;
  branchStaff?: User[];
  onClose: () => void;
  onSubmit: (shiftId: string, userId: string) => void;
  isPending: boolean;
  assignError: string | null;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  shift,
  branchStaff,
  onClose,
  onSubmit,
  isPending,
  assignError,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');

  if (!shift) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    onSubmit(shift.id, selectedStaffId);
  };

  const assignedUserIds = new Set(shift.assignments.map((a) => a.userId));
  const availableStaff = branchStaff?.filter((s) => !assignedUserIds.has(s.id)) || [];

  return (
    <Modal
      isOpen={!!shift}
      onClose={onClose}
      title={`Assign Staff to ${shift.name || 'Shift'}`}
      description={`Hours: ${formatDateTime(shift.startTime)} → ${formatDateTime(shift.endTime)}`}
    >
      {assignError && (
        <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {assignError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Select Available Staff Member</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          >
            <option value="">-- Choose Staff Member --</option>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.email}) · {s.role}
              </option>
            ))}
          </select>
          {availableStaff.length === 0 && (
            <span className="text-xs text-zinc-500 mt-1">
              All active staff members for this branch are currently assigned to this shift.
            </span>
          )}
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
            disabled={!selectedStaffId || isPending}
          >
            {isPending ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
