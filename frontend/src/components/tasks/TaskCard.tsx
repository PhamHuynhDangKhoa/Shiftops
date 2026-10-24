import React from 'react';
import { Task, TaskStatus } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { Button } from '../ui/Button';
import { IconMapPin, IconClock, IconCheck } from '../ui/Icons';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  isUpdating: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  isUpdating,
}) => {
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div
      className={`bg-[#11141a] border border-[#262c38] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all clip-chamfer-card ${
        isCompleted ? 'opacity-70 border-l-2 border-l-[#00e676]' : 'hover:border-[#00f0ff] border-l-2 border-l-[#00f0ff]'
      }`}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          <span
            className={`font-mono font-bold text-sm tracking-wider uppercase ${
              isCompleted ? 'line-through text-[#606c80]' : 'text-white'
            }`}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-[#9da8b9] leading-relaxed pr-2 font-mono">
            // {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#606c80] flex-wrap pt-0.5">
          <span className="flex items-center gap-1">
            <IconMapPin size={11} className="text-[#00f0ff]" />
            {task.branchName}
          </span>
          {task.shiftName && (
            <span className="flex items-center gap-1">
              <IconClock size={11} className="text-[#00f0ff]" />
              {task.shiftName}
            </span>
          )}
          {task.completedAt && (
            <span className="text-[#00e676] font-bold flex items-center gap-1">
              <IconCheck size={11} />
              RESOLVED {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isCompleted ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
            disabled={isUpdating}
          >
            [ RE-OPEN ]
          </Button>
        ) : (
          <Button
            variant="cyan"
            size="sm"
            onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
            disabled={isUpdating}
            className="gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <IconCheck size={13} />
            <span>[ RESOLVE ]</span>
          </Button>
        )}
      </div>
    </div>
  );
};
