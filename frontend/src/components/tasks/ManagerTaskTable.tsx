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
    return <div className="py-12 text-center text-xs font-mono text-[#00f0ff]">[ SYNCING_SECTOR_TASKS... ]</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center border border-[#262c38] bg-[#11141a] clip-chamfer-card">
        <div className="w-8 h-8 bg-[#181c24] border border-[#262c38] flex items-center justify-center text-[#606c80] mx-auto mb-2">
          <IconCheckList size={16} />
        </div>
        <p className="text-xs font-mono font-bold text-white uppercase">[ NO OPERATIONAL TASKS FOUND ]</p>
        <p className="text-[11px] font-mono text-[#606c80] mt-0.5">
          Generate tasks from templates or dispatch ad-hoc directives to assigned operators.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#262c38] bg-[#11141a] clip-chamfer-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#161922] border-b border-[#262c38] text-[#9da8b9] font-mono text-[10px] uppercase tracking-wider">
            <th className="py-3 px-3.5 font-bold">MISSION / DIRECTIVE</th>
            <th className="py-3 px-3.5 font-bold">ASSIGNED OPERATOR</th>
            <th className="py-3 px-3.5 font-bold">SHIFT WINDOW</th>
            <th className="py-3 px-3.5 font-bold">PRIORITY</th>
            <th className="py-3 px-3.5 font-bold">STATUS</th>
            <th className="py-3 px-3.5 font-bold">COMPLETED AT</th>
            <th className="py-3 px-3.5 font-bold text-right">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e222b]">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-[#181c24] transition-colors font-mono">
              <td className="py-3 px-3.5">
                <div className="font-bold text-white uppercase">{t.title}</div>
                {t.description && (
                  <div className="text-[11px] text-[#9da8b9] mt-0.5 max-w-sm truncate">// {t.description}</div>
                )}
              </td>
              <td className="py-3 px-3.5">
                {t.userName ? (
                  <span className="font-bold text-[#00f0ff]">{t.userName}</span>
                ) : (
                  <span className="text-[#606c80] italic">[ UNASSIGNED ]</span>
                )}
              </td>
              <td className="py-3 px-3.5 text-[#9da8b9]">
                {t.shiftName || '—'}
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <TaskPriorityBadge priority={t.priority} />
              </td>
              <td className="py-3 px-3.5 whitespace-nowrap">
                <TaskStatusBadge status={t.status} />
              </td>
              <td className="py-3 px-3.5 tabular-nums text-[#606c80] whitespace-nowrap">
                {t.completedAt ? new Date(t.completedAt).toLocaleTimeString() : '—'}
              </td>
              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onCancelTask(t.id)}
                    className="text-[10px]"
                  >
                    [ CANCEL ]
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
