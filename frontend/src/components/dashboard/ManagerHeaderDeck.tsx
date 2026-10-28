import React from 'react';
import { Branch } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconBuilding, IconMegaphone } from '../ui/Icons';

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
  userRole,
  branches,
  selectedBranchId,
  onSelectBranch,
  onOpenBroadcast,
  isOwner,
  isManager,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#131416] text-white flex items-center justify-center font-bold text-base select-none shrink-0">
          {isManager ? 'MG' : 'HQ'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#131416]">
              Operations Command · {currentBranchName || 'Fleet'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f4f6f8] text-[#131416] border border-[#cdced1]">
              {userRole}
            </span>
          </div>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            Floor attendance tracking, shift routines execution, and incident escalations.
          </p>
        </div>
      </div>

      {/* Manager Branch Selector & Quick Actions */}
      <div className="flex items-center gap-2.5">
        {(isOwner || isManager) && branches && branches.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f4f6f8] border border-[#cdced1] text-xs font-medium">
            <IconBuilding size={14} className="text-[#5d5f60]" />
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-[#131416] font-semibold focus:outline-none cursor-pointer"
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
          <Button
            variant="dark"
            size="sm"
            onClick={onOpenBroadcast}
            className="gap-1.5"
          >
            <IconMegaphone size={14} />
            <span>Broadcast Notice</span>
          </Button>
        )}
      </div>
    </div>
  );
};
