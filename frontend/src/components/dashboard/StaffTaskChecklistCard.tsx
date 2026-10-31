import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus } from '../../lib/types';
import { IconCheckList, IconArrowUpRight } from '../ui/Icons';

export interface StaffTaskChecklistCardProps {
  tasks?: Task[];
  isLoading: boolean;
  onAdvanceTask: (taskId: string, nextStatus: TaskStatus) => void;
  isAdvancing: boolean;
}

export const StaffTaskChecklistCard: React.FC<StaffTaskChecklistCardProps> = ({
  tasks,
  isLoading,
  onAdvanceTask,
  isAdvancing,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');

  const allTasks = tasks || [];
  const completedCount = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = allTasks.length;
  const remainingCount = totalCount - completedCount;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (filter === 'TODO') return allTasks.filter((t) => t.status !== 'COMPLETED');
    if (filter === 'DONE') return allTasks.filter((t) => t.status === 'COMPLETED');
    return allTasks;
  }, [allTasks, filter]);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header: Title + Progress Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCheckList size={18} className="text-[#131416]" />
          <h2 className="text-base font-bold text-[#131416]">
            Shift Duty Checklist
          </h2>
        </div>

        <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] text-xs sm:text-sm font-semibold text-[#131416]">
          <span className="tabular-nums">
            {completedCount} of {totalCount}
          </span>
          <span className="text-[#475569] font-normal">done ({pct}%)</span>
        </div>
      </div>

      {/* Progress Bar: Solid Black Bar */}
      <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#131416] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#131416] text-white font-semibold'
              : 'text-[#475569] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          All Routines ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('TODO')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            filter === 'TODO'
              ? 'bg-[#131416] text-white font-semibold'
              : 'text-[#475569] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          Pending ({remainingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('DONE')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            filter === 'DONE'
              ? 'bg-[#131416] text-white font-semibold'
              : 'text-[#475569] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Task List: Clean, high-contrast rows without badge inflation */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-[#475569]">
          Loading shift tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-[#f8f9fa] p-8 text-center">
          <p className="text-sm font-semibold text-[#131416]">
            {filter === 'DONE' ? 'No completed tasks yet' : 'All caught up'}
          </p>
          <p className="text-xs sm:text-sm text-[#475569] mt-1">
            {filter === 'DONE'
              ? 'Check off tasks as you finish routines.'
              : 'No pending routines for this station.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isInProgress = task.status === 'IN_PROGRESS';
            const isHighPriority = task.priority === 'HIGH';

            return (
              <div
                key={task.id}
                onClick={() => {
                  if (isAdvancing) return;
                  const next =
                    task.status === 'TODO'
                      ? 'IN_PROGRESS'
                      : task.status === 'IN_PROGRESS'
                      ? 'COMPLETED'
                      : 'TODO';
                  onAdvanceTask(task.id, next);
                }}
                className={`p-3 sm:p-3.5 rounded-lg transition-all flex items-start gap-3 cursor-pointer select-none active:scale-[0.99] ${
                  isCompleted
                    ? 'bg-[#f8f9fa]'
                    : isInProgress
                    ? 'bg-[#f1f5f9]'
                    : 'bg-[#f8f9fa] hover:bg-[#f1f5f9]'
                }`}
              >
                {/* 20x20px Crisp Checkbox */}
                <div className="pt-0.5 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-[#16a34a] text-white shadow-xs'
                        : isInProgress
                        ? 'bg-[#131416] text-white shadow-xs'
                        : 'border border-[#cbd5e1] bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : isInProgress ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : null}
                  </div>
                </div>

                {/* Task Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold leading-snug ${
                        isCompleted
                          ? 'line-through text-[#64748b]'
                          : 'text-[#131416]'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Only show priority badge if HIGH; no useless NORMAL badge */}
                    {isHighPriority && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#fee2e2] text-[#991b1b] shrink-0">
                        High Priority
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Clean status mark (no redundant "Click to advance" prompt) */}
                  {(isInProgress || isCompleted) && (
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold tracking-tight ${
                          isCompleted
                            ? 'bg-[#dcfce7] text-[#14532d]'
                            : 'bg-[#131416] text-white'
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 flex items-center justify-between text-xs sm:text-sm">
        <span className="text-[#475569]">
          Tap task to cycle state (Pending → In Progress → Done)
        </span>
        <Link
          to="/tasks"
          className="text-[#131416] hover:underline font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Open Full Task Board</span>
          <IconArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
};
