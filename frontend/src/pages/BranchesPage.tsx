import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Branch, BranchSummary, ApiResponse } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 flex items-center gap-2">
            <IconBuilding size={20} className="text-zinc-950" />
            <span>Operating Locations & Branches</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage physical operational sites, timezones, and branch rosters
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="gap-1.5"
          >
            <IconPlus size={14} />
            <span>Create Branch</span>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 text-center text-xs font-mono text-zinc-400">Loading branches...</div>
      )}

      {error && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
          Failed to load branch records.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
          <div className="p-3 mb-4 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Branch Name *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Downtown Central, North Terminal"
          />

          <Input
            label="Physical Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main Street, Suite 400"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700">Operating Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              <option value="UTC">UTC (Universal Coordinated)</option>
              <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
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
    <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-zinc-950 tracking-tight">{branch.name}</h3>
            <p className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
              <IconMapPin size={11} className="text-zinc-400" />
              <span>{branch.address || 'No physical address specified'}</span>
            </p>
          </div>
          <Badge variant={branch.active ? 'success' : 'neutral'} size="sm">
            {branch.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
          <IconClock size={11} className="text-zinc-400" />
          <span>Timezone: {branch.timezone}</span>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-zinc-50 border border-zinc-200 font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Total Staff</span>
              <span className="font-bold text-zinc-950 tabular-nums">{summary.totalStaff}</span>
            </div>
            <div className="border-l border-zinc-200 pl-2">
              <span className="text-[10px] text-zinc-400 uppercase block">Active</span>
              <span className="font-bold text-emerald-800 tabular-nums">{summary.activeStaff}</span>
            </div>
            <div className="border-l border-zinc-200 pl-2">
              <span className="text-[10px] text-zinc-400 uppercase block">Managers</span>
              <span className="font-bold text-zinc-900 tabular-nums">{summary.managerCount}</span>
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
            className="flex-1 justify-center"
          >
            Edit
          </Button>
          <Button
            variant={branch.active ? 'danger' : 'secondary'}
            size="sm"
            onClick={onToggleStatus}
            className="flex-1 justify-center"
          >
            {branch.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )}
    </div>
  );
};
