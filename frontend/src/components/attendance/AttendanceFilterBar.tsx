import React from 'react';
import { Branch } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconRefresh, IconCalendar, IconFilter } from '../ui/Icons';

interface AttendanceFilterBarProps {
  branches?: Branch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
}

export const AttendanceFilterBar: React.FC<AttendanceFilterBarProps> = ({
  branches,
  selectedBranchId,
  onBranchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
            Branch:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
          >
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {!b.active ? '(Inactive)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Window */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <IconCalendar size={12} className="text-zinc-400" />
            From:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-2 py-1 text-xs font-mono rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
          />
          <span className="text-[11px] font-mono text-zinc-400">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-2 py-1 text-xs font-mono rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <IconFilter size={12} className="text-zinc-400" />
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="gap-1.5"
      >
        <IconRefresh size={13} className="text-zinc-500" />
        <span>Refresh</span>
      </Button>
    </div>
  );
};
