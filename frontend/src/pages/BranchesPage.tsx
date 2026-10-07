import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Branch, BranchSummary, ApiResponse } from '../lib/types';

export const BranchesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.role === 'OWNER';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch branches
  const { data: branches, isLoading, error } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
  });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; address?: string; timezone: string }) => {
      const res = await api.post<ApiResponse<Branch>>('/branches', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create branch');
      }
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; address?: string; timezone: string } }) => {
      const res = await api.put<ApiResponse<Branch>>(`/branches/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditingBranch(null);
      resetForm();
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to update branch');
      }
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await api.patch<ApiResponse<Branch>>(`/branches/${id}/status`, { active });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const resetForm = () => {
    setName('');
    setAddress('');
    setTimezone('UTC');
    setFormError(null);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address || '');
    setTimezone(branch.timezone || 'UTC');
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingBranch) {
      updateMutation.mutate({
        id: editingBranch.id,
        payload: { name, address, timezone },
      });
    } else {
      createMutation.mutate({ name, address, timezone });
    }
  };

  const handleToggleStatus = (branch: Branch) => {
    const action = branch.active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${branch.name}?`)) {
      toggleStatusMutation.mutate({ id: branch.id, active: !branch.active });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Branch Management
          </h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Manage physical operational locations and branch settings
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            + Create Branch
          </button>
        )}
      </div>

      {isLoading && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading branches...</div>}
      {error && <div style={{ color: '#dc2626' }}>Failed to load branches.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {branches?.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            isOwner={isOwner}
            onEdit={() => handleOpenEdit(branch)}
            onToggleStatus={() => handleToggleStatus(branch)}
          />
        ))}
      </div>

      {/* Modal for Create or Edit */}
      {(isCreateOpen || editingBranch) && (
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
              padding: '1.75rem',
              maxWidth: '460px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
              {editingBranch ? 'Edit Branch' : 'Create New Branch'}
            </h2>

            {formError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Downtown Central"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="UTC">UTC (Universal)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingBranch(null);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BranchCard: React.FC<{
  branch: Branch;
  isOwner: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}> = ({ branch, isOwner, onEdit, onToggleStatus }) => {
  // Query branch summary stats
  const { data: summary } = useQuery<BranchSummary>({
    queryKey: ['branch-summary', branch.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BranchSummary>>(`/branches/${branch.id}/summary`);
      return res.data.data;
    },
    staleTime: 30000,
  });

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#111827' }}>
            {branch.name}
          </h3>
          <span
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 600,
              backgroundColor: branch.active ? '#dcfce7' : '#fee2e2',
              color: branch.active ? '#15803d' : '#b91c1c',
            }}
          >
            {branch.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.85rem' }}>
          📍 {branch.address || 'No address specified'}
        </p>

        <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.8rem' }}>
          🌐 Timezone: <span style={{ fontWeight: 500, color: '#374151' }}>{branch.timezone}</span>
        </p>

        {summary && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: '#f9fafb',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Total Staff</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{summary.totalStaff}</span>
            </div>
            <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '0.75rem' }}>
              <span style={{ color: '#6b7280', display: 'block' }}>Active</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: '#059669' }}>{summary.activeStaff}</span>
            </div>
            <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '0.75rem' }}>
              <span style={{ color: '#6b7280', display: 'block' }}>Managers</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: '#2563eb' }}>{summary.managerCount}</span>
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Edit
          </button>
          <button
            onClick={onToggleStatus}
            style={{
              flex: 1,
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              border: `1px solid ${branch.active ? '#fca5a5' : '#86efac'}`,
              backgroundColor: branch.active ? '#fef2f2' : '#f0fdf4',
              color: branch.active ? '#b91c1c' : '#15803d',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {branch.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  );
};
