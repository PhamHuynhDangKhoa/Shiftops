import React from 'react';
import { Branch } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconCalendar, IconPlus } from '../ui/Icons';

interface ShiftFilterBarProps {
  isStaff: boolean;
  isOwner: boolean;
  branches?: Branch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onCreateClick: () => void;
}

export const ShiftFilterBar: React.FC<ShiftFilterBarProps> = ({
  isStaff,
  isOwner,
  branches,
  selectedBranchId,
  onBranchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onCreateClick,
}) => {
  return (
    <div className="space-y-4">
      {/* Title & Top Level Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#262c38]">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
            <IconCalendar size={20} className="text-[#00f0ff]" />
            <span>{isStaff ? 'PERSONAL SHIFT ROSTER' : 'OPERATIONAL SHIFT SCHEDULING'}</span>
          </h1>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            {isStaff
              ? 'View upcoming published rosters and scheduled operational windows'
              : 'Author, assign operators, and publish sector shift rosters'}
          </p>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {isOwner && branches && branches.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => onBranchChange(e.target.value)}
                  className="px-3.5 py-2 text-xs font-mono font-bold rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} disabled={!b.active}>
                      {b.name} {!b.active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="amber"
              size="md"
              onClick={onCreateClick}
              className="gap-2 shadow-[0_0_12px_rgba(255,107,0,0.25)]"
            >
              <IconPlus size={14} />
              <span>[ CREATE SHIFT ]</span>
            </Button>
          </div>
        )}
      </div>

      {/* Date Window Toolbar */}
      <div className="bg-[#11141a] border border-[#262c38] p-3.5 flex flex-wrap items-center justify-between gap-3 clip-chamfer-btn">
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#606c80] uppercase">WINDOW START:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#606c80] uppercase">WINDOW END:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
            />
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#606c80]">
          DISPATCH_WINDOW: 7_DAYS_HORIZON
        </span>
      </div>
    </div>
  );
};
