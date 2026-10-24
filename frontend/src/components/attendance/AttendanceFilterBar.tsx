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
    <div className="bg-white border border-zinc-200/80 rounded-xl p-4 mb-5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-3.5">
        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Branch:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
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
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <IconCalendar size={13} className="text-zinc-400" />
            From:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            To:
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <IconFilter size={13} className="text-zinc-400" />
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Refresh Trigger */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="gap-1.5 whitespace-nowrap"
      >
        <IconRefresh size={14} />
        <span>Refresh</span>
      </Button>
    </div>
  );
};
