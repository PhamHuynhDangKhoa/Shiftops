import React from 'react';
import { Branch } from '../../lib/types';

interface ShiftFilterBarProps {
  isStaff: boolean;
  isOwner: boolean;
  branches?: Branch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onCreateClick: () => void;
}

export const ShiftFilterBar: React.FC<ShiftFilterBarProps> = ({
  isStaff,
  isOwner,
  branches,
  selectedBranchId,
  onBranchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onCreateClick,
}) => {
  return (
    <div>
      {/* Header with Title and Branch/Create Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            {isStaff ? 'My Assigned Shifts' : 'Shift Scheduling'}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {isStaff
              ? 'View your upcoming published shifts and rosters'
              : 'Create, assign, and manage daily and overnight staff schedules'}
          </p>
        </div>

        {!isStaff && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isOwner && branches && branches.length > 0 && (
              <select
                value={selectedBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={!b.active}>
                    {b.name} {!b.active ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onCreateClick}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>+</span> Create Shift
            </button>
          </div>
        )}
      </div>

      {/* Date Window Inputs */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Date Window:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>From:</label>
          <input
            type="date"
            value={startDate.slice(0, 10)}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>To:</label>
          <input
            type="date"
            value={endDate.slice(0, 10)}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>
          Showing shifts between {new Date(startDate).toLocaleDateString()} and {new Date(endDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
