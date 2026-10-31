import React from 'react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus } from '../../lib/types';
import { IconCheckList, IconCheck, IconArrowUpRight } from '../ui/Icons';

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
  const completedCount = tasks ? tasks.filter((t) => t.status === 'COMPLETED').length : 0;
  const totalCount = tasks?.length || 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-base font-bold text-[#131416] flex items-center gap-2">
              <IconCheckList size={18} className="text-[#131416]" />
              <span>My Assigned Checklist & Tasks</span>
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Operational routines assigned to you for execution today
            </p>
          </div>

          <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f1f5f9] text-xs font-bold text-[#131416]">
            <span className="tabular-nums">
              {completedCount} / {totalCount}
            </span>
            <span className="text-[#64748b] font-normal">done</span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center text-xs text-[#64748b]">
            Loading your shift tasks...
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-[#f8f9fa] p-8 my-4 text-center">
            <IconCheckList size={28} className="text-[#94a3b8] mb-2.5" />
            <p className="text-sm font-bold text-[#131416]">No Checklist Assigned</p>
            <p className="text-xs text-[#64748b] mt-1 max-w-xs mx-auto leading-relaxed">
              Routine operational checklist items will populate here when the shift floor opens.
            </p>
          </div>
        ) : (
          <div className="space-y-2 my-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {tasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const isInProgress = task.status === 'IN_PROGRESS';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl transition-colors flex items-start justify-between gap-3 ${
                    isCompleted
                      ? 'bg-[#f8f9fa] opacity-75'
                      : isInProgress
                      ? 'bg-[#e0f2fe]'
                      : 'bg-[#f8f9fa] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Status Advance Button */}
                    <button
                      type="button"
                      disabled={isCompleted || isAdvancing}
                      onClick={() => {
                        const next = task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED';
                        onAdvanceTask(task.id, next);
                      }}
                      className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-[#1e7b4f] text-white'
                          : isInProgress
                          ? 'bg-[#0284c7] text-white'
                          : 'bg-[#e2e8f0] hover:bg-[#cbd5e1]'
                      }`}
                      title={`Advance: ${task.status} -> ${
                        task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED'
                      }`}
                    >
                      {isCompleted ? (
                        <IconCheck size={12} />
                      ) : isInProgress ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      ) : null}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCompleted
                              ? 'line-through text-[#94a3b8]'
                              : 'text-[#131416]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            task.priority === 'HIGH'
                              ? 'bg-[#fee2e2] text-[#991b1b]'
                              : 'bg-[#e2e8f0] text-[#475569]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-[#64748b] mt-0.5 truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight tabular-nums ${
                        isCompleted
                          ? 'bg-[#dcfce7] text-[#14532d]'
                          : isInProgress
                          ? 'bg-[#bae6fd] text-[#0369a1]'
                          : 'bg-[#e2e8f0] text-[#475569]'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 flex items-center justify-between text-xs mt-2">
        <span className="text-[#64748b] text-xs">
          Click checkbox to advance: Todo → In Progress → Done
        </span>
        <Link
          to="/tasks"
          className="text-[#1b6c80] hover:text-[#155464] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Open Full Task Board</span>
          <IconArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
};
