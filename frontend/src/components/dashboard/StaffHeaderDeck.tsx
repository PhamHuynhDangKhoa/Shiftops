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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#f0f1f2]">
      {/* Title + Staff Identity */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416]">
          Staff Operations Hub
        </h1>
        <p className="text-xs text-[#5d5f60] mt-1 flex items-center gap-2">
          <span className="font-medium text-[#131416]">
            {user?.fullName || 'Shift Associate'}
          </span>
          <span>·</span>
          <span>{user?.primaryBranchName || 'Shibuya Flagship'}</span>
          <span>·</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f4f6f8] text-[#131416] border border-[#cdced1]">
            {user?.role}
          </span>
        </p>
      </div>

      {/* Shift & Status Pill */}
      <div className="flex items-center gap-2.5">
        <div className="px-3 py-1.5 rounded-md bg-white border border-[#cdced1] text-xs">
          <span className="text-[#5d5f60] block text-[10px]">Active Shift</span>
          <span className="font-semibold text-[#131416]">
            {currentShiftName || 'Scheduled Floor Shift'}
          </span>
        </div>
        <div className="px-3 py-2 rounded-md bg-[#ebedee] text-xs font-semibold text-[#131416]">
          {punchStateLabel}
        </div>
      </div>
    </div>
  );
};
