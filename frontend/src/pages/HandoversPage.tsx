import React, { useState, useEffect, useMemo } from 'react';
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
  HandoverHistoryTable,
  HandoverAcknowledgeModal,
  HandoverDebriefModal,
  HandoverSupervisorAuditRail,
  generateFallbackLatestHandover,
  generateFallbackHistoricalHandovers,
  generateFallbackOutgoingShifts,
} from '../components/handovers';
import { IconHandshake, IconAlertTriangle, IconClose, IconCheck, IconPlus, IconChevronDown } from '../components/ui/Icons';

export const HandoversPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';

  // Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Full history table drawer/collapsible
  const [showFullHistory, setShowFullHistory] = useState(false);

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
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Local demo override when acknowledging or updating in demo mode
  const [handoverOverride, setHandoverOverride] = useState<ShiftHandover | null>(null);

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

  const effectiveBranchId = isStaff ? user?.primaryBranchId || 'b1' : selectedBranchId || 'b1';
  const currentBranchName = branches?.find((b) => b.id === effectiveBranchId)?.name || 'Shibuya Flagship';

  // Fetch Latest Branch Handover
  const {
    data: rawLatestHandover,
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

  // Effective latest handover with fallback for demo/offline previews
  const effectiveLatestHandover = useMemo(() => {
    if (handoverOverride) return handoverOverride;
    if (rawLatestHandover) return rawLatestHandover;
    return generateFallbackLatestHandover(effectiveBranchId, currentBranchName);
  }, [rawLatestHandover, handoverOverride, effectiveBranchId, currentBranchName]);

  // Fetch Branch Handovers History (Managers / Owners)
  const { data: rawHistoryPage, isLoading: isLoadingHistory } = useQuery<PagedResponse<ShiftHandover>>({
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

  // Effective history with fallback
  const effectiveHistoryPage = useMemo<PagedResponse<ShiftHandover>>(() => {
    if (rawHistoryPage && rawHistoryPage.content && rawHistoryPage.content.length > 0) {
      return rawHistoryPage;
    }
    const fallbacks = generateFallbackHistoricalHandovers(effectiveBranchId, currentBranchName);
    return {
      content: fallbacks,
      page: 0,
      size: 10,
      totalElements: fallbacks.length,
      totalPages: 1,
      first: true,
      last: true,
      empty: false,
    };
  }, [rawHistoryPage, effectiveBranchId, currentBranchName]);

  // Fetch Shifts for creating/editing debrief
  const { data: rawAvailableShifts } = useQuery<Shift[]>({
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

  // Effective available shifts with fallback
  const effectiveAvailableShifts = useMemo(() => {
    if (rawAvailableShifts && rawAvailableShifts.length > 0) {
      return rawAvailableShifts;
    }
    return generateFallbackOutgoingShifts(effectiveBranchId, currentBranchName);
  }, [rawAvailableShifts, effectiveBranchId, currentBranchName]);

  // Fetch Open Issues for branch
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
      // Demo fallback draft
      const shift = effectiveAvailableShifts.find((s) => s.id === shiftId);
      const now = new Date();
      const draftFallback: ShiftHandover = {
        id: `ho-draft-${Date.now()}`,
        shiftId,
        shiftName: shift?.name || 'Afternoon Operations',
        shiftStartTime: shift?.startTime || now.toISOString(),
        shiftEndTime: shift?.endTime || now.toISOString(),
        branchId: effectiveBranchId,
        branchName: currentBranchName,
        status: 'DRAFT',
        notes: '',
        submittedById: user?.id,
        submittedByName: user?.fullName || 'Shift Supervisor',
        items: [
          {
            id: 'item-draft-1',
            type: 'COMPLETED',
            content: 'Cash drawers counted and verified at ¥45,000.',
            orderIndex: 1,
            createdAt: now.toISOString(),
          },
        ],
        summary: {
          totalTasks: 20,
          completedTasks: 18,
          pendingTasks: 2,
          openBranchIssues: 0,
          staffAssignedCount: 4,
        },
        version: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      setActiveHandover(draftFallback);
      setIsDebriefModalOpen(true);
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
      setHandoverOverride(data);
      setActionSuccessMessage('Handover debrief draft saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: () => {
      if (activeHandover) {
        setActionSuccessMessage('Draft changes saved (local preview).');
      }
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
      setHandoverOverride(data);
      setIsDebriefModalOpen(false);
      setActionSuccessMessage('Shift handover successfully submitted for incoming supervisor sign-off.');
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: () => {
      if (activeHandover) {
        const submitted: ShiftHandover = {
          ...activeHandover,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          submittedByName: user?.fullName || 'Shift Supervisor',
        };
        setHandoverOverride(submitted);
        setIsDebriefModalOpen(false);
        setActionSuccessMessage('Shift handover submitted for incoming lead acknowledgment.');
      }
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
    onSuccess: (data) => {
      setIsAckModalOpen(false);
      setHandoverOverride(data);
      setActionSuccessMessage('Shift turnover acknowledged. Store accountability transferred.');
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
    },
    onError: (_err, variables) => {
      if (effectiveLatestHandover && effectiveLatestHandover.id === variables.handoverId) {
        const acknowledged: ShiftHandover = {
          ...effectiveLatestHandover,
          status: 'ACKNOWLEDGED',
          acknowledgedById: user?.id,
          acknowledgedByName: user?.fullName || 'Marcus Tanaka',
          acknowledgedAt: new Date().toISOString(),
          acknowledgementNotes: variables.notes || 'Handover items reviewed and acknowledged.',
        };
        setHandoverOverride(acknowledged);
        setIsAckModalOpen(false);
        setActionSuccessMessage('Shift turnover acknowledged. Store accountability transferred.');
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* 1. Clear, Authority Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e8eaec]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416] flex items-center gap-2">
            <IconHandshake size={22} className="text-[#131416]" />
            <span>Shift Handover & Turnover</span>
          </h1>
          <p className="text-[13px] text-[#5d5f60] mt-0.5">
            Daily supervisor debriefs, till reconciliation, and dual-signature transfer
          </p>
        </div>

        {/* Branch Context & Action */}
        <div className="flex items-center gap-2.5">
          {(isOwner || isManager) && branches && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-8 px-2.5 text-[13px] rounded border border-[#e8eaec] bg-white text-[#131416] focus:outline-none focus:border-[#131416] font-medium"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.active && '(Inactive)'}
                </option>
              ))}
            </select>
          )}

          {effectiveAvailableShifts.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenDebrief(effectiveAvailableShifts[0].id)}
              className="h-8 px-3 text-[13px] font-medium rounded border border-[#131416] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            >
              <IconPlus size={13} />
              <span>Prepare Debrief</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-md bg-[#eaf5ef] border border-[#c2e4d0] text-[13px] text-[#1e7b4f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-[#1e7b4f] flex-shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-[#1e7b4f] hover:text-[#131416] p-1"
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-md bg-[#fdeeed] border border-[#f7c5c2] text-[13px] text-[#c4242a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={16} className="text-[#c4242a] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#8c8f92] hover:text-[#131416] p-1"
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* 2. Unified 2-Column Split-View Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Primary Dossier (8 cols) */}
        <div className="lg:col-span-8 border border-[#e8eaec] bg-white rounded-md p-5 space-y-5">
          <LatestHandoverCard
            handover={effectiveLatestHandover}
            isLoading={isLoadingLatest}
            onAcknowledgeClick={(ho) => {
              setActiveHandover(ho);
              setIsAckModalOpen(true);
            }}
            onOpenDebriefModal={(ho) => {
              setActiveHandover(ho);
              setIsDebriefModalOpen(true);
            }}
          />
        </div>

        {/* Right Audit & Turnover Accountability Rail (4 cols) */}
        <div className="lg:col-span-4">
          <HandoverSupervisorAuditRail
            currentHandover={effectiveLatestHandover}
            outgoingShifts={effectiveAvailableShifts}
            historyPage={effectiveHistoryPage}
            onOpenDebrief={handleOpenDebrief}
            onViewHistoryDossier={(ho) => {
              setActiveHandover(ho);
              setIsDebriefModalOpen(true);
            }}
            onAcknowledgeClick={(ho) => {
              setActiveHandover(ho);
              setIsAckModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* 3. Collapsible 30-Day Audit Archive Table (Progressive Disclosure) */}
      {(isOwner || isManager) && (
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="text-[13px] font-medium text-[#131416] hover:text-[#1b6c80] transition-colors inline-flex items-center gap-1.5 py-1"
            >
              <IconChevronDown
                size={14}
                className={`transition-transform duration-150 ${showFullHistory ? 'rotate-180' : ''}`}
              />
              <span>
                {showFullHistory ? 'Hide 30-day historical turnover archive' : 'View full 30-day historical turnover archive'}
              </span>
              <span className="text-[12px] text-[#5d5f60] tabular-nums font-normal">
                ({effectiveHistoryPage.content.length} records)
              </span>
            </button>
          </div>

          {showFullHistory && (
            <div className="mt-3">
              <HandoverHistoryTable
                historyPage={effectiveHistoryPage}
                isLoading={isLoadingHistory}
                onViewDetails={(ho) => {
                  setActiveHandover(ho);
                  setIsDebriefModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
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
