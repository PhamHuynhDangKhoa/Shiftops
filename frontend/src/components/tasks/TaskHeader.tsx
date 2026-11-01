import React from 'react';
import { Branch } from '../../lib/types';
import { IconRefresh, IconPlus, IconLayers } from '../ui/Icons';

interface TaskHeaderProps {
  isStaff: boolean;
  branches?: Branch[];
  selectedBranchId: string;
  onSelectBranchId: (id: string) => void;
  activeTab: 'MONITORING' | 'TEMPLATES';
  onChangeTab: (tab: 'MONITORING' | 'TEMPLATES') => void;
  onOpenGenerateModal: () => void;
  onOpenAdHocModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  isStaff,
  branches = [],
  selectedBranchId,
  onSelectBranchId,
  activeTab,
  onChangeTab,
  onOpenGenerateModal,
  onOpenAdHocModal,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Title + Branch Selector + Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e8eaec]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#131416]">
            {isStaff ? 'My Checklist Duties' : 'Task & Checklist Control'}
          </h1>
          <p className="text-sm text-[#5d5f60] mt-0.5">
            {isStaff
              ? 'Active shift assignments, procedure checklists, and compliance logging.'
              : 'Branch-wide operational procedures, shift task delegation, and execution audit.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Selector for Managers / Owners */}
          {!isStaff && branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#cdced1] rounded-md px-2.5 py-1">
              <label
                htmlFor="task-branch-select"
                className="text-xs font-medium text-[#5d5f60]"
              >
                Branch:
              </label>
              <select
                id="task-branch-select"
                value={selectedBranchId}
                onChange={(e) => onSelectBranchId(e.target.value)}
                className="text-xs font-semibold text-[#131416] bg-transparent focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {!b.active && '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh operational tasks"
            className="h-8 px-3 rounded-md text-xs font-medium bg-white border border-[#cdced1] text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1 disabled:opacity-60"
          >
            <IconRefresh
              size={13}
              className={isRefreshing ? 'animate-spin text-[#1b6c80]' : 'text-[#5d5f60]'}
            />
            <span>Refresh</span>
          </button>

          {/* Manager Specific Actions */}
          {!isStaff && (
            <>
              <button
                onClick={onOpenAdHocModal}
                className="h-8 px-3 rounded-md text-xs font-medium bg-white border border-[#cdced1] text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1"
              >
                <IconPlus size={13} className="text-[#5d5f60]" />
                <span>Ad-Hoc Task</span>
              </button>

              <button
                onClick={onOpenGenerateModal}
                className="h-8 px-3.5 rounded-md text-xs font-medium bg-[#1b6c80] text-white hover:bg-[#155666] transition-colors cursor-pointer flex items-center gap-1.5 shadow-none focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1"
              >
                <IconLayers size={13} className="text-white" />
                <span>Generate from SOP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Tabs for Manager / Owner */}
      {!isStaff && (
        <div
          role="tablist"
          aria-label="Task management views"
          className="flex items-center gap-2 border-b border-[#e8eaec]"
        >
          <button
            role="tab"
            id="tab-monitoring"
            aria-selected={activeTab === 'MONITORING'}
            aria-controls="panel-monitoring"
            onClick={() => onChangeTab('MONITORING')}
            className={`pb-2.5 px-3.5 text-[13px] font-medium transition-colors cursor-pointer border-b-2 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1 ${
              activeTab === 'MONITORING'
                ? 'border-[#1b6c80] text-[#1b6c80] font-semibold'
                : 'border-transparent text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            Task Monitoring Matrix
          </button>
          <button
            role="tab"
            id="tab-templates"
            aria-selected={activeTab === 'TEMPLATES'}
            aria-controls="panel-templates"
            onClick={() => onChangeTab('TEMPLATES')}
            className={`pb-2.5 px-3.5 text-[13px] font-medium transition-colors cursor-pointer border-b-2 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1 ${
              activeTab === 'TEMPLATES'
                ? 'border-[#1b6c80] text-[#1b6c80] font-semibold'
                : 'border-transparent text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            Checklist Templates (SOP)
          </button>
        </div>
      )}
    </div>
  );
};
