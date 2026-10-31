import React, { useMemo } from 'react';
import { User } from '../../lib/types';

export interface StaffHeaderDeckProps {
  user: User | null;
  punchStateLabel?: string;
  currentShiftName?: string;
  stationName?: string;
}

export const StaffHeaderDeck: React.FC<StaffHeaderDeckProps> = ({
  user,
  stationName,
}) => {
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const station = stationName || 'Espresso Bar 1';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      {/* Functional Station Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416]">
          {station} · Shift Workbench
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] mt-1 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#131416]">
            {user?.fullName || 'Jordan Kim'}
          </span>
          <span className="text-[#cbd5e1]">·</span>
          <span>Staff #ST-8821</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>{user?.primaryBranchName || 'Shibuya Flagship'} (Store #04)</span>
        </p>
      </div>

      {/* Date Chip */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        <div className="px-3 py-1.5 rounded-lg bg-white text-xs sm:text-sm font-medium text-[#131416] shadow-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
          <span>{todayStr}</span>
        </div>
      </div>
    </div>
  );
};
