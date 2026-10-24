import React from 'react';
import { IconFilter } from '../ui/Icons';

interface IssueFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isStaff: boolean;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (priority: string) => void;
}

export const IssueFilterBar: React.FC<IssueFilterBarProps> = ({
  statusFilter,
  onStatusChange,
  isStaff,
  categoryFilter = 'ALL',
  onCategoryChange,
  priorityFilter = 'ALL',
  onPriorityChange,
}) => {
  return (
    <div className="bg-[#11141a] border border-[#262c38] p-3.5 mb-5 flex flex-wrap items-center gap-3 text-xs clip-chamfer-btn font-mono">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-[#606c80] uppercase tracking-wider flex items-center gap-1.5">
          <IconFilter size={12} className="text-[#00f0ff]" />
          STATUS:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
        >
          <option value="ALL">ALL STATUSES</option>
          <option value="OPEN">OPEN</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {!isStaff && onCategoryChange && onPriorityChange && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-[#606c80] uppercase tracking-wider">
              CATEGORY:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="EQUIPMENT">EQUIPMENT</option>
              <option value="FACILITY">FACILITY</option>
              <option value="SAFETY">SAFETY</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="STAFFING">STAFFING</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-[#606c80] uppercase tracking-wider">
              PRIORITY:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="ALL">ALL PRIORITIES</option>
              <option value="URGENT">URGENT (CRITICAL)</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
