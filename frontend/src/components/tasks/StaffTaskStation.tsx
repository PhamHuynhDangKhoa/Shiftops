import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { formatTaskTime } from './taskUtils';
import { IconCheck, IconClock, IconMapPin, IconCheckCircle2 } from '../ui/Icons';

interface StaffTaskStationProps {
  tasks: Task[];
  isLoading: boolean;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  isUpdating: boolean;
}

export const StaffTaskStation: React.FC<StaffTaskStationProps> = ({
  tasks,
  isLoading,
  onUpdateStatus,
  isUpdating,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredTasks = useMemo(() => {
    if (filter === 'ALL') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'COMPLETED').length,
    [tasks]
  );
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#5d5f60] bg-white border border-[#e8eaec] rounded-lg">
        Synchronizing shift checklist tasks...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift Progress Card */}
      <div className="bg-white border border-[#e8eaec] rounded-lg p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5d5f60] font-medium">Shift Duty Completion</span>
          <span className="font-mono text-xs font-semibold text-[#131416] tabular-nums">
            {completedCount} of {tasks.length} duties finished ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#f0f1f2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1e7b4f] rounded-full transition-[width] duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: `All (${tasks.length})` },
          { key: 'TODO', label: `Pending (${tasks.filter((t) => t.status === 'TODO').length})` },
          { key: 'IN_PROGRESS', label: `In Progress (${tasks.filter((t) => t.status === 'IN_PROGRESS').length})` },
          { key: 'COMPLETED', label: `Completed (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`h-7 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer border focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1 ${
              filter === tab.key
                ? 'bg-[#131416] text-white border-[#131416]'
                : 'bg-white text-[#5d5f60] border-[#cdced1] hover:bg-[#f4f6f8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center border border-[#e8eaec] bg-white rounded-lg p-6">
          <div className="w-10 h-10 bg-[#f4f6f8] rounded-full flex items-center justify-center text-[#5d5f60] mx-auto mb-2">
            <IconCheck size={18} />
          </div>
          <p className="text-sm font-semibold text-[#131416]">No tasks in this category</p>
          <p className="text-xs text-[#5d5f60] mt-1">
            {filter === 'ALL'
              ? 'No active checklist duties assigned to your shift.'
              : 'All duties in this section have been resolved or filtered.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const isDone = t.status === 'COMPLETED';
            const isHigh = t.priority === 'HIGH' && !isDone;

            return (
              <div
                key={t.id}
                className={`bg-white border rounded-lg p-4 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-[#e8eaec] bg-[#f9fbfc] opacity-80'
                    : isHigh
                    ? 'border-[#e8eaec] border-l-4 border-l-[#831c1e]'
                    : 'border-[#e8eaec] hover:border-[#cdced1]'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TaskStatusBadge status={t.status} />
                    <TaskPriorityBadge priority={t.priority} />
                    <span
                      className={`text-sm font-semibold ${
                        isDone ? 'line-through text-[#5d5f60]' : 'text-[#131416]'
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-[#5d5f60] leading-relaxed max-w-2xl">
                      {t.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3.5 text-xs text-[#5d5f60] flex-wrap pt-0.5">
                    {t.branchName && (
                      <span className="flex items-center gap-1">
                        <IconMapPin size={12} className="text-[#5d5f60]" />
                        {t.branchName}
                      </span>
                    )}
                    {t.shiftName && (
                      <span className="flex items-center gap-1">
                        <IconClock size={12} className="text-[#5d5f60]" />
                        {t.shiftName}
                      </span>
                    )}
                    {t.dueTime && (
                      <span className="flex items-center gap-1 tabular-nums font-mono text-xs">
                        Due by {formatTaskTime(t.dueTime)}
                      </span>
                    )}
                    {t.completedAt && (
                      <span className="text-[#1e7b4f] font-medium flex items-center gap-1 tabular-nums font-mono text-xs">
                        <IconCheck size={12} />
                        Completed at {formatTaskTime(t.completedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* State-aware Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {isDone ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 text-xs font-semibold">
                      <IconCheck size={13} className="text-[#1e7b4f]" />
                      <span>Verified Complete</span>
                    </div>
                  ) : t.status === 'TODO' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateStatus(t.id, 'IN_PROGRESS')}
                        disabled={isUpdating}
                        className="h-8 px-3 rounded-md text-xs font-medium bg-white border border-[#cdced1] text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1 disabled:opacity-60"
                      >
                        <IconCheckCircle2 size={12} className="text-[#b25e02]" />
                        <span>Start</span>
                      </button>
                      <button
                        onClick={() => onUpdateStatus(t.id, 'COMPLETED')}
                        disabled={isUpdating}
                        className="h-8 px-3 rounded-md text-xs font-medium bg-[#1e7b4f] text-white hover:bg-[#18633f] transition-colors cursor-pointer flex items-center gap-1 shadow-none focus-visible:ring-2 focus-visible:ring-[#1e7b4f] focus-visible:ring-offset-1 disabled:opacity-60"
                      >
                        <IconCheck size={13} />
                        <span>Done</span>
                      </button>
                    </div>
                  ) : (
                    /* IN_PROGRESS */
                    <button
                      onClick={() => onUpdateStatus(t.id, 'COMPLETED')}
                      disabled={isUpdating}
                      className="h-8 px-3.5 rounded-md text-xs font-medium bg-[#1e7b4f] text-white hover:bg-[#18633f] transition-colors cursor-pointer flex items-center gap-1.5 shadow-none focus-visible:ring-2 focus-visible:ring-[#1e7b4f] focus-visible:ring-offset-1 disabled:opacity-60"
                    >
                      <IconCheck size={14} />
                      <span>Mark Complete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
