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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
            {isStaff ? 'My Assigned Shifts' : 'Shift Scheduling'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isStaff
              ? 'View your upcoming published rosters and scheduled hours'
              : 'Create, assign personnel, and publish operational shift rosters'}
          </p>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {isOwner && branches && branches.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => onBranchChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
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
              variant="primary"
              size="sm"
              onClick={onCreateClick}
              className="gap-1.5"
            >
              <IconPlus size={14} />
              <span>Create Shift</span>
            </Button>
          </div>
        )}
      </div>

      {/* Date Window Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-medium text-zinc-500 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
            <IconCalendar size={13} className="text-zinc-400" />
            Window
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px] font-mono">FROM</span>
            <input
              type="date"
              value={startDate.slice(0, 10)}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px] font-mono">TO</span>
            <input
              type="date"
              value={endDate.slice(0, 10)}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        <div className="font-mono text-[11px] text-zinc-400">
          Range: {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
