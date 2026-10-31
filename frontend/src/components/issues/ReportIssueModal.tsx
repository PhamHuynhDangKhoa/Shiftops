import React from 'react';
import { Branch, IssueCategory, IssuePriority } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  branches?: Branch[];
  branchId: string;
  onBranchIdChange: (branchId: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  category: IssueCategory;
  onCategoryChange: (category: IssueCategory) => void;
  priority: IssuePriority;
  onPriorityChange: (priority: IssuePriority) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  isOwner,
  branches,
  branchId,
  onBranchIdChange,
  title,
  onTitleChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  description,
  onDescriptionChange,
  onFileChange,
  onSubmit,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Incident / Maintenance Issue"
      description="Log equipment, facility, maintenance, or safety concerns for manager triage"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {isOwner && branches && branches.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#5d5f60]">Operating Branch</label>
            <select
              value={branchId}
              onChange={(e) => onBranchIdChange(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.active && '(Inactive)'}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Incident Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. POS terminal offline, walk-in cooler temp spiking"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#5d5f60]">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as IssueCategory)}
              className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
            >
              <option value="EQUIPMENT">Equipment</option>
              <option value="FACILITY">Facility</option>
              <option value="SAFETY">Safety</option>
              <option value="INVENTORY">Inventory</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#5d5f60]">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as IssuePriority)}
              className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High (Escalated)</option>
              <option value="URGENT">Urgent (Immediate Danger / Outage)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#5d5f60]">Description & Symptoms</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            placeholder="Describe the incident, location, symptoms, or temporary measures taken..."
            required
            className="w-full p-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#1b6c80] leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#5d5f60]">Attach Photo Evidence (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="text-xs text-[#5d5f60] file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border file:border-[#cdced1] file:text-xs file:font-medium file:bg-[#f0f1f3] file:text-[#131416] hover:file:bg-[#e4e5e7] cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eaec]">
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
            disabled={!title.trim() || !description.trim() || isPending}
          >
            {isPending ? 'Submitting...' : 'Report Issue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
