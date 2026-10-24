import React from 'react';
import { Task, TaskStatus } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
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
    <Card
      compact
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isCompleted ? 'opacity-75 bg-zinc-50/50' : 'hover:border-zinc-300'
      }`}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          <span
            className={`font-semibold text-sm ${
              isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900'
            }`}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-zinc-600 leading-relaxed pr-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap pt-0.5">
          <span className="flex items-center gap-1">
            <IconMapPin size={12} className="text-zinc-400" />
            {task.branchName}
          </span>
          {task.shiftName && (
            <span className="flex items-center gap-1">
              <IconClock size={12} className="text-zinc-400" />
              {task.shiftName}
            </span>
          )}
          {task.completedAt && (
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <IconCheck size={12} />
              Completed at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            Re-open
          </Button>
        ) : (
          <Button
            variant="emerald"
            size="sm"
            onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
            disabled={isUpdating}
            className="gap-1.5"
          >
            <IconCheck size={14} />
            <span>Mark Complete</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
