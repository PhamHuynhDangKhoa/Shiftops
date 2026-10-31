import React from 'react';
import { Branch } from '../../lib/types';

export interface ManagerHeaderDeckProps {
  currentBranchName?: string;
  userRole?: string;
  branches?: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenBroadcast: () => void;
  isOwner: boolean;
  isManager: boolean;
}

export const ManagerHeaderDeck: React.FC<ManagerHeaderDeckProps> = ({
  currentBranchName,
  branches,
  selectedBranchId,
  onSelectBranch,
  onOpenBroadcast,
  isOwner,
  isManager,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
      {/* Title + Subline with Store Hierarchy */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-[#131416]">
            Operations Command
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#dcfce7] text-[#14532d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            Live Store Active
          </span>
        </div>
        <p className="text-xs text-[#5d5f60] mt-1 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#131416]">
            {currentBranchName || 'Shibuya Flagship'}
          </span>
          <span className="text-[#9ca3af]">·</span>
          <span>Morning Shift (08:00 – 16:30)</span>
          <span className="text-[#9ca3af]">·</span>
          <span>Lead Manager: Marcus Tanaka</span>
        </p>
      </div>

      {/* Scope Selector & Primary Action (No Card Borders) */}
      <div className="flex items-center gap-3">
        {(isOwner || isManager) && branches && branches.length > 1 && (
          <div className="flex items-center">
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white text-xs font-medium text-[#131416] focus:outline-none cursor-pointer shadow-xs"
              aria-label="Select Operating Branch"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.active && '(Inactive)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {(isOwner || isManager) && (
          <button
            type="button"
            onClick={onOpenBroadcast}
            className="h-9 px-4 rounded-xl bg-[#131416] hover:bg-[#282a2d] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
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
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            <span>Broadcast Notice</span>
          </button>
        )}
      </div>
    </div>
  );
};
