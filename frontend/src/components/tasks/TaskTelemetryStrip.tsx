import React from 'react';
import { TaskMetrics } from './taskUtils';

interface TaskTelemetryStripProps {
  metrics: TaskMetrics;
  isStaff?: boolean;
}

export const TaskTelemetryStrip: React.FC<TaskTelemetryStripProps> = ({
  metrics,
  isStaff = false,
}) => {
  return (
    <div className="bg-white border border-[#e8eaec] rounded-lg overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#f0f1f2]">
        {/* Total Tasks */}
        <div className="p-4 sm:p-4.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            {isStaff ? 'My Assigned Scope' : 'Total Shift Scope'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#131416] tabular-nums">
              {metrics.total}
            </span>
            <span className="text-xs text-[#5d5f60]">duties</span>
          </div>
          <div className="mt-1 text-xs text-[#5d5f60] truncate">
            {metrics.highPriorityCount > 0 ? (
              <span className="text-[#831c1e] font-semibold">
                {metrics.highPriorityCount} high priority
              </span>
            ) : (
              'All standard priority'
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 sm:p-4.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Completion Rate</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#131416] tabular-nums">
              {metrics.completionRate}%
            </span>
            <span className="text-xs text-[#5d5f60]">
              {metrics.completed} of {metrics.total}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-[#f0f1f2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e7b4f] rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Pending (TODO) */}
        <div className="p-4 sm:p-4.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Awaiting Start</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#131416] tabular-nums">
              {metrics.pending}
            </span>
            <span className="text-xs text-[#5d5f60]">pending</span>
          </div>
          <div className="mt-1 text-xs text-[#5d5f60] truncate">
            {metrics.pending === 0 ? 'Queue clear' : 'Assigned & ready'}
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 sm:p-4.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Active Execution</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#b25e02] tabular-nums">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-[#5d5f60]">in-flight</span>
          </div>
          <div className="mt-1 text-xs text-[#5d5f60] truncate">
            {metrics.inProgress > 0 ? 'Floor staff active' : 'No tasks in motion'}
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 sm:p-4.5 col-span-2 sm:col-span-1">
          <div className="text-[13px] font-medium text-[#5d5f60]">Verified Finished</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#1e7b4f] tabular-nums">
              {metrics.completed}
            </span>
            <span className="text-xs text-[#5d5f60]">compliant</span>
          </div>
          <div className="mt-1 text-xs text-[#5d5f60] truncate">
            {metrics.cancelled > 0 ? (
              <span className="text-[#5d5f60]">({metrics.cancelled} cancelled)</span>
            ) : (
              '100% clean log'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
