import React from 'react';
import { Task } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { Button } from '../ui/Button';
import { IconCheckList } from '../ui/Icons';

interface ManagerTaskTableProps {
  tasks?: Task[];
  isLoading: boolean;
  onCancelTask: (taskId: string) => void;
}

export const ManagerTaskTable: React.FC<ManagerTaskTableProps> = ({
  tasks = [],
  isLoading,
  onCancelTask,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
        Loading tasks...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center border border-zinc-200/80 bg-white rounded-xl shadow-xs">
        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2.5">
          <IconCheckList size={18} />
        </div>
        <p className="text-sm font-semibold text-zinc-800">No operational tasks found</p>
        <p className="text-xs text-zinc-500 mt-1">
          Generate tasks from checklists or assign ad-hoc tasks to on-duty personnel.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#e8eaec] text-[#5d5f60] text-xs font-normal">
            <th className="py-2.5 px-3.5 font-normal">Task details</th>
            <th className="py-2.5 px-3.5 font-normal">Assigned staff</th>
            <th className="py-2.5 px-3.5 font-normal">Shift</th>
            <th className="py-2.5 px-3.5 font-normal">Priority</th>
            <th className="py-2.5 px-3.5 font-normal">Status</th>
            <th className="py-2.5 px-3.5 font-normal">Completed at</th>
            <th className="py-2.5 px-3.5 font-normal text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
              <td className="py-3.5 px-4">
                <div className="font-semibold text-zinc-900">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-zinc-500 mt-0.5 max-w-sm truncate">{t.description}</div>
                )}
              </td>
              <td className="py-3.5 px-4">
                {t.userName ? (
                  <span className="font-medium text-zinc-900">{t.userName}</span>
                ) : (
                  <span className="text-zinc-400 italic">Unassigned</span>
                )}
              </td>
              <td className="py-3 px-3.5 text-[#5d5f60] text-xs">
                {t.shiftName || '-'}
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <TaskPriorityBadge priority={t.priority} />
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <TaskStatusBadge status={t.status} />
              </td>
              <td className="py-3 px-3.5 tabular-nums text-[#5d5f60] text-xs whitespace-nowrap">
                {t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </td>
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelTask(t.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:border-rose-300"
                  >
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
