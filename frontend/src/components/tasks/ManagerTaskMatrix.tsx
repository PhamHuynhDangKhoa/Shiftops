import React, { useState, useMemo } from 'react';
import { Task, Shift } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { formatTaskTime } from './taskUtils';
import { IconCheckList } from '../ui/Icons';

interface ManagerTaskMatrixProps {
  tasks: Task[];
  isLoading: boolean;
  shifts?: Shift[];
  selectedShiftId: string;
  onSelectShiftId: (id: string) => void;
  onCancelTask: (taskId: string) => void;
  isCancelling?: boolean;
}

export const ManagerTaskMatrix: React.FC<ManagerTaskMatrixProps> = ({
  tasks,
  isLoading,
  shifts = [],
  selectedShiftId,
  onSelectShiftId,
  onCancelTask,
  isCancelling = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchStatus && matchPriority;
    });
  }, [tasks, statusFilter, priorityFilter]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#5d5f60] bg-white border border-[#e8eaec] rounded-lg">
        Loading operational task audit matrix...
      </div>
    );
  }

  return (
    <div className="space-y-3.5" id="panel-monitoring" role="tabpanel" aria-labelledby="tab-monitoring">
      {/* Matrix Controls & Filters */}
      <div className="bg-white border border-[#e8eaec] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Shift Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="matrix-shift-filter" className="text-xs font-medium text-[#5d5f60]">
              Shift:
            </label>
            <select
              id="matrix-shift-filter"
              value={selectedShiftId}
              onChange={(e) => onSelectShiftId(e.target.value)}
              className="h-7 px-2.5 text-xs font-medium rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] cursor-pointer"
            >
              <option value="ALL">All Branch Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({new Date(s.startTime).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-medium text-[#5d5f60] mr-0.5">Status:</span>
            {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`h-6 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-[#131416] text-white border-[#131416]'
                    : 'bg-white text-[#5d5f60] border-[#cdced1] hover:bg-[#f4f6f8]'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'TODO'
                  ? 'Pending'
                  : st === 'IN_PROGRESS'
                  ? 'In Progress'
                  : st === 'COMPLETED'
                  ? 'Completed'
                  : 'Cancelled'}
              </button>
            ))}
          </div>

          {/* Priority Quick Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-medium text-[#5d5f60] mr-0.5">Priority:</span>
            {['ALL', 'HIGH', 'NORMAL', 'LOW'].map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`h-6 px-2 rounded text-xs font-medium transition-colors cursor-pointer border ${
                  priorityFilter === pr
                    ? 'bg-[#1b6c80] text-white border-[#1b6c80]'
                    : 'bg-white text-[#5d5f60] border-[#cdced1] hover:bg-[#f4f6f8]'
                }`}
              >
                {pr === 'ALL' ? 'Any' : pr}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-[#5d5f60] tabular-nums">
          Showing <span className="font-semibold text-[#131416]">{filteredTasks.length}</span> of{' '}
          {tasks.length} tasks
        </div>
      </div>

      {/* Task Matrix Table */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center border border-[#e8eaec] bg-white rounded-lg p-6">
          <div className="w-10 h-10 bg-[#f4f6f8] rounded-full flex items-center justify-center text-[#5d5f60] mx-auto mb-2.5">
            <IconCheckList size={18} />
          </div>
          <p className="text-sm font-semibold text-[#131416]">No matching operational tasks</p>
          <p className="text-xs text-[#5d5f60] mt-1">
            Generate tasks from checklist SOPs or assign ad-hoc responsibilities.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaec] text-[#5d5f60] text-xs font-normal bg-[#f9fbfc]">
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Task Title & Procedure
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Assigned Staff
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Scheduled Shift
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Priority
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Status
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal">
                  Due / Completed
                </th>
                <th scope="col" className="py-2.5 px-3.5 font-normal text-right">
                  Manager Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED';
                const isCancelled = t.status === 'CANCELLED';

                return (
                  <tr key={t.id} className="hover:bg-[#f4f6f8]/70 transition-colors duration-100">
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-semibold text-[#131416] flex items-center gap-1.5">
                        <span className={isCompleted ? 'line-through text-[#5d5f60]' : ''}>
                          {t.title}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-[#5d5f60] mt-0.5 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {t.userName ? (
                        <div>
                          <div className="font-medium text-[#131416]">{t.userName}</div>
                          <div className="text-xs text-[#5d5f60]">{t.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-[#5d5f60] italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-[#5d5f60] whitespace-nowrap">
                      {t.shiftName || '-'}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <TaskPriorityBadge priority={t.priority} />
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <TaskStatusBadge status={t.status} />
                    </td>

                    <td className="py-3 px-3.5 tabular-nums font-mono text-xs text-[#5d5f60] whitespace-nowrap">
                      {t.completedAt ? (
                        <span className="text-[#1e7b4f] font-medium">
                          Done {formatTaskTime(t.completedAt)}
                        </span>
                      ) : t.dueTime ? (
                        <span>Due {formatTaskTime(t.dueTime)}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => onCancelTask(t.id)}
                          disabled={isCancelling}
                          className="px-2 py-1 text-xs font-medium text-[#831c1e] hover:bg-[#ffedea] rounded border border-[#831c1e]/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel Task
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
