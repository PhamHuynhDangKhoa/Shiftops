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
      title="Report Operational Incident"
      description="Log equipment, facility, maintenance, or safety concerns for immediate triage"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4 font-mono"
      >
        {isOwner && branches && branches.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-[#8a94a6]">Operating Sector</label>
            <select
              value={branchId}
              onChange={(e) => onBranchIdChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <label className="text-xs font-semibold uppercase text-[#8a94a6]">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as IssueCategory)}
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <label className="text-xs font-semibold uppercase text-[#8a94a6]">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as IssuePriority)}
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Safety / Blocker)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Detailed Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            placeholder="Explain symptoms, exact location, and operational disruption..."
            required
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Attachment (Optional Image / Log)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="w-full text-xs text-[#8a94a6] font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-[#262c38] file:text-xs file:font-mono file:bg-[#181c24] file:text-white hover:file:border-[#00f0ff] cursor-pointer"
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
            disabled={!title.trim() || !description.trim() || isPending}
          >
            {isPending ? 'Logging...' : 'Submit Incident Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
