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
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { fullName: string; phone?: string; role?: Role; primaryBranchId?: string };
    }) => {
      const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
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

  const handleOpenEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditFullName(targetUser.fullName);
    setEditPhone(targetUser.phone || '');
    setEditRole(targetUser.role);
    setEditBranchId(targetUser.primaryBranchId || '');
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
      alert('Temporary password copied to clipboard');
    }
  };

  const getRoleVariant = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return 'brand';
      case 'MANAGER':
        return 'brand';
      case 'STAFF':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#262c38]">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
            <IconUsers size={20} className="text-[#00f0ff]" />
            <span>ORGANIZATION PERSONNEL DIRECTORY</span>
          </h1>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            Manage organization members, sector assignments, credentials, and access clearance
          </p>
        </div>

        <Button
          variant="amber"
          size="md"
          onClick={() => {
            resetInviteForm();
            setIsInviteOpen(true);
          }}
          className="gap-2 shadow-[0_0_12px_rgba(255,107,0,0.25)]"
        >
          <IconPlus size={14} />
          <span>[ + ADD OPERATOR ]</span>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#11141a] border border-[#262c38] p-3.5 flex flex-wrap items-center gap-3 text-xs clip-chamfer-btn font-mono">
        <div className="flex-1 min-w-[200px] relative">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606c80]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-[#606c80] uppercase">SECTOR:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="">All Sectors</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-[#606c80] uppercase">ROLE:</label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="">All Roles</option>
            {isOwner && <option value="OWNER">Owner</option>}
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-[#606c80] uppercase">STATUS:</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-[#262c38] bg-[#11141a] clip-chamfer-card">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#161922] border-b border-[#262c38] text-[#9da8b9] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-3.5 font-bold">OPERATOR</th>
              <th className="py-3 px-3.5 font-bold">CLEARANCE ROLE</th>
              <th className="py-3 px-3.5 font-bold">PRIMARY SECTOR</th>
              <th className="py-3 px-3.5 font-bold">CONTACT PHONE</th>
              <th className="py-3 px-3.5 font-bold">STATUS</th>
              <th className="py-3 px-3.5 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e222b]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#00f0ff]">
                  [ SYNCING_PERSONNEL_DATABASE... ]
                </td>
              </tr>
            ) : pagedUsers?.content.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#606c80]">
                  [ NO PERSONNEL MATCHING GIVEN PARAMETERS ]
                </td>
              </tr>
            ) : (
              pagedUsers?.content.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-zinc-950">{member.fullName}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{member.email}</div>
                    {member.mustChangePassword && (
                      <span className="inline-block mt-1 font-mono text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">
                        Temp Password
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <Badge variant={getRoleVariant(member.role)} size="sm">
                      {member.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                    {member.primaryBranchName ? (
                      <span className="flex items-center gap-1">
                        <IconMapPin size={11} className="text-zinc-400" />
                        {member.primaryBranchName}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                    {member.phone || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <Badge variant={member.active ? 'success' : 'neutral'} size="sm">
                      {member.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(member)}
                        className="text-[11px] py-0.5 px-2"
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
                          className="text-[11px] py-0.5 px-2"
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
                            className="text-[11px] py-0.5 px-2 text-zinc-600"
                          >
                            Reset
                          </Button>

                          <Button
                            variant={member.active ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => {
                              const action = member.active ? 'deactivate' : 'activate';
                              if (window.confirm(`Are you sure you want to ${action} ${member.fullName}?`)) {
                                toggleStatusMutation.mutate({ id: member.id, active: !member.active });
                              }
                            }}
                            className="text-[11px] py-0.5 px-2"
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
          <div className="p-3 bg-[#161922] border-t border-[#262c38] flex items-center justify-between text-xs font-mono text-[#9da8b9]">
            <span className="text-[11px]">
              SHOWING {pagedUsers.content.length} OF {pagedUsers.totalElements} OPERATORS (SECTOR PAGE {pagedUsers.page + 1} OF {pagedUsers.totalPages})
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                [ PREV ]
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagedUsers.last}
                onClick={() => setPage((p) => p + 1)}
              >
                [ NEXT ]
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
          <div className="p-3 mb-4 rounded-md bg-rose-50 border border-rose-200/90 text-xs text-rose-800">
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
              <label className="text-xs font-medium text-zinc-700">Access Role *</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="STAFF">STAFF (Floor Operations)</option>
                <option value="MANAGER">MANAGER (Branch Coordinator)</option>
                <option value="OWNER">OWNER (Full Administration)</option>
              </select>
            </div>
          )}

          {inviteRole !== 'OWNER' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Primary Branch *</label>
              {isOwner ? (
                <select
                  required
                  value={inviteBranchId}
                  onChange={(e) => setInviteBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
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
                  className="w-full px-3 py-2 text-sm rounded-md border border-zinc-200 bg-zinc-100 text-zinc-600 cursor-not-allowed"
                />
              )}
            </div>
          )}

          <Input
            label="Initial Password (Optional — Auto-generated if left blank)"
            type="password"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            placeholder="Leave blank for secure auto-generation"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
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
              {createMutation.isPending ? 'Inviting...' : 'Register Staff Member'}
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
          <div className="p-3 mb-4 rounded-md bg-rose-50 border border-rose-200/90 text-xs text-rose-800">
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
                <label className="text-xs font-medium text-zinc-700">Access Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>

              {editRole !== 'OWNER' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-700">Primary Branch</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
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
            <label className="text-xs font-medium text-zinc-700">Target Branch *</label>
            <select
              value={targetTransferBranchId}
              onChange={(e) => setTargetTransferBranchId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
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
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800 mx-auto">
            <IconKey size={20} />
          </div>

          <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              One-Time Password
            </span>
            <code className="text-lg font-mono font-bold tracking-wider text-zinc-950 select-all">
              {tempPasswordModal?.tempPass}
            </code>
          </div>

          <p className="text-[11px] text-zinc-500">
            The user will be required to update this temporary password upon their next session login.
          </p>

          <div className="flex justify-center gap-2 pt-2 border-t border-zinc-100">
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
