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
      if (!effectiveBranchId) return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, empty: true };
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
      if (!effectiveBranchId) return [];
      const start = new Date();
      start.setHours(start.getHours() - 12);
      const end = new Date();
      end.setHours(end.getHours() + 12);

      if (isStaff) {
        const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
          params: { startDate: start.toISOString(), endDate: end.toISOString() },
        });
        return res.data.data;
      } else {
        const res = await api.get<ApiResponse<Shift[]>>(`/branches/${effectiveBranchId}/shifts`, {
          params: { startDate: start.toISOString(), endDate: end.toISOString() },
        });
        return res.data.data;
      }
    },
    enabled: !!effectiveBranchId,
  });

  // Fetch Open Issues for branch (for linking to handover debrief items)
  const { data: branchIssues } = useQuery<Issue[]>({
    queryKey: ['open-issues-for-handover', effectiveBranchId, isStaff],
    queryFn: async () => {
      if (!effectiveBranchId) return [];
      if (isStaff) {
        const res = await api.get<ApiResponse<Issue[]>>('/issues/my');
        return res.data.data;
      } else {
        const res = await api.get<ApiResponse<PagedResponse<Issue>>>(`/branches/${effectiveBranchId}/issues`, {
          params: { status: 'OPEN', size: 50 },
        });
        return res.data.data.content;
      }
    },
    enabled: !!effectiveBranchId,
  });

  // Initialize or fetch draft handover for a shift
  const handleOpenDebrief = async (shiftId: string) => {
    try {
      setErrorMessage(null);
      const res = await api.post<ApiResponse<ShiftHandover>>(`/shifts/${shiftId}/handover`, {});
      setActiveHandover(res.data.data);
      setIsDebriefModalOpen(true);
    } catch {
      setErrorMessage('Failed to open shift handover. Please retry.');
    }
  };

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async ({
      notes,
      items,
    }: {
      notes: string;
      items: { type: HandoverItemType; content: string; issueId?: string; orderIndex: number }[];
    }) => {
      if (!activeHandover) throw new Error('No active handover');
      const res = await api.put<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}`, {
        notes,
        items,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setActiveHandover(data);
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      setErrorMessage(message);
    },
  });

  // Submit Handover Mutation
  const submitMutation = useMutation({
    mutationFn: async ({
      notes,
      items,
    }: {
      notes: string;
      items: { type: HandoverItemType; content: string; issueId?: string; orderIndex: number }[];
    }) => {
      if (!activeHandover) throw new Error('No active handover');
      await api.put<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}`, {
        notes,
        items,
      });
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}/submit`);
      return res.data.data;
    },
    onSuccess: (data) => {
      setActiveHandover(data);
      setIsDebriefModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to submit handover';
      setErrorMessage(message);
    },
  });

  // Acknowledge Handover Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ handoverId, notes }: { handoverId: string; notes: string }) => {
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${handoverId}/acknowledge`, {
        notes,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setIsAckModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge handover';
      setErrorMessage(message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <IconHandshake size={22} className="text-zinc-700" />
            <span>Shift Handover & Turnover</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Incoming shift briefings, checklist handovers, and manager sign-offs
          </p>
        </div>

        {(isOwner || isManager) && branches && branches.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5d5f60] font-medium text-xs">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
          >
            <IconClose size={14} />
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
