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
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  onExportCsv?: () => void;
  showMetrics?: boolean;
  onToggleMetrics?: () => void;
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
  searchQuery = '',
  onSearchQueryChange,
  onExportCsv,
  showMetrics = false,
  onToggleMetrics,
}) => {
  const currentBranch = branches?.find((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-4 pb-4 border-b border-[#f0f1f2]">
      {/* Top Deck: Page Title + Branch Scope + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416]">
            {isStaff ? 'My Attendance & Punch Terminal' : 'Staff Attendance Ledger'}
          </h1>
          <p className="text-[13px] text-[#5d5f60] mt-1">
            <span className="font-medium text-[#131416]">
              {currentBranch?.name || 'Shibuya Flagship'}
            </span>{' '}
            · Live STOMP event sync · Shift check-in compliance &amp; audit history
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

          {/* Export CSV for Manager / Owner */}
          {!isStaff && onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="h-9 px-3.5 rounded-md bg-white border border-[#cdced1] text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer flex items-center gap-2 shrink-0"
              title="Download RFC 4180 compliant CSV payroll timecard audit"
            >
              <svg
                className="w-3.5 h-3.5 text-[#5d5f60]"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 2v8m0 0l3-3m-3 3L5 7M2 14h12" />
              </svg>
              <span>Export CSV</span>
            </button>
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

      {/* Toolbar: Status Filter Tabs + Search + Date Range + Metrics Toggle */}
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

        {/* Right Deck: Search Filter + Date Range Picker + Metrics Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Collapsible Metrics Toggle (Manager/Owner only) */}
          {!isStaff && onToggleMetrics && (
            <button
              type="button"
              onClick={onToggleMetrics}
              className={`h-8 px-2.5 rounded text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                showMetrics
                  ? 'bg-[#1b6c80] text-white border-[#1b6c80]'
                  : 'bg-white text-[#5d5f60] border-[#cdced1] hover:text-[#131416]'
              }`}
              title={showMetrics ? 'Collapse analytics strip' : 'Expand floor analytics strip'}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 13h12M4 9l3-3 2 2 3-4" />
              </svg>
              <span>{showMetrics ? 'Hide Metrics' : 'Metrics'}</span>
            </button>
          )}

          {onSearchQueryChange && (
            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Filter associate or shift..."
                className="h-8 pl-3 pr-7 text-[13px] rounded border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#5d5f60] focus:outline-none focus:border-[#1b6c80]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#5d5f60] hover:text-[#131416] cursor-pointer"
                  aria-label="Clear search query"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              )}
            </div>
          )}

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
    </div>
  );
};
