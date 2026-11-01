import React from 'react';
import { Issue, IssueSummary } from '../../lib/types';
import { IconSearch, IconCheck } from '../ui/Icons';

export type IssueTabFilter = 'ALL' | 'ACTIVE' | 'RESOLVED';

interface IssueListPaneProps {
  issues: (Issue | IssueSummary)[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  isLoading: boolean;
  tabFilter: IssueTabFilter;
  onTabFilterChange: (tab: IssueTabFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  counts: {
    all: number;
    active: number;
    resolved: number;
  };
}

export const IssueListPane: React.FC<IssueListPaneProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  isLoading,
  tabFilter,
  onTabFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  counts,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#fafbfc]">
      {/* 1. Quiet Search & Filter Bar */}
      <div className="p-3 border-b border-[#e8eaec] space-y-2.5 bg-white">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5d5f60] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search issues..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#1b6c80] transition-colors"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-8 px-2 text-xs rounded border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
            aria-label="Filter by category"
          >
            <option value="ALL">All categories</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="FACILITY">Facility</option>
            <option value="SAFETY">Safety</option>
            <option value="INVENTORY">Inventory</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-4 text-xs font-medium pt-1">
          <button
            type="button"
            data-testid="tab-all"
            onClick={() => onTabFilterChange('ALL')}
            className={`pb-1.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
              tabFilter === 'ALL'
                ? 'border-[#131416] text-[#131416] font-semibold'
                : 'border-transparent text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            <span>All</span>
            <span className="font-mono tabular-nums text-[11px] text-[#5d5f60]">{counts.all}</span>
          </button>

          <button
            type="button"
            data-testid="tab-active"
            onClick={() => onTabFilterChange('ACTIVE')}
            className={`pb-1.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
              tabFilter === 'ACTIVE'
                ? 'border-[#1b6c80] text-[#1b6c80] font-semibold'
                : 'border-transparent text-[#5d5f60] hover:text-[#1b6c80]'
            }`}
          >
            <span>Open</span>
            <span className="font-mono tabular-nums text-[11px] text-[#5d5f60]">{counts.active}</span>
          </button>

          <button
            type="button"
            data-testid="tab-resolved"
            onClick={() => onTabFilterChange('RESOLVED')}
            className={`pb-1.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
              tabFilter === 'RESOLVED'
                ? 'border-[#1e7b4f] text-[#1e7b4f] font-semibold'
                : 'border-transparent text-[#5d5f60] hover:text-[#1e7b4f]'
            }`}
          >
            <span>Resolved</span>
            <span className="font-mono tabular-nums text-[11px] text-[#5d5f60]">{counts.resolved}</span>
          </button>
        </div>
      </div>

      {/* 2. Quiet Issue Rows */}
      <div className="overflow-y-auto divide-y divide-[#f0f1f2] flex-1">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#5d5f60]">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5d5f60] px-4 space-y-1">
            <IconCheck size={16} className="mx-auto text-[#1e7b4f]" />
            <p>No issues match this filter.</p>
          </div>
        ) : (
          issues.map((item) => {
            const isSelected = selectedIssueId === item.id;
            const isUrgent = item.priority === 'URGENT';
            const isHigh = item.priority === 'HIGH';
            const isResolved = item.status === 'RESOLVED' || item.status === 'CLOSED';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectIssue(item.id)}
                className={`w-full text-left px-3.5 py-3 transition-colors cursor-pointer block border-l-2 ${
                  isSelected
                    ? 'bg-white border-l-[#1b6c80] shadow-xs'
                    : 'hover:bg-[#f4f6f8] border-l-transparent'
                }`}
              >
                {/* Line 1: Priority dot + Title + Timestamp */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isResolved
                        ? 'bg-[#1e7b4f]'
                        : isUrgent
                        ? 'bg-[#c4242a]'
                        : isHigh
                        ? 'bg-[#d97706]'
                        : 'bg-[#94a3b8]'
                    }`}
                  />
                  <span
                    className={`text-xs truncate flex-1 ${
                      isSelected ? 'font-semibold text-[#131416]' : 'font-medium text-[#131416]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-[#5d5f60] flex-shrink-0">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Line 2: Category · Reporter · Assignee */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#5d5f60] mt-1 pl-4 truncate">
                  <span className="capitalize">{item.category.toLowerCase()}</span>
                  <span>·</span>
                  <span className="truncate">{item.reportedByName}</span>
                  {item.assignedToName && (
                    <>
                      <span>→</span>
                      <span className="text-[#1b6c80] font-medium truncate">{item.assignedToName}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};