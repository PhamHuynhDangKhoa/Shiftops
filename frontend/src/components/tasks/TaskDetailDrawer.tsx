import React, { useEffect } from 'react';
import { Task } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { formatTaskTime } from './taskUtils';
import {
  IconClose,
  IconClock,
  IconMapPin,
  IconCheck,
} from '../ui/Icons';

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onCancelTask?: (taskId: string) => void;
  isManager?: boolean;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  onClose,
  onCancelTask,
  isManager = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const isCompleted = task.status === 'COMPLETED';
  const isCancelled = task.status === 'CANCELLED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-task-title"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/35 transition-opacity duration-200"
      />

      {/* Drawer Panel (GPU accelerated translateX) */}
      <div className="relative w-full max-w-md bg-white h-full flex flex-col z-10 border-l border-[#cdced1] transition-transform duration-200 ease-out">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8eaec] flex items-start justify-between gap-3 bg-[#f9fbfc]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
              {task.templateItemId && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#f0f1f2] text-[#5d5f60] font-medium">
                  SOP Procedure
                </span>
              )}
            </div>
            <h2
              id="drawer-task-title"
              className="text-base font-bold text-[#131416] tracking-tight leading-snug"
            >
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close task details"
            className="p-1.5 rounded-md text-[#5d5f60] hover:text-[#131416] hover:bg-[#ebedee] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1b6c80]"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs text-[#131416]">
          {/* Procedure Description */}
          {task.description && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#5d5f60]">
                Operating instructions
              </div>
              <div className="p-3 bg-[#f9fbfc] border border-[#e8eaec] rounded-lg text-sm text-[#131416] leading-relaxed">
                {task.description}
              </div>
            </div>
          )}

          {/* Operational Scope */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#5d5f60]">
              Shift context
            </div>
            <div className="bg-white border border-[#e8eaec] rounded-lg divide-y divide-[#f0f1f2]">
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs text-[#5d5f60] flex items-center gap-1.5">
                  <IconMapPin size={13} className="text-[#898b8d]" />
                  Branch Location
                </span>
                <span className="text-xs font-medium text-[#131416]">
                  {task.branchName || 'Primary Branch'}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-xs text-[#5d5f60] flex items-center gap-1.5">
                  <IconClock size={13} className="text-[#898b8d]" />
                  Scheduled Shift
                </span>
                <span className="text-xs font-medium text-[#131416]">
                  {task.shiftName || 'Standard Shift'}
                </span>
              </div>

              {task.dueTime && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs text-[#5d5f60] flex items-center gap-1.5">
                    <IconClock size={13} className="text-[#898b8d]" />
                    Target Due Time
                  </span>
                  <span className="text-xs font-mono font-medium text-[#131416] tabular-nums">
                    {formatTaskTime(task.dueTime)} JST
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Personnel */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#5d5f60]">
              Assigned personnel
            </div>
            <div className="p-3.5 bg-white border border-[#e8eaec] rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e9f4f7] border border-[#1b6c80]/20 text-[#1b6c80] flex items-center justify-center font-bold text-xs">
                {task.userName ? task.userName.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#131416] truncate">
                  {task.userName || 'Unassigned Staff'}
                </div>
                <div className="text-xs text-[#5d5f60] truncate">
                  {task.userEmail || 'Awaiting assignment'}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Audit Log */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#5d5f60]">
              Audit and verification
            </div>
            <div className="p-3 bg-[#f9fbfc] border border-[#e8eaec] rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5d5f60]">Created Timestamp:</span>
                <span className="font-mono tabular-nums text-[#131416]">
                  {formatTaskTime(task.createdAt)} JST
                </span>
              </div>

              {task.completedAt ? (
                <div className="flex items-center justify-between pt-1 border-t border-[#f0f1f2]">
                  <span className="text-[#1e7b4f] font-medium flex items-center gap-1">
                    <IconCheck size={13} />
                    Verified Completion:
                  </span>
                  <span className="font-mono tabular-nums text-[#1e7b4f] font-semibold">
                    {formatTaskTime(task.completedAt)} JST
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-[#f0f1f2]">
                  <span className="text-[#5d5f60]">Status:</span>
                  <span className="text-[#b25e02] font-medium">Pending operational verification</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#e8eaec] bg-[#f9fbfc] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md text-xs font-medium bg-white border border-[#cdced1] text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
          >
            Close Details
          </button>

          {isManager && !isCompleted && !isCancelled && onCancelTask && (
            <button
              onClick={() => {
                onCancelTask(task.id);
                onClose();
              }}
              className="h-9 px-4 rounded-md text-xs font-medium text-[#831c1e] hover:bg-[#ffedea] border border-[#831c1e]/20 transition-colors cursor-pointer"
            >
              Cancel This Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
