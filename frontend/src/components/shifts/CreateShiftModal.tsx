import React, { useState } from 'react';

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name?: string; startTime: string; endTime: string; notes?: string }) => void;
  isPending: boolean;
  formError: string | null;
}

export const CreateShiftModal: React.FC<CreateShiftModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  formError,
}) => {
  const [shiftName, setShiftName] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!startDateTime || !endDateTime) {
      setLocalError('Start time and end time are required.');
      return;
    }

    const start = new Date(startDateTime).toISOString();
    const end = new Date(endDateTime).toISOString();

    if (new Date(start) >= new Date(end)) {
      setLocalError('End time must be strictly after start time.');
      return;
    }

    onSubmit({
      name: shiftName.trim() || undefined,
      startTime: start,
      endTime: end,
      notes: shiftNotes.trim() || undefined,
    });
  };

  const effectiveError = localError || formError;

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
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create New Shift</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        {effectiveError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {effectiveError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Shift Name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Shift, Night Shift"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              💡 For overnight shifts crossing midnight, select the next day for the end date.
            </span>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Notes / Briefing (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Bring keycard, inventory handover..."
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
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
              disabled={isPending}
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
              {isPending ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
