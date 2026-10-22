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
    <div className="bg-white border border-zinc-200 rounded-lg p-3.5 mb-5 flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
          <IconFilter size={12} className="text-zinc-400" />
          Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
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
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="FACILITY">Facility</option>
              <option value="SAFETY">Safety</option>
              <option value="INVENTORY">Inventory</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
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
