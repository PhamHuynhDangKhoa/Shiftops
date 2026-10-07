import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Branch, PagedResponse, ApiResponse, Role, ResetPasswordResponse } from '../lib/types';

export const StaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = currentUser?.role === 'OWNER';

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [transferUser, setTransferUser] = useState<User | null>(null);
  const [targetTransferBranchId, setTargetTransferBranchId] = useState<string>('');
  const [tempPasswordModal, setTempPasswordModal] = useState<{ email: string; tempPass: string } | null>(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('STAFF');
  const [inviteBranchId, setInviteBranchId] = useState<string>(currentUser?.primaryBranchId || '');
  const [invitePassword, setInvitePassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Form
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('STAFF');
  const [editBranchId, setEditBranchId] = useState<string>('');

  // Fetch branches for dropdowns
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
  });

  // Fetch staff list
  const { data: pagedUsers, isLoading } = useQuery<PagedResponse<User>>({
    queryKey: ['users', search, selectedBranchId, selectedRole, selectedStatus, page],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        page,
        size: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus !== '') params.active = selectedStatus === 'active';

      const res = await api.get<ApiResponse<PagedResponse<User>>>('/users', { params });
      return res.data.data;
    },
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      fullName: string;
      phone?: string;
      role: Role;
      primaryBranchId?: string;
      password?: string;
    }) => {
      const res = await api.post<ApiResponse<User>>('/users', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsInviteOpen(false);
      resetInviteForm();
      if (data.temporaryPassword) {
        setTempPasswordModal({
          email: data.email,
          tempPass: data.temporaryPassword,
        });
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create user');
      }
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { fullName: string; phone?: string; role?: Role; primaryBranchId?: string } }) => {
      const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to update user');
      }
    },
  });

  // Toggle User Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { active });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Transfer Branch Mutation
  const transferMutation = useMutation({
    mutationFn: async ({ id, targetBranchId }: { id: string; targetBranchId: string }) => {
      const res = await api.post<ApiResponse<User>>(`/users/${id}/transfer-branch`, { targetBranchId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTransferUser(null);
      setTargetTransferBranchId('');
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'Transfer failed');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<ResetPasswordResponse>>(`/users/${id}/reset-password`);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTempPasswordModal({
        email: data.email,
        tempPass: data.temporaryPassword,
      });
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'Password reset failed');
    },
  });

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteFullName('');
    setInvitePhone('');
    setInviteRole('STAFF');
    setInviteBranchId(currentUser?.primaryBranchId || (branches && branches[0] ? branches[0].id : ''));
    setInvitePassword('');
    setFormError(null);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditBranchId(user.primaryBranchId || '');
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: { fullName: string; phone?: string; role?: Role; primaryBranchId?: string } = {
      fullName: editFullName,
      phone: editPhone || undefined,
    };
    if (isOwner) {
      payload.role = editRole;
      if (editBranchId) payload.primaryBranchId = editBranchId;
    }
    updateMutation.mutate({ id: editingUser.id, payload });
  };

  const handleSaveInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      email: inviteEmail,
      fullName: inviteFullName,
      phone: invitePhone || undefined,
      role: isOwner ? inviteRole : 'STAFF',
      primaryBranchId: isOwner ? (inviteRole === 'OWNER' ? undefined : inviteBranchId) : currentUser?.primaryBranchId,
      password: invitePassword || undefined,
    });
  };

  const handleCopyTempPassword = () => {
    if (tempPasswordModal?.tempPass) {
      navigator.clipboard.writeText(tempPasswordModal.tempPass);
      alert('Temporary password copied to clipboard!');
    }
  };

  const getRoleBadge = (role: Role) => {
    const colors: Record<Role, { bg: string; text: string }> = {
      OWNER: { bg: '#ede9fe', text: '#6d28d9' },
      MANAGER: { bg: '#dbeafe', text: '#1d4ed8' },
      STAFF: { bg: '#dcfce7', text: '#15803d' },
    };
    const c = colors[role] || { bg: '#f3f4f6', text: '#374151' };
    return (
      <span
        style={{
          padding: '0.2rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 600,
          backgroundColor: c.bg,
          color: c.text,
        }}
      >
        {role}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Staff Management
          </h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Invite, assign branches, update profiles, and manage staff credentials
          </p>
        </div>

        <button
          onClick={() => {
            resetInviteForm();
            setIsInviteOpen(true);
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
          + Add / Invite Staff
        </button>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {isOwner && (
          <div style={{ minWidth: '160px' }}>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Branches</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ minWidth: '130px' }}>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(0);
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
            }}
          >
            <option value="">All Roles</option>
            {isOwner && <option value="OWNER">OWNER</option>}
            <option value="MANAGER">MANAGER</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>

        <div style={{ minWidth: '130px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Staff Member</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Primary Branch</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Phone</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading staff directory...
                </td>
              </tr>
            ) : pagedUsers?.content.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  No staff members match the selected criteria.
                </td>
              </tr>
            ) : (
              pagedUsers?.content.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{member.fullName}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{member.email}</div>
                    {member.mustChangePassword && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#b45309',
                          backgroundColor: '#fef3c7',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginTop: '0.2rem',
                        }}
                      >
                        Temporary Password
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{getRoleBadge(member.role)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                    {member.primaryBranchName ? `📍 ${member.primaryBranchName}` : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{member.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.45rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: member.active ? '#dcfce7' : '#fee2e2',
                        color: member.active ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {member.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenEdit(member)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => {
                            setTransferUser(member);
                            setTargetTransferBranchId(member.primaryBranchId || '');
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #c7d2fe',
                            backgroundColor: '#eef2ff',
                            color: '#4338ca',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Transfer
                        </button>
                      )}

                      {/* Reset Password */}
                      {member.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Generate a new temporary password for ${member.fullName}?`)) {
                              resetPasswordMutation.mutate(member.id);
                            }
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #fed7aa',
                            backgroundColor: '#fff7ed',
                            color: '#c2410c',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Reset Pass
                        </button>
                      )}

                      {/* Status Toggle */}
                      {member.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            const action = member.active ? 'deactivate' : 'activate';
                            if (window.confirm(`Are you sure you want to ${action} ${member.fullName}?`)) {
                              toggleStatusMutation.mutate({ id: member.id, active: !member.active });
                            }
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: `1px solid ${member.active ? '#fca5a5' : '#86efac'}`,
                            backgroundColor: member.active ? '#fef2f2' : '#f0fdf4',
                            color: member.active ? '#b91c1c' : '#15803d',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          {member.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {pagedUsers && pagedUsers.totalPages > 1 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.85rem',
              color: '#4b5563',
            }}
          >
            <span>
              Showing {pagedUsers.content.length} of {pagedUsers.totalElements} staff members (Page {pagedUsers.page + 1} of {pagedUsers.totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: page === 0 ? '#f3f4f6' : '#fff',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                disabled={pagedUsers.last}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: pagedUsers.last ? '#f3f4f6' : '#fff',
                  cursor: pagedUsers.last ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
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
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
              Add / Invite Staff Member
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

            <form onSubmit={handleSaveInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Charlie Parker"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. charlie@company.com"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="e.g. +1 555-0192"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              {isOwner && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>
              )}

              {inviteRole !== 'OWNER' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                    Primary Branch *
                  </label>
                  {isOwner ? (
                    <select
                      required
                      value={inviteBranchId}
                      onChange={(e) => setInviteBranchId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="">Select a Branch...</option>
                      {branches?.filter(b => b.active).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={currentUser?.primaryBranchName || 'Assigned Branch'}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Initial Password <span style={{ color: '#6b7280', fontWeight: 400 }}>(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {createMutation.isPending ? 'Inviting...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
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
              Edit Staff Profile
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

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              {isOwner && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                      Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </div>

                  {editRole !== 'OWNER' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                        Primary Branch
                      </label>
                      <select
                        value={editBranchId}
                        onChange={(e) => setEditBranchId(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', boxSizing: 'border-box' }}
                      >
                        {branches?.filter(b => b.active).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Branch Modal */}
      {transferUser && (
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
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
              Transfer Branch
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
              Move {transferUser.fullName} to a different operating branch.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Target Branch *
              </label>
              <select
                value={targetTransferBranchId}
                onChange={(e) => setTargetTransferBranchId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select target branch...</option>
                {branches
                  ?.filter((b) => b.active && b.id !== transferUser.primaryBranchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setTransferUser(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetTransferBranchId || transferMutation.isPending}
                onClick={() => {
                  transferMutation.mutate({
                    id: transferUser.id,
                    targetBranchId: targetTransferBranchId,
                  });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: !targetTransferBranchId || transferMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Display Modal */}
      {tempPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>🔑</span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                Temporary Password Generated
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                Share this temporary password with <strong>{tempPasswordModal.email}</strong>.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px dashed #d1d5db',
                borderRadius: '6px',
                padding: '0.85rem',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              <code style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: '#111827' }}>
                {tempPasswordModal.tempPass}
              </code>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', margin: '0 0 1.25rem 0' }}>
              The staff member will be required to change this password immediately upon their first login.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleCopyTempPassword}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #2563eb',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📋 Copy Password
              </button>
              <button
                type="button"
                onClick={() => setTempPasswordModal(null)}
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
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
