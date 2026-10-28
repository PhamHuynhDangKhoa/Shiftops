import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../lib/types';
import { IconCheckList, IconArrowUpRight } from '../ui/Icons';

export interface ManagerRoutineTasksCardProps {
  branchTasks?: Task[];
}

export const ManagerRoutineTasksCard: React.FC<ManagerRoutineTasksCardProps> = ({
  branchTasks,
}) => {
  return (
    <div className="p-5 rounded-xl bg-[#ffffff] border border-[#e8eaec] space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <h3 className="text-sm font-bold text-[#131416] flex items-center gap-2">
          <IconCheckList size={16} />
          <span>Store Routine Tasks</span>
        </h3>
        <Link
          to="/tasks"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium flex items-center gap-1 transition-colors"
        >
          <span>Manage Tasks</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>

      {!branchTasks || branchTasks.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#5d5f60]">
          No tasks active. Generate from template in Tasks tab.
        </div>
      ) : (
        <div className="space-y-2">
          {branchTasks.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <span
                  className={`font-medium block truncate ${
                    t.status === 'COMPLETED'
                      ? 'line-through text-[#727477]'
                      : 'text-[#131416]'
                  }`}
                >
                  {t.title}
                </span>
                <span className="text-[11px] text-[#5d5f60]">
                  Assigned to: {t.userName || 'Unassigned'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase tracking-tight tabular-nums ${
                  t.status === 'COMPLETED'
                    ? 'bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20'
                    : t.status === 'IN_PROGRESS'
                    ? 'bg-[#e9f4f7] text-[#1b6c80] border border-[#1b6c80]/20'
                    : 'bg-[#ebedee] text-[#5d5f60]'
                }`}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
