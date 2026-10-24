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
    <div className="bg-[#11141a] border border-[#262c38] p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs clip-chamfer-btn">
      <div className="flex flex-wrap items-center gap-3">
        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider">
            SECTOR:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
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
          <span className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider flex items-center gap-1">
            <IconCalendar size={12} className="text-[#00f0ff]" />
            FROM:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider">
            TO:
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider flex items-center gap-1">
            <IconFilter size={12} className="text-[#ff6b00]" />
            STATUS:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ABSENT">ABSENT</option>
          </select>
        </div>
      </div>

      {/* Refresh Trigger */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="gap-1.5 text-xs"
        title="Sync telemetry"
      >
        <IconRefresh size={13} className="text-[#00f0ff]" />
        <span>[ RE-SYNC ]</span>
      </Button>
    </div>
  );
};
