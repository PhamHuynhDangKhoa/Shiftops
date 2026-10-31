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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 pr-2 border-b border-[#f0f1f2]">
      {/* Title + Subline */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#131416]">
          Operations Command
        </h1>
        <p className="text-xs text-[#5d5f60] mt-1">
          <span className="font-medium text-[#131416]">
            {currentBranchName || 'Shibuya Flagship'}
          </span>{' '}
          · Morning Shift (08:00 – 16:30) · Real-time attendance, routines and incidents
        </p>
      </div>

      {/* Scope Selector & Primary Action */}
      <div className="flex items-center gap-2.5">
        {(isOwner || isManager) && branches && branches.length > 1 && (
          <div className="flex items-center">
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="h-8 px-2.5 rounded-md bg-white border border-[#cdced1] text-xs font-medium text-[#131416] focus:outline-none cursor-pointer"
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
            className="h-8 px-3.5 rounded-md bg-[#1b6c80] text-white text-xs font-medium hover:bg-[#155464] border border-[#1b6c80] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
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
