import React from 'react';
import { User } from '../../lib/types';
import { Badge } from '../ui/Badge';

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
  const employeeId = user?.id
    ? (user.id.includes('-') ? `EMP-${user.id.split('-').pop()}` : user.id.slice(-6)).toUpperCase()
    : 'EMP-01';

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'ST';

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Physical Access Badge Slotted into Reader Dock */}
        <div className="relative shrink-0 select-none">
          <div className="w-13 h-16 sm:w-14 sm:h-17 rounded-lg bg-[#f4f6f8] border border-[#cdced1] p-1.5 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
              <span className="text-[10px] font-bold text-[#5d5f60] uppercase tracking-wider font-mono">
                RFID
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-[#131416] text-white flex items-center justify-center font-bold text-xs select-none">
              {initials}
            </div>
            {/* Barcode representation */}
            <div className="w-full flex items-center justify-center gap-0.5 px-0.5">
              <span className="w-0.5 h-2 bg-[#131416]" />
              <span className="w-1 h-2 bg-[#cdced1]" />
              <span className="w-0.5 h-2 bg-[#131416]" />
              <span className="w-1.5 h-2 bg-[#131416]" />
              <span className="w-0.5 h-2 bg-[#cdced1]" />
            </div>
          </div>
        </div>

        {/* Badge Reader Terminal Readout */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#131416]">
              {user?.fullName || 'Shift Associate'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f4f6f8] text-[#131416] border border-[#cdced1] font-mono tabular-nums">
              ID #{employeeId}
            </span>
            <Badge variant="brand" size="sm" showDot>
              {punchStateLabel}
            </Badge>
          </div>
          <p className="text-xs text-[#5d5f60] flex items-center gap-2 flex-wrap">
            <span>{user?.primaryBranchName || 'Shibuya Flagship'}</span>
            <span>·</span>
            <span>Station Terminal #01</span>
            <span>·</span>
            <span className="text-[#727477]">RFID Reader Active</span>
          </p>
        </div>
      </div>

      {/* Quick Schedule Telemetry */}
      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
        <div className="px-3.5 py-2 rounded-lg bg-[#ffffff] border border-[#e8eaec] text-left">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Today&apos;s Assignment
          </span>
          <span className="text-sm font-semibold text-[#131416]">
            {currentShiftName || 'Roster Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
