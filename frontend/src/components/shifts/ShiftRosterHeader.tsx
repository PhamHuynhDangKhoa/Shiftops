import React from 'react';
import { Branch } from '../../lib/types';
import { DayColumn } from './shiftRosterUtils';

export type ShiftViewMode = 'AGENDA' | 'TIMELINE' | 'TABLE';

interface ShiftRosterHeaderProps {
  isStaff: boolean;
  isOwner: boolean;
  isManager: boolean;
  branches?: Branch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  weekDays: DayColumn[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetThisWeek: () => void;
  viewMode: ShiftViewMode;
  onViewModeChange: (mode: ShiftViewMode) => void;
  onCreateClick: () => void;
}

export const ShiftRosterHeader: React.FC<ShiftRosterHeaderProps> = ({
  isStaff,
  isOwner,
  isManager,
  branches,
  selectedBranchId,
  onBranchChange,
  weekDays,
  onPrevWeek,
  onNextWeek,
  onResetThisWeek,
  viewMode,
  onViewModeChange,
  onCreateClick,
}) => {
  const firstDay = weekDays[0];
  const lastDay = weekDays[weekDays.length - 1];
  const dateRangeLabel =
    firstDay && lastDay
      ? `${firstDay.monthLabel} ${firstDay.dayNumber} – ${lastDay.monthLabel} ${lastDay.dayNumber}, ${firstDay.date.getFullYear()}`
      : 'Current Week';

  const currentBranch = branches?.find((b) => b.id === selectedBranchId);

  return (
    <div className="space-y-3 pb-3 border-b border-[#f0f1f2]">
      {/* Top Deck: Page Title + Branch Scope + Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416]">
            {isStaff ? 'My Shift Schedule' : 'Shift Roster & Scheduling'}
          </h1>
          <p className="text-xs text-[#5d5f60] mt-1">
            <span className="font-semibold text-[#131416]">
              {currentBranch?.name || 'Shibuya Flagship'}
            </span>{' '}
            · {dateRangeLabel} ·{' '}
            {isStaff
              ? 'Personal duty agenda and team coverage'
              : 'Weekly staffing matrix and coverage tracking'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Switcher (Owner / Manager) */}
          {(isOwner || isManager) && branches && branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="h-8 px-2.5 rounded-md bg-white border border-[#cdced1] text-xs font-medium text-[#131416] focus:outline-none focus:border-[#131416] cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} disabled={!b.active}>
                  {b.name} {!b.active ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Primary Action Button (Managers / Owners only) */}
          {!isStaff && (
            <button
              type="button"
              onClick={onCreateClick}
              className="h-8 px-3.5 rounded-md bg-[#131416] text-white text-xs font-medium hover:bg-[#2a2f33] border border-[#131416] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Week Navigator + View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
        {/* Week Navigator */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevWeek}
              aria-label="Previous week"
              className="h-7 px-2.5 rounded-md border border-[#cdced1] bg-white text-xs font-medium text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
            >
              ← Prev
            </button>

            <span className="px-2 font-mono tabular-nums font-semibold text-xs text-[#131416] whitespace-nowrap">
              {dateRangeLabel}
            </span>

            <button
              type="button"
              onClick={onNextWeek}
              aria-label="Next week"
              className="h-7 px-2.5 rounded-md border border-[#cdced1] bg-white text-xs font-medium text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>

          <button
            type="button"
            onClick={onResetThisWeek}
            className="h-7 px-2.5 rounded-md border border-[#cdced1] bg-white text-[11px] font-semibold text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer ml-1"
          >
            Today
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center self-start sm:self-auto bg-[#f4f6f8] p-0.5 rounded-md border border-[#e2e8f0]">
          {isStaff ? (
            <>
              <button
                type="button"
                onClick={() => onViewModeChange('AGENDA')}
                className={`h-6 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'AGENDA'
                    ? 'bg-white text-[#131416] font-semibold shadow-2xs'
                    : 'text-[#5d5f60] hover:text-[#131416]'
                }`}
              >
                My Agenda
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('TIMELINE')}
                className={`h-6 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-white text-[#131416] font-semibold shadow-2xs'
                    : 'text-[#5d5f60] hover:text-[#131416]'
                }`}
              >
                Store Roster
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onViewModeChange('TIMELINE')}
                className={`h-6 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-white text-[#131416] font-semibold shadow-2xs'
                    : 'text-[#5d5f60] hover:text-[#131416]'
                }`}
              >
                Weekly Timeline
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('TABLE')}
                className={`h-6 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-[#131416] font-semibold shadow-2xs'
                    : 'text-[#5d5f60] hover:text-[#131416]'
                }`}
              >
                Roster Table
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
