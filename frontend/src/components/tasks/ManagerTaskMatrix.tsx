import React, { useState, useMemo } from 'react';
import { Task, Shift } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { formatTaskTime } from './taskUtils';
import { IconCheckList, IconCheck, IconListTodo, IconLayers } from '../ui/Icons';

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
  const [layoutMode, setLayoutMode] = useState<'GROUPED' | 'FLAT'>('GROUPED');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchStatus && matchPriority;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Group tasks by SOP Procedure or Category
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { title: string; tasks: Task[]; completed: number }> = {};

    for (const t of filteredTasks) {
      const groupKey = t.templateItemId ? (t.shiftName || 'Standard SOP Checklist') : 'Ad-Hoc Shift Duties';
      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupKey,
          tasks: [],
          completed: 0,
        };
      }
      groups[groupKey].tasks.push(t);
      if (t.status === 'COMPLETED') {
        groups[groupKey].completed++;
      }
    }

    return Object.values(groups);
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#5d5f60] bg-white border border-[#e8eaec] rounded-lg">
        Loading operational task audit matrix...
      </div>
    );
  }

  return (
    <div className="space-y-4" id="panel-monitoring" role="tabpanel" aria-labelledby="tab-monitoring">
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
              className="h-8 px-2.5 text-xs font-medium rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] cursor-pointer"
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
                className={`h-7 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer border ${
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
                className={`h-7 px-2 rounded text-xs font-medium transition-colors cursor-pointer border ${
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

        {/* View Layout Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#f4f6f8] p-0.5 rounded-md border border-[#e8eaec]">
          <button
            onClick={() => setLayoutMode('GROUPED')}
            className={`h-7 px-2.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'GROUPED'
                ? 'bg-white text-[#131416] shadow-xs'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            <IconLayers size={13} />
            <span>Grouped SOPs</span>
          </button>
          <button
            onClick={() => setLayoutMode('FLAT')}
            className={`h-7 px-2.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              layoutMode === 'FLAT'
                ? 'bg-white text-[#131416] shadow-xs'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            <IconListTodo size={13} />
            <span>Audit Table</span>
          </button>
        </div>
      </div>

      {/* RENDER MODE 1: GROUPED BY SOP ACCORDION / SECTIONS */}
      {layoutMode === 'GROUPED' && (
        <div className="space-y-4">
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
            groupedTasks.map((group) => {
              const totalInGroup = group.tasks.length;
              const completedInGroup = group.completed;
              const percentInGroup = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;

              return (
                <div
                  key={group.title}
                  className="bg-white border border-[#e8eaec] rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="p-3.5 sm:p-4 bg-[#f9fbfc] border-b border-[#e8eaec] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <IconCheckList size={16} className="text-[#1b6c80]" />
                      <h3 className="text-sm font-bold text-[#131416]">{group.title}</h3>
                      <span className="text-xs text-[#5d5f60] font-mono tabular-nums">
                        ({completedInGroup} of {totalInGroup} completed · {percentInGroup}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-28 sm:w-36 h-1.5 bg-[#e8eaec] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1e7b4f] rounded-full transition-[width] duration-300 ease-out"
                          style={{ width: `${percentInGroup}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Items Table */}
                  <div className="divide-y divide-[#f0f1f2]">
                    {group.tasks.map((t) => {
                      const isCompleted = t.status === 'COMPLETED';
                      const isCancelled = t.status === 'CANCELLED';

                      return (
                        <div
                          key={t.id}
                          className="p-3.5 sm:p-4 hover:bg-[#f4f6f8]/70 transition-colors duration-100 flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div
                            onClick={() => setSelectedTask(t)}
                            className="min-w-0 flex-1 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <TaskStatusBadge status={t.status} />
                              <TaskPriorityBadge priority={t.priority} />
                              <span
                                className={`text-sm font-semibold group-hover:text-[#1b6c80] transition-colors ${
                                  isCompleted ? 'line-through text-[#5d5f60]' : 'text-[#131416]'
                                }`}
                              >
                                {t.title}
                              </span>
                            </div>

                            {t.description && (
                              <p className="text-xs text-[#5d5f60] mt-1 line-clamp-1 max-w-2xl">
                                {t.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-5 text-xs text-[#5d5f60] flex-shrink-0 self-end md:self-center">
                            {/* Assignee */}
                            <div className="text-right">
                              <div className="text-xs font-semibold text-[#131416]">
                                {t.userName || 'Unassigned'}
                              </div>
                              <div className="text-[11px] text-[#5d5f60]">
                                {t.userEmail ? t.userEmail.split('@')[0] : 'Open slot'}
                              </div>
                            </div>

                            {/* Timing */}
                            <div className="w-24 text-right font-mono tabular-nums text-xs">
                              {t.completedAt ? (
                                <span className="text-[#1e7b4f] font-medium flex items-center justify-end gap-1">
                                  <IconCheck size={12} />
                                  {formatTaskTime(t.completedAt)}
                                </span>
                              ) : t.dueTime ? (
                                <span>Due {formatTaskTime(t.dueTime)}</span>
                              ) : (
                                '-'
                              )}
                            </div>

                            {/* Cancel Action */}
                            <div className="w-20 text-right">
                              {!isCompleted && !isCancelled && (
                                <button
                                  onClick={() => onCancelTask(t.id)}
                                  disabled={isCancelling}
                                  className="px-2.5 py-1 text-xs font-medium text-[#831c1e] hover:bg-[#ffedea] rounded border border-[#831c1e]/20 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RENDER MODE 2: FLAT AUDIT TABLE */}
      {layoutMode === 'FLAT' && (
        <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaec] text-[#5d5f60] text-xs font-normal bg-[#f9fbfc]">
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Task Title & Procedure
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Assigned Staff
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Scheduled Shift
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Priority
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Status
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal">
                  Due / Completed
                </th>
                <th scope="col" className="py-3 px-3.5 font-normal text-right">
                  Manager Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
              {filteredTasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED';
                const isCancelled = t.status === 'CANCELLED';

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-[#f4f6f8]/70 transition-colors duration-100 cursor-pointer group"
                  >
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="font-semibold text-sm text-[#131416] group-hover:text-[#1b6c80] transition-colors">
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
                          <div className="font-medium text-sm text-[#131416]">{t.userName}</div>
                          <div className="text-xs text-[#5d5f60]">{t.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-[#5d5f60] italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-xs text-[#5d5f60] whitespace-nowrap">
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

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-3 px-3.5 text-right whitespace-nowrap"
                    >
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => onCancelTask(t.id)}
                          disabled={isCancelling}
                          className="px-2.5 py-1 text-xs font-medium text-[#831c1e] hover:bg-[#ffedea] rounded border border-[#831c1e]/20 transition-colors cursor-pointer disabled:opacity-50"
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

      {/* Slide-Over Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onCancelTask={onCancelTask}
        isManager={true}
      />
    </div>
  );
};
