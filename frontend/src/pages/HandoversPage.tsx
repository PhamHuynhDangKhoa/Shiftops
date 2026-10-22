import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ShiftHandover,
  HandoverItemType,
  Branch,
  Shift,
  Issue,
  ApiResponse,
  PagedResponse,
} from '../lib/types';
import {
  LatestHandoverCard,
  OutgoingDebriefCard,
  HandoverHistoryTable,
  HandoverAcknowledgeModal,
  HandoverDebriefModal,
} from '../components/handovers';
import { IconHandshake, IconAlertTriangle, IconClose } from '../components/ui/Icons';

export const HandoversPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';

  // Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Subscribe to realtime operational branch topic for owners/managers
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Modals
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [activeHandover, setActiveHandover] = useState<ShiftHandover | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Branches
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) setSelectedBranchId(active.id);
    }
  }, [branches, selectedBranchId]);

  const effectiveBranchId = isStaff ? user?.primaryBranchId || '' : selectedBranchId;

  // Fetch Latest Branch Handover
  const {
    data: latestHandover,
    isLoading: isLoadingLatest,
  } = useQuery<ShiftHandover | null>({
    queryKey: ['latest-handover', effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return null;
      try {
        const res = await api.get<ApiResponse<ShiftHandover>>(`/branches/${effectiveBranchId}/handovers/latest`);
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!effectiveBranchId,
  });

  // Fetch Branch Handovers History (Managers / Owners)
  const { data: historyPage, isLoading: isLoadingHistory } = useQuery<PagedResponse<ShiftHandover>>({
    queryKey: ['branch-handovers-history', effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true };
      const res = await api.get<ApiResponse<PagedResponse<ShiftHandover>>>(`/branches/${effectiveBranchId}/handovers`, {
        params: { page: 0, size: 10 },
      });
      return res.data.data;
    },
    enabled: (isOwner || isManager) && !!effectiveBranchId,
  });

  // Fetch Shifts for creating/editing debrief
  const { data: availableShifts } = useQuery<Shift[]>({
    queryKey: ['available-shifts-for-handover', effectiveBranchId, isStaff],
    queryFn: async () => {
      if (isStaff) {
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
        const end = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
        const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
          params: { startDate: start, endDate: end },
        });
        return res.data.data;
      } else {
        if (!effectiveBranchId) return [];
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
        const end = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
        const res = await api.get<ApiResponse<Shift[]>>(`/branches/${effectiveBranchId}/shifts`, {
          params: { startDate: start, endDate: end },
        });
        return res.data.data;
      }
    },
    enabled: !!effectiveBranchId,
  });

  // Fetch Open Branch Issues to link items
  const { data: branchIssues } = useQuery<Issue[]>({
    queryKey: ['branch-issues-for-handover', effectiveBranchId],
    queryFn: async () => {
      if (!effectiveBranchId) return [];
      const res = await api.get<ApiResponse<PagedResponse<Issue>>>(`/branches/${effectiveBranchId}/issues`, {
        params: { status: 'OPEN', size: 50 },
      });
      return res.data.data.content;
    },
    enabled: !!effectiveBranchId,
  });

  // Open Handover Debrief Modal
  const handleOpenDebrief = async (shiftId: string) => {
    setErrorMessage(null);
    try {
      const res = await api.post<ApiResponse<ShiftHandover>>(`/shifts/${shiftId}/handover`, {});
      setActiveHandover(res.data.data);
      setIsDebriefModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load handover draft';
      setErrorMessage(message);
    }
  };

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async ({ notes, items }: { notes: string; items: { type: HandoverItemType; content: string; issueId?: string; orderIndex: number }[] }) => {
      if (!activeHandover) return;
      const res = await api.put<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}`, { notes, items });
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data) setActiveHandover(data);
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      setErrorMessage(message);
    },
  });

  // Submit Handover Mutation
  const submitMutation = useMutation({
    mutationFn: async ({ notes, items }: { notes: string; items: { type: HandoverItemType; content: string; issueId?: string; orderIndex: number }[] }) => {
      if (!activeHandover) return;
      await api.put(`/handovers/${activeHandover.id}`, { notes, items });
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}/submit`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
      setIsDebriefModalOpen(false);
      setActiveHandover(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to submit handover';
      setErrorMessage(message);
    },
  });

  // Acknowledge Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ handoverId, notes }: { handoverId: string; notes: string }) => {
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${handoverId}/acknowledge`, { notes });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
      setIsAckModalOpen(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge handover';
      setErrorMessage(message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 flex items-center gap-2">
            <IconHandshake size={20} className="text-zinc-950" />
            <span>Shift Handover Operations</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Transfer operational shift context, log duty debriefs, and prevent coverage blindspots
          </p>
        </div>

        {(isOwner || isManager) && branches && branches.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-zinc-500 text-[11px]">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.active && '(Inactive)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200/90 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={14} className="text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

      {/* 1. LATEST BRANCH HANDOVER (INCOMING TEAM VIEW) */}
      <LatestHandoverCard
        handover={latestHandover ?? null}
        isLoading={isLoadingLatest}
        onAcknowledgeClick={(ho) => {
          setActiveHandover(ho);
          setIsAckModalOpen(true);
        }}
      />

      {/* 2. PREPARE OUTGOING SHIFT HANDOVER (STAFF & ACTIVE SHIFT) */}
      <OutgoingDebriefCard
        shifts={availableShifts}
        onOpenDebrief={handleOpenDebrief}
      />

      {/* 3. HISTORICAL HANDOVERS ARCHIVE (FOR MANAGERS & OWNERS) */}
      {(isOwner || isManager) && (
        <HandoverHistoryTable
          historyPage={historyPage}
          isLoading={isLoadingHistory}
          onViewDetails={(ho) => {
            setActiveHandover(ho);
            setIsDebriefModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <HandoverDebriefModal
        isOpen={isDebriefModalOpen}
        handover={activeHandover}
        branchIssues={branchIssues}
        errorMessage={errorMessage}
        onClose={() => setIsDebriefModalOpen(false)}
        onSaveDraft={(notes, items) => saveDraftMutation.mutate({ notes, items })}
        onSubmit={(notes, items) => submitMutation.mutate({ notes, items })}
        isSaving={saveDraftMutation.isPending}
        isSubmitting={submitMutation.isPending}
      />

      <HandoverAcknowledgeModal
        isOpen={isAckModalOpen}
        handover={activeHandover}
        onClose={() => setIsAckModalOpen(false)}
        onAcknowledge={(handoverId, notes) => acknowledgeMutation.mutate({ handoverId, notes })}
        isPending={acknowledgeMutation.isPending}
      />
    </div>
  );
};
