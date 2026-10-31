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
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      {/* Header & Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131416]">
            Store Routine Tasks
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            {completedCount} of {totalCount} shift routines completed ({pct}%)
          </p>
        </div>
        <Link
          to="/tasks"
          className="text-xs text-[#131416] hover:underline font-semibold transition-colors"
        >
          Manage tasks →
        </Link>
      </div>

      {/* Clean Tone Progress Bar: Solid Black Bar */}
      <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#131416] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Task List (Zero Card Borders) */}
      <div className="space-y-1.5 pt-1">
        {displayTasks.map((t) => {
          const isDone = t.status === 'COMPLETED';
          return (
            <div
              key={t.id}
              className="p-3 rounded-xl hover:bg-[#f8f9fa] transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(t)}
                  aria-label={isDone ? 'Mark task pending' : 'Mark task completed'}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isDone
                      ? 'bg-[#1e7b4f] text-white'
                      : 'bg-[#f1f5f9] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {isDone && (
                    <svg
                      className="w-3.5 h-3.5"
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
                    className={`block leading-snug font-medium ${
                      isDone
                        ? 'line-through text-[#94a3b8]'
                        : 'text-[#131416]'
                    }`}
                  >
                    {t.title}
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    Assigned: {t.assignedStaff}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    t.priority === 'HIGH'
                      ? 'bg-[#fee2e2] text-[#991b1b]'
                      : 'bg-[#f1f5f9] text-[#475569]'
                  }`}
                >
                  {t.priority}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    isDone
                      ? 'bg-[#dcfce7] text-[#14532d]'
                      : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
