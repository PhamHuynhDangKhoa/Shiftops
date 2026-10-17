import React from 'react';
import { TaskTemplate } from '../../lib/types';

interface TaskTemplateListProps {
  templates?: TaskTemplate[];
  isLoading: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (template: TaskTemplate) => void;
  onToggleStatus: (templateId: string, active: boolean) => void;
}

export const TaskTemplateList: React.FC<TaskTemplateListProps> = ({
  templates = [],
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onToggleStatus,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>
          Templates define reusable operational checklists (e.g. Opening, Closing, Cleanliness) for this branch.
        </span>
        <button
          onClick={onOpenCreate}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          ➕ Create Template
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: '#6b7280' }}>Loading templates...</p>
      ) : templates.length === 0 ? (
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
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
          <p style={{ margin: 0, fontWeight: 500 }}>No task templates created yet for this branch.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Create your first template to standardize operational routines.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '1.25rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                      {tpl.name}
                    </h3>
                    {tpl.description && (
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                        {tpl.description}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: tpl.active ? '#dcfce7' : '#f3f4f6',
                      color: tpl.active ? '#166534' : '#6b7280',
                    }}
                  >
                    {tpl.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>
                    Checklist Items ({tpl.items.length}):
                  </span>
                  <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#374151' }}>
                    {tpl.items.map((it) => (
                      <li key={it.id} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>{it.title}</span>{' '}
                        {it.priority !== 'NORMAL' && (
                          <span style={{ fontSize: '0.7rem', color: it.priority === 'HIGH' ? '#dc2626' : '#6b7280' }}>
                            [{it.priority}]
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => onToggleStatus(tpl.id, !tpl.active)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {tpl.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => onOpenEdit(tpl)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2563eb',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
