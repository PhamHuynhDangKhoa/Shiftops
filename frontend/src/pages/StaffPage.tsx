import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Branch, PagedResponse, ApiResponse, Role, ResetPasswordResponse } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconMapPin,
  IconKey,
} from '../components/ui/Icons';

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
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to register user');
      setFormError(msg);
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
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to update user');
      setFormError(msg);
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
      const res = await api.post<ApiResponse<User>>(`/users/${id}/transfer`, { targetBranchId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTransferUser(null);
      setTargetTransferBranchId('');
    },
    onError: (err: unknown) => {
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to transfer user');
      alert(msg);
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post<ApiResponse<ResetPasswordResponse>>(`/users/${userId}/reset-password`);
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
      const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = anyErr.response?.data?.error?.message || (err instanceof Error ? err.message : 'Failed to reset password');
      alert(msg);
    },
  });

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteFullName('');
    setInvitePhone('');
    setInviteRole('STAFF');
    setInviteBranchId(currentUser?.primaryBranchId || '');
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

  const handleSaveInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      email: inviteEmail,
      fullName: inviteFullName,
      phone: invitePhone || undefined,
      role: inviteRole,
      primaryBranchId: inviteRole === 'OWNER' ? undefined : inviteBranchId,
      password: invitePassword || undefined,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    updateMutation.mutate({
      id: editingUser.id,
      payload: {
        fullName: editFullName,
        phone: editPhone || undefined,
        role: isOwner ? editRole : undefined,
        primaryBranchId: isOwner && editRole !== 'OWNER' ? editBranchId : undefined,
      },
    });
  };

  const handleCopyTempPassword = () => {
    if (tempPasswordModal) {
      navigator.clipboard.writeText(tempPasswordModal.tempPass);
      alert('Temporary password copied to clipboard.');
    }
  };

  const getRoleVariant = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return 'gold';
      case 'MANAGER':
        return 'warning';
      case 'STAFF':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#f0f1f2]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416] flex items-center gap-2.5">
            <IconUsers size={22} className="text-[#131416]" />
            <span>Staff Directory</span>
          </h1>
          <p className="text-xs text-[#5d5f60] mt-1">
            Manage team members, branch assignments, account status, and role access permissions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            resetInviteForm();
            setIsInviteOpen(true);
          }}
          className="gap-2 shadow-xs shrink-0"
        >
          <IconPlus size={15} />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-[#e8eaec] rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727477]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#727477] focus:outline-none focus:border-[#1b6c80]"
          />
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#5d5f60]">Branch:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(0);
              }}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
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

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#5d5f60]">Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(0);
            }}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
          >
            <option value="">All Roles</option>
            {isOwner && <option value="OWNER">Owner</option>}
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#5d5f60]">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-xl">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-[#e8eaec] bg-[#f9fbfc] text-[#5d5f60] text-xs font-medium h-10">
              <th className="py-2.5 px-4 font-medium">Employee</th>
              <th className="py-2.5 px-4 font-medium">Role</th>
              <th className="py-2.5 px-4 font-medium">Branch</th>
              <th className="py-2.5 px-4 font-medium">Contact phone</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#5d5f60]">
                  Loading staff directory...
                </td>
              </tr>
            ) : pagedUsers?.content.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#5d5f60]">
                  No personnel matching the given search or filters.
                </td>
              </tr>
            ) : (
              pagedUsers?.content.map((member) => (
                <tr key={member.id} className="hover:bg-[#f4f6f8] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#131416]">{member.fullName}</div>
                    <div className="text-xs text-[#5d5f60]">{member.email}</div>
                    {member.mustChangePassword && (
                      <span className="inline-block mt-1 text-[11px] font-medium text-[#92400e] bg-[#fffbeb] border border-[#92400e]/30 px-2 py-0.5 rounded-full">
                        Temporary Password
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={getRoleVariant(member.role)} size="sm">
                      {member.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[#5d5f60] text-xs whitespace-nowrap">
                    {member.primaryBranchName ? (
                      <span className="flex items-center gap-1 font-medium text-[#131416]">
                        <IconMapPin size={12} className="text-[#727477]" />
                        <span>{member.primaryBranchName}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#5d5f60] text-xs whitespace-nowrap font-mono tabular-nums">
                    {member.phone || '—'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={member.active ? 'success' : 'neutral'} size="sm" showDot>
                      {member.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(member)}
                        className="text-xs py-1 px-2.5"
                      >
                        Edit
                      </Button>

                      {isOwner && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setTransferUser(member);
                            setTargetTransferBranchId(member.primaryBranchId || '');
                          }}
                          className="text-xs py-1 px-2.5"
                        >
                          Transfer
                        </Button>
                      )}

                      {member.id !== currentUser?.id && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Generate a new temporary password for ${member.fullName}?`)) {
                                resetPasswordMutation.mutate(member.id);
                              }
                            }}
                            className="text-xs py-1 px-2.5"
                          >
                            Reset
                          </Button>

                          <Button
                            variant={member.active ? 'danger' : 'emerald'}
                            size="sm"
                            onClick={() => {
                              const action = member.active ? 'deactivate' : 'activate';
                              if (window.confirm(`Are you sure you want to ${action} ${member.fullName}?`)) {
                                toggleStatusMutation.mutate({ id: member.id, active: !member.active });
                              }
                            }}
                            className="text-xs py-1 px-2.5"
                          >
                            {member.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </>
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
          <div className="p-3.5 bg-[#f9fbfc] border-t border-[#e8eaec] flex items-center justify-between text-xs text-[#5d5f60]">
            <span>
              Showing <span className="font-mono tabular-nums font-medium text-[#131416]">{pagedUsers.content.length}</span> of <span className="font-mono tabular-nums font-medium text-[#131416]">{pagedUsers.totalElements}</span> staff members (Page <span className="font-mono tabular-nums">{pagedUsers.page + 1}</span> of <span className="font-mono tabular-nums">{pagedUsers.totalPages}</span>)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagedUsers.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite / Register Staff Member"
        description="Provision account credentials and branch operating assignment"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-lg bg-[#ffedea] border border-[#c4242a]/30 text-xs font-medium text-[#831c1e]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveInvite} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={inviteFullName}
            onChange={(e) => setInviteFullName(e.target.value)}
            placeholder="e.g. Charlie Parker"
          />

          <Input
            label="Email Address *"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="e.g. charlie@company.com"
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            placeholder="e.g. +1 555-0192"
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#131416]">Access Role *</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
              >
                <option value="STAFF">Staff (Store Operations)</option>
                <option value="MANAGER">Manager (Branch Supervisor)</option>
                <option value="OWNER">Owner (Full Administration)</option>
              </select>
            </div>
          )}

          {inviteRole !== 'OWNER' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#131416]">Primary Branch *</label>
              {isOwner ? (
                <select
                  required
                  value={inviteBranchId}
                  onChange={(e) => setInviteBranchId(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                >
                  <option value="">Select a Branch...</option>
                  {branches?.filter((b) => b.active).map((b) => (
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
                  className="w-full h-9 px-3 text-xs rounded-md border border-[#e8eaec] bg-[#f4f6f8] text-[#5d5f60] cursor-not-allowed"
                />
              )}
            </div>
          )}

          <Input
            label="Initial password (optional, auto-generated if left blank)"
            type="password"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            placeholder="Leave blank for secure auto-generation"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Registering...' : 'Register Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Staff Profile"
        description="Update profile metadata, branch assignment, or role permissions"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-lg bg-[#ffedea] border border-[#c4242a]/30 text-xs font-medium text-[#831c1e]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />

          {isOwner && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#131416]">Access Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              {editRole !== 'OWNER' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#131416]">Primary Branch</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                  >
                    {branches?.filter((b) => b.active).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Branch Modal */}
      <Modal
        isOpen={!!transferUser}
        onClose={() => setTransferUser(null)}
        title="Transfer Operating Branch"
        description={transferUser ? `Reassign ${transferUser.fullName} to another active location` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#131416]">Target Branch *</label>
            <select
              value={targetTransferBranchId}
              onChange={(e) => setTargetTransferBranchId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            >
              <option value="">Select target branch...</option>
              {branches
                ?.filter((b) => b.active && b.id !== transferUser?.primaryBranchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTransferUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!targetTransferBranchId || transferMutation.isPending}
              onClick={() => {
                if (transferUser) {
                  transferMutation.mutate({
                    id: transferUser.id,
                    targetBranchId: targetTransferBranchId,
                  });
                }
              }}
            >
              {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Temporary Password Display Modal */}
      <Modal
        isOpen={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Temporary Credentials Generated"
        description={tempPasswordModal ? `Share these credentials securely with ${tempPasswordModal.email}` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#dcfae5] border border-[#1e7b4f]/20 flex items-center justify-center text-[#1e7b4f] mx-auto">
            <IconKey size={22} />
          </div>

          <div className="p-3.5 rounded-lg bg-[#f9fbfc] border border-[#e8eaec]">
            <span className="text-xs text-[#5d5f60] font-medium block mb-1">
              Temporary password
            </span>
            <code className="text-lg font-mono font-medium text-[#131416] select-all">
              {tempPasswordModal?.tempPass}
            </code>
          </div>

          <p className="text-xs text-[#5d5f60]">
            The user will be required to update this temporary password upon their next session login.
          </p>

          <div className="flex justify-center gap-2 pt-2 border-t border-[#f0f1f2]">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyTempPassword}
            >
              Copy Password
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTempPasswordModal(null)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
