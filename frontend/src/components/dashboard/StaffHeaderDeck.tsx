import React from 'react';
import { User } from '../../lib/types';

export interface StaffHeaderDeckProps {
  user: User | null;
  punchStateLabel: string;
  currentShiftName?: string;
}

export const StaffHeaderDeck: React.FC<StaffHeaderDeckProps> = ({
  user,
  punchStateLabel,
  currentShiftName,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      {/* Title + Staff Identity */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#131416]">
          Staff Operations Hub
        </h1>
        <p className="text-xs text-[#5d5f60] mt-1 flex items-center gap-2">
          <span className="font-semibold text-[#131416]">
            {user?.fullName || 'Shift Associate'}
          </span>
          <span className="text-[#9ca3af]">·</span>
          <span>{user?.primaryBranchName || 'Shibuya Flagship'}</span>
          <span className="text-[#9ca3af]">·</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e2e8f0] text-[#334155]">
            {user?.role}
          </span>
        </p>
      </div>

      {/* Shift & Status Pill (No Card Borders) */}
      <div className="flex items-center gap-3">
        <div className="px-3.5 py-2 rounded-xl bg-white shadow-xs text-xs">
          <span className="text-[#64748b] block text-[10px]">Active Shift</span>
          <span className="font-semibold text-[#131416]">
            {currentShiftName || 'Scheduled Floor Shift'}
          </span>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-[#e2e8f0] text-xs font-semibold text-[#131416]">
          {punchStateLabel}
        </div>
      </div>
    </div>
  );
};
