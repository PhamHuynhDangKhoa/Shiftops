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
        className="space-y-4 font-mono"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Assign to Personnel</label>
          <select
            value={assignmentId}
            onChange={(e) => onSelectAssignmentId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            rows={2}
            placeholder="Additional requirements or context..."
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => onChangePriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High (Urgent)</option>
          </select>
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
            disabled={!title.trim() || !assignmentId || isPending}
          >
            {isPending ? 'Assigning...' : 'Assign Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
