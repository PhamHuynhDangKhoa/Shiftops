import React from 'react';
import { TaskPriority } from '../../lib/types';

export interface TemplateDraftItem {
  title: string;
  description: string;
  priority: TaskPriority;
  orderIndex: number;
}

interface TaskTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  name: string;
  onChangeName: (name: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  items: TemplateDraftItem[];
  onChangeItems: (items: TemplateDraftItem[]) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const TaskTemplateModal: React.FC<TaskTemplateModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  name,
  onChangeName,
  description,
  onChangeDescription,
  items,
  onChangeItems,
  onSubmit,
  isPending,
}) => {
  if (!isOpen) return null;

  const handleAddItem = () => {
    onChangeItems([
      ...items,
      { title: '', description: '', priority: 'NORMAL', orderIndex: items.length },
    ]);
  };

  const handleUpdateItemTitle = (index: number, title: string) => {
    const updated = [...items];
    const cur = updated[index];
    if (cur) {
      cur.title = title;
      onChangeItems(updated);
    }
  };

  const handleUpdateItemPriority = (index: number, priority: TaskPriority) => {
    const updated = [...items];
    const cur = updated[index];
    if (cur) {
      cur.priority = priority;
      onChangeItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    onChangeItems(items.filter((_, i) => i !== index));
  };

  const isSaveDisabled =
    !name.trim() || items.some((it) => !it.title.trim()) || isPending;

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
          {isEditing ? 'Edit Task Template' : 'Create Task Template'}
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Template Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="e.g. Morning Opening Checklist"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Description (Optional):
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Brief summary of duties"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Checklist Items:</label>
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                borderRadius: '4px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ➕ Add Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.5rem',
                backgroundColor: '#f9fafb',
                padding: '0.5rem',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', width: '20px' }}>
                {idx + 1}.
              </span>
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateItemTitle(idx, e.target.value)}
                placeholder="Task item title"
                style={{ flex: 2, padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
              />
              <select
                value={item.priority}
                onChange={(e) => handleUpdateItemPriority(idx, e.target.value as TaskPriority)}
                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
              </select>
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 0.3rem',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
            disabled={isSaveDisabled}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
