import React from 'react';
import { Task, TaskStatus } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';

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
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        opacity: task.status === 'COMPLETED' ? 0.85 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, paddingRight: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          <span
            style={{
              fontWeight: 600,
              fontSize: '1rem',
              color: task.status === 'COMPLETED' ? '#4b5563' : '#111827',
              textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </span>
        </div>
        {task.description && (
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {task.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
          <span>📍 {task.branchName}</span>
          {task.shiftName && <span>⏰ {task.shiftName}</span>}
          {task.completedAt && (
            <span style={{ color: '#16a34a', fontWeight: 500 }}>
              ✓ Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Staff Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {task.status === 'TODO' && (
          <button
            onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
            disabled={isUpdating}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start Task
          </button>
        )}

        {(task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
          <button
            onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
            disabled={isUpdating}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#16a34a',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✓ Complete
          </button>
        )}

        {task.status === 'COMPLETED' && (
          <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
            Done
          </span>
        )}
      </div>
    </div>
  );
};
