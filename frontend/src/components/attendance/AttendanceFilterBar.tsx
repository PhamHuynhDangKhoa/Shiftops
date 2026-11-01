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
    <div className="bg-white border border-[#e8eaec] rounded-lg p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#5d5f60]">
            Branch:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
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
          <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1">
            <IconCalendar size={13} className="text-[#5d5f60]" />
            From:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5d5f60]">
            To:
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5d5f60] flex items-center gap-1">
            <IconFilter size={13} className="text-[#5d5f60]" />
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
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
