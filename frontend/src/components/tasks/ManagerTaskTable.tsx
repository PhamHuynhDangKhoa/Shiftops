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
    return <div className="py-12 text-center text-xs font-mono text-zinc-400">Loading branch tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
          <IconCheckList size={16} />
        </div>
        <p className="text-xs font-medium text-zinc-800">No operational tasks found</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Generate tasks from checklists or add ad-hoc items for assigned staff.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
            <th className="py-2.5 px-3 font-medium">Task / Checklist</th>
            <th className="py-2.5 px-3 font-medium">Assigned Staff</th>
            <th className="py-2.5 px-3 font-medium">Shift</th>
            <th className="py-2.5 px-3 font-medium">Priority</th>
            <th className="py-2.5 px-3 font-medium">Status</th>
            <th className="py-2.5 px-3 font-medium">Completed At</th>
            <th className="py-2.5 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
              <td className="py-2.5 px-3">
                <div className="font-semibold text-zinc-950">{t.title}</div>
                {t.description && (
                  <div className="text-[11px] text-zinc-500 mt-0.5 max-w-sm">{t.description}</div>
                )}
              </td>
              <td className="py-2.5 px-3">
                <span className="font-medium text-zinc-800">{t.userName}</span>
                <div className="text-[11px] font-mono text-zinc-400">{t.userEmail}</div>
              </td>
              <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                {t.shiftName || 'Shift'}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <TaskPriorityBadge priority={t.priority} />
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <TaskStatusBadge status={t.status} />
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-600 whitespace-nowrap">
                {t.completedAt ? (
                  <span className="text-emerald-700 font-medium">
                    {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onCancelTask(t.id)}
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
