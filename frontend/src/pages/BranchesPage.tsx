import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Branch, BranchSummary, ApiResponse } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  IconBuilding,
  IconPlus,
  IconMapPin,
  IconClock,
} from '../components/ui/Icons';

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
      setFormError(err instanceof Error ? err.message : 'Failed to create branch');
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
      setFormError(err instanceof Error ? err.message : 'Failed to update branch');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#f0f1f2]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416] flex items-center gap-2.5">
            <IconBuilding size={22} className="text-[#131416]" />
            <span>Branch Locations</span>
          </h1>
          <p className="text-xs text-[#5d5f60] mt-1">
            Manage physical operational stores, operating timezones, and branch rosters
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="gap-2 shadow-xs shrink-0"
          >
            <IconPlus size={15} />
            <span>Register Branch</span>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 text-center text-xs text-[#5d5f60] bg-white border border-[#e8eaec] rounded-xl">
          Loading branch locations...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#ffedea] border border-[#c4242a]/30 text-xs text-[#831c1e]">
          Failed to load branch records. Please verify connectivity.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <Modal
        isOpen={isCreateOpen || !!editingBranch}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingBranch(null);
        }}
        title={editingBranch ? 'Edit Branch Location' : 'Register New Branch'}
        description="Configure address, timezone, and operational parameters for this location"
        maxWidth="md"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-lg bg-[#ffedea] border border-[#c4242a]/30 text-xs font-medium text-[#831c1e]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Branch Name *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Downtown Central, North Mall"
          />

          <Input
            label="Physical Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main Street, Suite 400"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#131416]">Operating Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
            >
              <option value="UTC">UTC (Universal Coordinated)</option>
              <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingBranch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const BranchCard: React.FC<{
  branch: Branch;
  isOwner: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}> = ({ branch, isOwner, onEdit, onToggleStatus }) => {
  const { data: summary } = useQuery<BranchSummary>({
    queryKey: ['branch-summary', branch.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BranchSummary>>(`/branches/${branch.id}/summary`);
      return res.data.data;
    },
    staleTime: 30000,
  });

  return (
    <Card className="flex flex-col justify-between gap-4 p-4 sm:p-5 border border-[#e8eaec] bg-white rounded-xl hover:border-[#cdced1] transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-[#131416]">{branch.name}</h3>
            <p className="text-xs text-[#5d5f60] flex items-center gap-1.5 mt-0.5">
              <IconMapPin size={12} className="text-[#727477]" />
              <span>{branch.address || 'No physical address specified'}</span>
            </p>
          </div>
          <Badge variant={branch.active ? 'success' : 'neutral'} size="sm" showDot>
            {branch.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="text-xs text-[#5d5f60] flex items-center gap-1.5">
          <IconClock size={13} className="text-[#727477]" />
          <span>Timezone: <span className="font-mono">{branch.timezone}</span></span>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] text-xs">
            <div>
              <span className="text-[#5d5f60] text-xs font-normal block">Total staff</span>
              <span className="font-mono font-semibold text-[#131416] text-sm tabular-nums">{summary.totalStaff}</span>
            </div>
            <div className="border-l border-[#e8eaec] pl-2.5">
              <span className="text-[#5d5f60] text-xs font-normal block">Active</span>
              <span className="font-mono font-semibold text-[#1e7b4f] text-sm tabular-nums">{summary.activeStaff}</span>
            </div>
            <div className="border-l border-[#e8eaec] pl-2.5">
              <span className="text-[#5d5f60] text-xs font-normal block">Managers</span>
              <span className="font-mono font-semibold text-[#131416] text-sm tabular-nums">{summary.managerCount}</span>
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="pt-3 border-t border-[#f0f1f2] flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
            className="flex-1 justify-center text-xs"
          >
            Edit
          </Button>
          <Button
            variant={branch.active ? 'danger' : 'emerald'}
            size="sm"
            onClick={onToggleStatus}
            className="flex-1 justify-center text-xs"
          >
            {branch.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )}
    </Card>
  );
};
