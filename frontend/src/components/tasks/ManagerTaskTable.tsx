import React from 'react';
import { Task } from '../../lib/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';

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
    return <p style={{ color: '#6b7280' }}>Loading branch tasks...</p>;
  }

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
        <p style={{ margin: 0, fontWeight: 500 }}>No tasks found for this branch or shift.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Click "Generate Tasks from Template" above to populate checklists for assigned staff.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
          <tr>
            <th style={{ padding: '0.75rem 1rem' }}>Task</th>
            <th style={{ padding: '0.75rem 1rem' }}>Staff Assigned</th>
            <th style={{ padding: '0.75rem 1rem' }}>Shift</th>
            <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
            <th style={{ padding: '0.75rem 1rem' }}>Status</th>
            <th style={{ padding: '0.75rem 1rem' }}>Completed At</th>
            <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.75rem 1rem' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>{t.title}</div>
                {t.description && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{t.description}</div>
                )}
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                <span style={{ fontWeight: 500 }}>{t.userName}</span>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.userEmail}</div>
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#4b5563', fontSize: '0.8rem' }}>
                {t.shiftName || 'Shift'}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <TaskPriorityBadge priority={t.priority} />
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <TaskStatusBadge status={t.status} />
              </td>
              <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                {t.completedAt ? (
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>
                    {new Date(t.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                  <button
                    onClick={() => onCancelTask(t.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #fee2e2',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#b91c1c',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
