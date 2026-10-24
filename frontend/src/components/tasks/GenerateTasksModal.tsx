import React from 'react';
import { Shift, TaskTemplate } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface GenerateTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchShifts?: Shift[];
  branchTemplates?: TaskTemplate[];
  selectedShiftId: string;
  onSelectShiftId: (shiftId: string) => void;
  selectedTemplateId: string;
  onSelectTemplateId: (templateId: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const GenerateTasksModal: React.FC<GenerateTasksModalProps> = ({
  isOpen,
  onClose,
  branchShifts = [],
  branchTemplates = [],
  selectedShiftId,
  onSelectShiftId,
  selectedTemplateId,
  onSelectTemplateId,
  onSubmit,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Shift Tasks from Template"
      description="Select an active shift roster and standard operating checklist to generate tasks for assigned personnel"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4 font-mono"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Target Shift</label>
          <select
            value={selectedShiftId}
            onChange={(e) => onSelectShiftId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="">-- Choose Target Shift --</option>
            {branchShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) — {s.assignments?.length || 0} Staff
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Checklist Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplateId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="">-- Choose Template --</option>
            {branchTemplates.filter((t) => t.active).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.items?.length || 0} checklist items)
              </option>
            ))}
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
            disabled={!selectedShiftId || !selectedTemplateId || isPending}
          >
            {isPending ? 'Generating...' : 'Generate Tasks'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
