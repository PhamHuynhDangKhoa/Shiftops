import React from 'react';
import { ShiftAssignment, TaskPriority } from '../../lib/types';

interface CreateAdHocTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: ShiftAssignment[];
  assignmentId: string;
  onSelectAssignmentId: (id: string) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  priority: TaskPriority;
  onChangePriority: (priority: TaskPriority) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const CreateAdHocTaskModal: React.FC<CreateAdHocTaskModalProps> = ({
  isOpen,
  onClose,
  assignments,
  assignmentId,
  onSelectAssignmentId,
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  priority,
  onChangePriority,
  onSubmit,
  isPending,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Add Ad-Hoc Task
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Assign to Staff Member:
          </label>
          <select
            value={assignmentId}
            onChange={(e) => onSelectAssignmentId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.userName} ({a.userRole})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Task Title:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g. Unpack delivery box #4"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Description (Optional):
          </label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Priority:
          </label>
          <select
            value={priority}
            onChange={(e) => onChangePriority(e.target.value as TaskPriority)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!assignmentId || !title.trim() || isPending}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: !assignmentId || !title.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
