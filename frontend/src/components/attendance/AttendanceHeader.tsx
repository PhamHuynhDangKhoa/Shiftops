import React from 'react';
import { Branch } from '../../lib/types';

interface AttendanceHeaderProps {
  isStaff: boolean;
  isOwner: boolean;
  isManager: boolean;
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
  isRefreshing: boolean;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  isStaff,
  isOwner,
  isManager,
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
  isRefreshing,
}) => {
  const currentBranch = branches?.find((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-4 pb-4 border-b border-[#f0f1f2]">
      {/* Top Deck: Page Title + Branch Scope + Refresh */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#131416]">
            {isStaff ? 'My Attendance & Punch Terminal' : 'Staff Attendance Ledger'}
          </h1>
          <p className="text-[13px] text-[#5d5f60] mt-1">
            <span className="font-medium text-[#131416]">
              {currentBranch?.name || 'Shibuya Flagship'}
            </span>{' '}
            · Live STOMP event sync · Shift check-in compliance & audit history
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Selector for Owner / Manager */}
          {(isOwner || isManager) && branches && branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="h-9 px-3 rounded-md bg-white border border-[#cdced1] text-[13px] font-medium text-[#131416] focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} disabled={!b.active}>
                  {b.name} {!b.active ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 px-3.5 rounded-md bg-white border border-[#cdced1] text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Date Range + Status Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 text-[13px]">
        {/* Status Filter Segmented Controls */}
        <div className="flex items-center bg-[#f4f6f8] p-0.5 rounded-md border border-[#cdced1] overflow-x-auto">
          {[
            { id: 'ALL', label: 'All records' },
            { id: 'PRESENT', label: 'On floor' },
            { id: 'LATE', label: 'Late' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'ABSENT', label: 'Absent' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`h-7 px-3 rounded text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-[#131416] font-semibold border border-[#cdced1]'
                  : 'text-[#5d5f60] hover:text-[#131416]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[#5d5f60] font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-8 px-2.5 text-[13px] rounded border border-[#cdced1] bg-white text-[#131416] font-mono tabular-nums focus:outline-none focus:border-[#1b6c80]"
          />
          <span className="text-[#5d5f60] font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-8 px-2.5 text-[13px] rounded border border-[#cdced1] bg-white text-[#131416] font-mono tabular-nums focus:outline-none focus:border-[#1b6c80]"
          />
        </div>
      </div>
    </div>
  );
};
