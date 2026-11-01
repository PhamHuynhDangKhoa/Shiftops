import React from 'react';
import { ShiftAssignment, TaskPriority } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateAdHocTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: ShiftAssignment[];
  assignmentId: string;
  onSelectAssignmentId: (id: string) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  priority: TaskPriority;
  onChangePriority: (priority: TaskPriority) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const CreateAdHocTaskModal: React.FC<CreateAdHocTaskModalProps> = ({
  isOpen,
  onClose,
  assignments,
  assignmentId,
  onSelectAssignmentId,
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  priority,
  onChangePriority,
  onSubmit,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Ad-Hoc Task"
      description="Assign a single task directly to an on-duty staff member"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Assign to Staff Member</label>
          <select
            value={assignmentId}
            onChange={(e) => onSelectAssignmentId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.userName} ({a.userRole})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Task Title"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="e.g. Unpack supply shipment, sanitize workstation"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            rows={2}
            placeholder="Additional requirements or context..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => onChangePriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High (Urgent)</option>
          </select>
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
            disabled={!title.trim() || !assignmentId || isPending}
          >
            {isPending ? 'Assigning...' : 'Assign Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
