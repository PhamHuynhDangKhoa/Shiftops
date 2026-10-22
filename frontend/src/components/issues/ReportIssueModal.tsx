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
        className="space-y-4"
      >
        {isOwner && branches && branches.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700">Operating Branch</label>
            <select
              value={branchId}
              onChange={(e) => onBranchIdChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
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
            <label className="text-xs font-medium text-zinc-700">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as IssueCategory)}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
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
            <label className="text-xs font-medium text-zinc-700">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as IssuePriority)}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Safety / Blocker)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700">Detailed Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            placeholder="Explain symptoms, exact location, and operational disruption..."
            required
            className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700">Attachment (Optional Image / Log)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
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
            {isPending ? 'Logging Incident...' : 'Submit Incident Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
