import React from 'react';

export interface IssueMetrics {
  urgentCount: number;
  highCount: number;
  openAssignedCount: number;
  resolvedCount: number;
}

interface IssueSummaryCardsProps {
  metrics: IssueMetrics;
}

export const IssueSummaryCards: React.FC<IssueSummaryCardsProps> = ({ metrics }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          padding: '1.25rem',
          borderLeft: '4px solid #ef4444',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600 }}>
          🚨 Urgent Issues
        </span>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#991b1b', marginTop: '0.25rem' }}>
          {metrics.urgentCount}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Immediate action required</span>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #ffedd5',
          borderRadius: '8px',
          padding: '1.25rem',
          borderLeft: '4px solid #f97316',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#9a3412', fontWeight: 600 }}>
          High Priority
        </span>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9a3412', marginTop: '0.25rem' }}>
          {metrics.highCount}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#c2410c' }}>Pending resolution</span>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dbeafe',
          borderRadius: '8px',
          padding: '1.25rem',
          borderLeft: '4px solid #3b82f6',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
          Open & Active
        </span>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af', marginTop: '0.25rem' }}>
          {metrics.openAssignedCount}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>In investigation / progress</span>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d1fae5',
          borderRadius: '8px',
          padding: '1.25rem',
          borderLeft: '4px solid #10b981',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
          Resolved
        </span>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>
          {metrics.resolvedCount}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#059669' }}>Ready for manager closing</span>
      </div>
    </div>
  );
};
