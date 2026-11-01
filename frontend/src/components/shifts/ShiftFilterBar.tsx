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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <IconCalendar size={22} className="text-zinc-700" />
            <span>{isStaff ? 'My Shift Schedule' : 'Shift Management & Scheduling'}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isStaff
              ? 'View your upcoming published shifts and assigned hours.'
              : 'Create shifts, assign staff members, and publish weekly schedules.'}
          </p>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {isOwner && branches && branches.length > 0 && (
              <select
                value={selectedBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={!b.active}>
                    {b.name} {!b.active ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={onCreateClick}
              className="gap-2 shadow-xs"
            >
              <IconPlus size={15} />
              <span>Create Shift</span>
            </Button>
          </div>
        )}
      </div>

      {/* Date Window Toolbar */}
      <div className="bg-white border border-[#e8eaec] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#5d5f60]">
              From:
            </span>
            <input
              type="date"
              value={startDate.slice(0, 10)}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#5d5f60]">
              To:
            </span>
            <input
              type="date"
              value={endDate.slice(0, 10)}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - d.getDay());
              d.setHours(0, 0, 0, 0);
              onStartDateChange(d.toISOString().slice(0, 10));
              const end = new Date(d);
              end.setDate(end.getDate() + 7);
              onEndDateChange(end.toISOString().slice(0, 10));
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - d.getDay());
              d.setHours(0, 0, 0, 0);
              onStartDateChange(d.toISOString().slice(0, 10));
              const end = new Date(d);
              end.setDate(end.getDate() + 14);
              onEndDateChange(end.toISOString().slice(0, 10));
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          >
            2 Weeks
          </button>
        </div>
      </div>
    </div>
  );
};
