import React, { useState } from 'react';
import { Shift, User } from '../../lib/types';

interface AssignStaffModalProps {
  shift: Shift | null;
  branchStaff?: User[];
  onClose: () => void;
  onSubmit: (shiftId: string, userId: string) => void;
  isPending: boolean;
  assignError: string | null;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  shift,
  branchStaff,
  onClose,
  onSubmit,
  isPending,
  assignError,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');

  if (!shift) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    onSubmit(shift.id, selectedStaffId);
  };

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
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
            Assign Staff to {shift.name || 'Shift'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem' }}>
          Shift: {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
        </p>

        {assignError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {assignError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Select Staff Member:
            </label>
            <select
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">-- Choose staff --</option>
              {branchStaff
                ?.filter((s) => s.active)
                ?.map((s) => {
                  const alreadyAssigned = shift.assignments.some((a) => a.userId === s.id);
                  return (
                    <option key={s.id} value={s.id} disabled={alreadyAssigned}>
                      {s.fullName} ({s.email}) {alreadyAssigned ? '— (Already assigned)' : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStaffId || isPending}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {isPending ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
