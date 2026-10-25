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
    <div className="bg-white border border-[#e8eaec] rounded-lg p-3.5 mb-5 flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[#5d5f60] flex items-center gap-1.5">
          <IconFilter size={13} className="text-[#5d5f60]" />
          Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {!isStaff && onCategoryChange && onPriorityChange && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#5d5f60]">
              Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="FACILITY">Facility</option>
              <option value="SAFETY">Safety</option>
              <option value="INVENTORY">Inventory</option>
              <option value="STAFFING">Staffing</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#5d5f60]">
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
