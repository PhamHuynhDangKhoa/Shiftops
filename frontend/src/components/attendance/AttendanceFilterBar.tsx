import React from 'react';
import { Branch } from '../../lib/types';

interface AttendanceFilterBarProps {
  branches?: Branch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
}

export const AttendanceFilterBar: React.FC<AttendanceFilterBarProps> = ({
  branches,
  selectedBranchId,
  onBranchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* Branch Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
            Branch
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onBranchChange(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              minWidth: '180px',
            }}
          >
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {!b.active ? '(Inactive)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      <button
        onClick={onRefresh}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          color: '#374151',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
};
