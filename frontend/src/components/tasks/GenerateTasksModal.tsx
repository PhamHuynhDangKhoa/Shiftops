import React from 'react';
import { Shift, TaskTemplate } from '../../lib/types';

interface GenerateTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchShifts?: Shift[];
  branchTemplates?: TaskTemplate[];
  selectedShiftId: string;
  onSelectShiftId: (shiftId: string) => void;
  selectedTemplateId: string;
  onSelectTemplateId: (templateId: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const GenerateTasksModal: React.FC<GenerateTasksModalProps> = ({
  isOpen,
  onClose,
  branchShifts,
  branchTemplates,
  selectedShiftId,
  onSelectShiftId,
  selectedTemplateId,
  onSelectTemplateId,
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
          Generate Tasks for Shift
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
          Select a shift and task template. A distinct task will be assigned to every staff member on the shift.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Target Shift:
          </label>
          <select
            value={selectedShiftId}
            onChange={(e) => onSelectShiftId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            {branchShifts?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()}{' '}
                {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) -{' '}
                {s.assignments?.length || 0} staff
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
            Select Template:
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplateId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="">-- Choose Template --</option>
            {branchTemplates
              ?.filter((t) => t.active)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.items?.length || 0} checklist items)
                </option>
              ))}
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
            disabled={!selectedShiftId || !selectedTemplateId || isPending}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: !selectedShiftId || !selectedTemplateId ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Generating...' : 'Generate Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
};
