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
    <div className="p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] h-full flex flex-col justify-between relative">
      {/* Clipboard Clamp Anchor */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-2.5 rounded-b bg-[#cdced1] border border-[#cdced1] flex items-center justify-center">
        <div className="w-8 h-0.5 rounded-full bg-[#727477]" />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f1f2]">
          <div>
            <h2 className="text-sm font-bold text-[#131416] flex items-center gap-2">
              <IconCheckList size={17} className="text-[#131416]" />
              <span>My Assigned Checklist & Tasks</span>
            </h2>
            <p className="text-xs text-[#5d5f60] mt-0.5">
              Operational routines assigned to you for execution today
            </p>
          </div>

          <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f4f6f8] text-xs font-semibold text-[#131416] border border-[#e8eaec]">
            <span className="tabular-nums">
              {completedCount} / {totalCount}
            </span>
            <span className="text-[#5d5f60] font-normal">done</span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center text-xs text-[#5d5f60]">
            Loading your shift tasks...
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-[#e8eaec] bg-[#f9fbfc] p-6 my-4 text-center">
            <IconCheckList size={28} className="text-[#727477] mb-2.5" />
            <p className="text-sm font-semibold text-[#131416]">No Checklist Assigned</p>
            <p className="text-xs text-[#5d5f60] mt-1 max-w-xs mx-auto leading-relaxed">
              Routine operational checklist items will populate here when the shift floor opens.
            </p>
          </div>
        ) : (
          <div className="space-y-2 my-4 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {tasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const isInProgress = task.status === 'IN_PROGRESS';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                    isCompleted
                      ? 'bg-[#f4f6f8] border-[#e8eaec] opacity-75'
                      : isInProgress
                      ? 'bg-white border-[#1b6c80]'
                      : 'bg-white border-[#e8eaec] hover:border-[#cdced1]'
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
                          ? 'border-2 border-[#1b6c80] bg-[#e9f4f7] text-[#1b6c80]'
                          : 'border-2 border-[#cdced1] hover:border-[#131416] bg-white'
                      }`}
                      title={`Advance: ${task.status} -> ${
                        task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED'
                      }`}
                    >
                      {isCompleted ? (
                        <IconCheck size={12} />
                      ) : isInProgress ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1b6c80]" />
                      ) : null}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCompleted
                              ? 'line-through text-[#727477]'
                              : 'text-[#131416]'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            task.priority === 'HIGH'
                              ? 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20'
                              : 'bg-[#ebedee] text-[#5d5f60]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-[#5d5f60] mt-0.5 truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight tabular-nums ${
                        isCompleted
                          ? 'bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20'
                          : isInProgress
                          ? 'bg-[#e9f4f7] text-[#1b6c80] border border-[#1b6c80]/20'
                          : 'bg-[#ebedee] text-[#5d5f60] border border-[#cdced1]'
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

      <div className="pt-3 border-t border-[#f0f1f2] flex items-center justify-between text-xs mt-4">
        <span className="text-[#5d5f60] text-xs">
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
