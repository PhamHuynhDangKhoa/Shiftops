import React from 'react';

interface IssueFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isStaff: boolean;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (priority: string) => void;
}

export const IssueFilterBar: React.FC<IssueFilterBarProps> = ({
  statusFilter,
  onStatusChange,
  isStaff,
  categoryFilter = 'ALL',
  onCategoryChange,
  priorityFilter = 'ALL',
  onPriorityChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {!isStaff && onCategoryChange && onPriorityChange && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
              Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INVENTORY">Inventory</option>
              <option value="SAFETY">Safety</option>
              <option value="FACILITY">Facility</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
