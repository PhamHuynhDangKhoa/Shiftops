import React from 'react';
import { Shift, ShiftStatus } from '../../lib/types';
import { ShiftStatusBadge } from './ShiftStatusBadge';

interface ShiftCardProps {
  shift: Shift;
  isStaff: boolean;
  onAssignClick: (shift: Shift) => void;
  onRemoveAssignment: (shiftId: string, userId: string) => void;
  onUpdateStatus: (shiftId: string, status: ShiftStatus) => void;
  onDeleteShift: (shiftId: string) => void;
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

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  isStaff,
  onAssignClick,
  onRemoveAssignment,
  onUpdateStatus,
  onDeleteShift,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
            {shift.name || 'Shift'}
          </h3>
          <ShiftStatusBadge status={shift.status} />
        </div>

        {/* Branch Name */}
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          📍 {shift.branchName}
        </div>

        {/* Time & Overnight badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
            🕒 {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
          </span>
          {shift.overnight && (
            <span
              style={{
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              🌙 Overnight
            </span>
          )}
        </div>

        {/* Notes */}
        {shift.notes && (
          <p
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.825rem',
              color: '#4b5563',
              backgroundColor: '#f9fafb',
              padding: '0.5rem',
              borderRadius: '4px',
            }}
          >
            💬 {shift.notes}
          </p>
        )}

        {/* Assigned Staff */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.4rem' }}>
            Assigned Staff ({shift.assignments.length})
          </div>
          {shift.assignments.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>No staff assigned</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {shift.assignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '9999px',
                    padding: '0.2rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>{a.userName}</span>
                  {!isStaff && shift.status === 'DRAFT' && (
                    <button
                      onClick={() => onRemoveAssignment(shift.id, a.userId)}
                      title="Remove assignment"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons for Managers / Owners */}
      {!isStaff && (
        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {shift.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => onAssignClick(shift)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Assign Staff
                </button>
                <button
                  onClick={() => onUpdateStatus(shift.id, 'PUBLISHED')}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Publish
                </button>
              </>
            )}

            {shift.status === 'PUBLISHED' && (
              <>
                <button
                  onClick={() => onUpdateStatus(shift.id, 'DRAFT')}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Revert to Draft
                </button>
                <button
                  onClick={() => onUpdateStatus(shift.id, 'COMPLETED')}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Complete
                </button>
              </>
            )}

            {(shift.status === 'DRAFT' || shift.status === 'PUBLISHED') && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this shift?')) {
                    onUpdateStatus(shift.id, 'CANCELLED');
                  }
                }}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {shift.status === 'DRAFT' && (
            <button
              onClick={() => {
                if (confirm('Delete this draft shift permanently?')) {
                  onDeleteShift(shift.id);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
              title="Delete shift"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};
