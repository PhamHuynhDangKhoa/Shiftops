import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ApiResponse, Branch } from '../lib/types';

interface HealthData {
  status: string;
  version: string;
  database: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Health check query
  const { data: health } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HealthData>>('/health');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  // Branches query
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  return (
    <div>
      {/* Welcome Hero */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#111827' }}>
              Welcome back, {user?.fullName}! 👋
            </h1>
            <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
              Logged in as <strong style={{ color: '#111827' }}>{user?.role}</strong>
              {user?.primaryBranchName && (
                <>
                  {' '}at <strong>{user.primaryBranchName}</strong>
                </>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(isOwner || isManager) && (
              <Link
                to="/staff"
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Manage Staff
              </Link>
            )}
            {(isOwner || isManager) && (
              <Link
                to="/branches"
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Branches
              </Link>
            )}
            <Link
              to="/attendance"
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              ⏱️ Attendance
            </Link>
            <Link
              to="/tasks"
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              📋 Tasks
            </Link>
            <Link
              to="/issues"
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              ⚠️ Issues
            </Link>
            <Link
              to="/profile"
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Operating Branches</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
            {branches ? branches.length : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#059669' }}>
            {branches?.filter(b => b.active).length || 0} active locations
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>System Status</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: health?.status === 'UP' ? '#059669' : '#d97706', marginTop: '0.25rem' }}>
            {health?.status || 'Connecting...'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            DB: {health?.database || 'PostgreSQL'} • API: v{health?.version || '1.0'}
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Security Status</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: user?.mustChangePassword ? '#d97706' : '#059669', marginTop: '0.25rem' }}>
            {user?.mustChangePassword ? 'Action Required' : 'Healthy'}
          </div>
          <span style={{ fontSize: '0.75rem', color: user?.mustChangePassword ? '#d97706' : '#6b7280' }}>
            {user?.mustChangePassword ? 'Temporary password active' : 'Credentials up-to-date'}
          </span>
        </div>
      </div>

      {/* Modules Roadmap Notice for Next Phases */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.25rem',
          color: '#334155',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>ShiftOps Modules Status</h3>
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
          • <strong>Phase 1:</strong> Authentication & Core Entities (Complete ✅)<br />
          • <strong>Phase 2:</strong> Branch & Staff Management (Complete ✅)<br />
          • <strong>Phase 3:</strong> Shift Scheduling & Concurrency Engine (Complete ✅)<br />
          • <strong>Phase 4:</strong> Attendance & Punctuality Engine (Complete ✅)<br />
          • <strong>Phase 5:</strong> Task Assignment & Templates (Complete ✅)<br />
          • <strong>Phase 6:</strong> Issue Management & Resolution (Active & Verified ✅)
        </p>
      </div>
    </div>
  );
};
