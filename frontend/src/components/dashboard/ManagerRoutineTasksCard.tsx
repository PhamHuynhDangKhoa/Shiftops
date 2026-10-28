import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus } from '../../lib/types';

export interface ManagerRoutineTasksCardProps {
  branchTasks?: Task[];
  onAdvanceTask?: (taskId: string, nextStatus: TaskStatus) => void;
}

interface RoutineTaskDisplayItem {
  id: string;
  title: string;
  assignedStaff: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: TaskStatus;
}

const DEFAULT_ROUTINE_TASKS: RoutineTaskDisplayItem[] = [
  {
    id: 'task-1',
    title: 'Verify morning register float & safe drop reconciliation',
    assignedStaff: 'Marcus Tanaka',
    priority: 'HIGH',
    status: 'COMPLETED',
  },
  {
    id: 'task-2',
    title: 'Calibrate espresso grinder 1 & 2 pressure / extraction yield',
    assignedStaff: 'Aoi Mori',
    priority: 'NORMAL',
    status: 'COMPLETED',
  },
  {
    id: 'task-3',
    title: 'Log food refrigeration & walk-in chiller temperature sensors',
    assignedStaff: 'Daiki Takahashi',
    priority: 'HIGH',
    status: 'COMPLETED',
  },
  {
    id: 'task-4',
    title: 'Restock front pastry display cases and bakery prep counters',
    assignedStaff: 'Hana Endo',
    priority: 'NORMAL',
    status: 'COMPLETED',
  },
  {
    id: 'task-5',
    title: 'Sanitize syrup pump wells and ice maker dispensing chutes',
    assignedStaff: 'Ren Ito',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
  },
  {
    id: 'task-6',
    title: 'Conduct mid-day inventory cycle count for milk and oat cartons',
    assignedStaff: 'Yuka Suzuki',
    priority: 'LOW',
    status: 'TODO',
  },
];

export const ManagerRoutineTasksCard: React.FC<ManagerRoutineTasksCardProps> = ({
  branchTasks,
  onAdvanceTask,
}) => {
  const [localTasks, setLocalTasks] = useState<RoutineTaskDisplayItem[]>(
    DEFAULT_ROUTINE_TASKS
  );

  const displayTasks: RoutineTaskDisplayItem[] = useMemo(() => {
    if (branchTasks && branchTasks.length > 0) {
      return branchTasks.slice(0, 6).map((t) => ({
        id: t.id,
        title: t.title,
        assignedStaff: t.userName || 'Unassigned',
        priority: t.priority,
        status: t.status,
      }));
    }
    return localTasks;
  }, [branchTasks, localTasks]);

  const completedCount = displayTasks.filter(
    (t) => t.status === 'COMPLETED'
  ).length;
  const totalCount = displayTasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (task: RoutineTaskDisplayItem) => {
    const nextStatus: TaskStatus =
      task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    if (onAdvanceTask) {
      onAdvanceTask(task.id, nextStatus);
    }

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
  };

  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5">
      {/* Header & Progress */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-base font-semibold text-[#131416]">
            Store Routine Tasks
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            {completedCount} of {totalCount} shift routines completed ({pct}%)
          </p>
        </div>
        <Link
          to="/tasks"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium transition-colors"
        >
          Manage tasks →
        </Link>
      </div>

      {/* 4px Progress Track */}
      <div className="w-full h-1 bg-[#f0f1f2] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#1b6c80] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Task List */}
      <div className="divide-y divide-[#f0f1f2]">
        {displayTasks.map((t) => {
          const isDone = t.status === 'COMPLETED';
          return (
            <div
              key={t.id}
              className="py-2.5 flex items-center justify-between gap-3 text-[13px]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(t)}
                  aria-label={isDone ? 'Mark task pending' : 'Mark task completed'}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isDone
                      ? 'bg-[#1e7b4f] border-[#1e7b4f] text-white'
                      : 'border-[#cdced1] bg-white hover:border-[#131416]'
                  }`}
                >
                  {isDone && (
                    <svg
                      className="w-3 h-3"
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
                  )}
                </button>

                <div className="min-w-0">
                  <span
                    className={`block truncate ${
                      isDone
                        ? 'line-through text-[#5d5f60]'
                        : 'font-medium text-[#131416] text-sm'
                    }`}
                  >
                    {t.title}
                  </span>
                  <span className="text-xs text-[#5d5f60]">
                    Assigned: {t.assignedStaff}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {t.priority === 'HIGH' && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#fffbeb] text-[#92400e]">
                    High
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium tabular-nums ${
                    isDone
                      ? 'bg-[#dcfae5] text-[#04250e]'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-[#e9f4f7] text-[#1b6c80]'
                      : 'bg-[#ebedee] text-[#353736]'
                  }`}
                >
                  {isDone ? 'Done' : t.status === 'IN_PROGRESS' ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
