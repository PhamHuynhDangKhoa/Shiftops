import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ShiftHandover,
  HandoverItemType,
  UpdateHandoverRequest,
  AcknowledgeHandoverRequest,
  Branch,
  Shift,
  Issue,
  ApiResponse,
  PagedResponse,
} from '../lib/types';
import { Card, Badge, Button, Input, Modal } from '../components/ui';

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

  // Form states for Debrief
  const [debriefNotes, setDebriefNotes] = useState('');
  const [debriefItems, setDebriefItems] = useState<
    { type: HandoverItemType; content: string; issueId?: string; orderIndex: number }[]
  >([]);
  const [newItemType, setNewItemType] = useState<HandoverItemType>('COMPLETED');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemIssueId, setNewItemIssueId] = useState('');
  const [ackNotes, setAckNotes] = useState('');
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

  React.useEffect(() => {
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
      const ho = res.data.data;
      setActiveHandover(ho);
      setDebriefNotes(ho.notes || '');
      setDebriefItems(
        ho.items.map((it) => ({
          type: it.type,
          content: it.content,
          issueId: it.issueId,
          orderIndex: it.orderIndex,
        }))
      );
      setIsDebriefModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load handover draft';
      setErrorMessage(message);
    }
  };

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!activeHandover) return;
      const payload: UpdateHandoverRequest = {
        notes: debriefNotes,
        items: debriefItems,
      };
      const res = await api.put<ApiResponse<ShiftHandover>>(`/handovers/${activeHandover.id}`, payload);
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
    mutationFn: async () => {
      if (!activeHandover) return;
      // Save draft first
      await api.put(`/handovers/${activeHandover.id}`, {
        notes: debriefNotes,
        items: debriefItems,
      });
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
    mutationFn: async (handoverId: string) => {
      const payload: AcknowledgeHandoverRequest = { notes: ackNotes };
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${handoverId}/acknowledge`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
      queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
      setIsAckModalOpen(false);
      setAckNotes('');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to acknowledge handover';
      setErrorMessage(message);
    },
  });

  const handleAddItem = () => {
    if (!newItemContent.trim()) return;
    setDebriefItems([
      ...debriefItems,
      {
        type: newItemType,
        content: newItemContent.trim(),
        issueId: newItemIssueId || undefined,
        orderIndex: debriefItems.length + 1,
      },
    ]);
    setNewItemContent('');
    setNewItemIssueId('');
  };

  const handleRemoveItem = (index: number) => {
    setDebriefItems(debriefItems.filter((_, i) => i !== index));
  };

  const getItemBadgeVariant = (type: HandoverItemType): 'success' | 'warning' | 'urgent' | 'brand' | 'neutral' => {
    switch (type) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'ISSUE':
        return 'urgent';
      case 'NOTE':
        return 'brand';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span>🤝</span> Shift Handover Operations
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Transfer shift context, log operational debriefs, and prevent operational blindspots.
          </p>
        </div>

        {/* Branch Selector for Owners / Managers */}
        {(isOwner || isManager) && branches && branches.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 1. LATEST BRANCH HANDOVER (INCOMING TEAM VIEW) */}
      <Card className="p-6 md:p-8 border-l-4 border-l-blue-600 shadow-sm bg-gradient-to-r from-white via-white to-blue-50/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Incoming Shift Debrief
              </span>
              {latestHandover && (
                <Badge
                  variant={
                    latestHandover.status === 'ACKNOWLEDGED'
                      ? 'success'
                      : latestHandover.status === 'SUBMITTED'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {latestHandover.status}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {latestHandover ? `Handover: ${latestHandover.shiftName || 'Shift'}` : 'No active handover for branch'}
            </h2>
            {latestHandover && (
              <p className="text-xs text-gray-500 mt-0.5">
                Shift: {new Date(latestHandover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(latestHandover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                Submitted by <strong>{latestHandover.submittedByName || 'Staff'}</strong> at{' '}
                {latestHandover.submittedAt ? new Date(latestHandover.submittedAt).toLocaleTimeString() : 'N/A'}
              </p>
            )}
          </div>

          {latestHandover && latestHandover.status === 'SUBMITTED' && (
            <Button
              variant="primary"
              onClick={() => {
                setActiveHandover(latestHandover);
                setIsAckModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              ✓ Acknowledge Handover
            </Button>
          )}
        </div>

        {isLoadingLatest ? (
          <div className="py-8 text-center text-gray-400">Loading incoming shift handover...</div>
        ) : latestHandover ? (
          <div className="space-y-6">
            {/* Live Derived Operational Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">Total Tasks</span>
                <span className="text-2xl font-black text-blue-900">{latestHandover.summary?.totalTasks ?? 0}</span>
              </div>
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Completed</span>
                <span className="text-2xl font-black text-emerald-900">{latestHandover.summary?.completedTasks ?? 0}</span>
              </div>
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Pending Tasks</span>
                <span className="text-2xl font-black text-amber-900">{latestHandover.summary?.pendingTasks ?? 0}</span>
              </div>
              <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-100">
                <span className="text-xs font-semibold text-red-800 uppercase tracking-wider block">Open Branch Issues</span>
                <span className="text-2xl font-black text-red-900">{latestHandover.summary?.openBranchIssues ?? 0}</span>
              </div>
            </div>

            {/* Outgoing Notes */}
            {latestHandover.notes && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Operational Notes</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{latestHandover.notes}</p>
              </div>
            )}

            {/* Structured Handover Items */}
            {latestHandover.items && latestHandover.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Structured Items</h4>
                <div className="space-y-2">
                  {latestHandover.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs flex items-start gap-3"
                    >
                      <Badge variant={getItemBadgeVariant(it.type)}>{it.type}</Badge>
                      <div className="flex-1 text-sm text-gray-900">
                        {it.content}
                        {it.issueTitle && (
                          <span className="block text-xs text-red-600 mt-0.5 font-medium">
                            Linked Issue: {it.issueTitle} ({it.issueStatus})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledgement Status Info */}
            {latestHandover.status === 'ACKNOWLEDGED' && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <strong>Acknowledged by:</strong> {latestHandover.acknowledgedByName || 'Manager'} at{' '}
                {latestHandover.acknowledgedAt ? new Date(latestHandover.acknowledgedAt).toLocaleString() : 'N/A'}
                {latestHandover.acknowledgementNotes && (
                  <p className="mt-1 text-emerald-800 italic">"{latestHandover.acknowledgementNotes}"</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-500">
            No outgoing handover debriefs have been submitted for this branch yet.
          </div>
        )}
      </Card>

      {/* 2. PREPARE OUTGOING SHIFT HANDOVER (STAFF & ACTIVE SHIFT) */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📝</span> Outgoing Shift Debrief
            </h2>
            <p className="text-sm text-gray-500">
              Prepare, update, and finalize the operational debrief for your current or completed shift.
            </p>
          </div>
        </div>

        {availableShifts && availableShifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-4 bg-gray-50 hover:bg-blue-50/40 rounded-xl border border-gray-200 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">{shift.branchName}</span>
                    <Badge variant={shift.status === 'PUBLISHED' ? 'brand' : 'neutral'}>{shift.status}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{shift.name || 'Shift'}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(shift.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} -{' '}
                    {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {shift.assignments.length} Staff Assigned: {shift.assignments.map((a) => a.userName).join(', ')}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenDebrief(shift.id)}
                    className="text-xs font-bold"
                  >
                    Manage Handover Debrief
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent or active shifts available to debrief.</p>
        )}
      </Card>

      {/* 3. HISTORICAL HANDOVERS ARCHIVE (FOR MANAGERS & OWNERS) */}
      {(isOwner || isManager) && (
        <Card className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📚</span> Handover Debrief History
          </h2>
          {isLoadingHistory ? (
            <div className="py-8 text-center text-gray-400">Loading history...</div>
          ) : historyPage && historyPage.content.length > 0 ? (
            <div className="divide-y divide-gray-100 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="py-3 px-4">Shift & Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tasks</th>
                    <th className="py-3 px-4">Submitted By</th>
                    <th className="py-3 px-4">Acknowledged By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyPage.content.map((ho) => (
                    <tr key={ho.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {ho.shiftName || 'Shift'}
                        <span className="block text-xs font-normal text-gray-500">
                          {new Date(ho.shiftStartTime).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            ho.status === 'ACKNOWLEDGED'
                              ? 'success'
                              : ho.status === 'SUBMITTED'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {ho.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {ho.summary ? `${ho.summary.completedTasks}/${ho.summary.totalTasks} done` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {ho.submittedByName || '—'}
                        {ho.submittedAt && (
                          <span className="block text-gray-400">
                            {new Date(ho.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {ho.acknowledgedByName || '—'}
                        {ho.acknowledgedAt && (
                          <span className="block text-gray-400">
                            {new Date(ho.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setActiveHandover(ho);
                            setDebriefNotes(ho.notes || '');
                            setDebriefItems(
                              ho.items.map((it) => ({
                                type: it.type,
                                content: it.content,
                                issueId: it.issueId,
                                orderIndex: it.orderIndex,
                              }))
                            );
                            setIsDebriefModalOpen(true);
                          }}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No historical handovers found for this branch.</p>
          )}
        </Card>
      )}

      {/* DEBRIEF MODAL */}
      <Modal
        isOpen={isDebriefModalOpen}
        onClose={() => setIsDebriefModalOpen(false)}
        title={activeHandover?.status === 'DRAFT' ? 'Prepare Shift Handover Debrief' : 'Shift Handover Details'}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {errorMessage}
            </div>
          )}

          {activeHandover && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900">{activeHandover.shiftName || 'Shift'}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(activeHandover.shiftStartTime).toLocaleString()} -{' '}
                  {new Date(activeHandover.shiftEndTime).toLocaleTimeString()}
                </p>
              </div>
              <Badge
                variant={
                  activeHandover.status === 'ACKNOWLEDGED'
                    ? 'success'
                    : activeHandover.status === 'SUBMITTED'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {activeHandover.status}
              </Badge>
            </div>
          )}

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Debrief Notes
            </label>
            <textarea
              value={debriefNotes}
              onChange={(e) => setDebriefNotes(e.target.value)}
              disabled={activeHandover?.status !== 'DRAFT'}
              rows={3}
              placeholder="Operational updates, inventory low warnings, customer notices..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Handover Items */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Structured Operational Items
            </label>

            {/* Item Builder (Draft only) */}
            {activeHandover?.status === 'DRAFT' && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as HandoverItemType)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs font-bold bg-white"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ISSUE">ISSUE</option>
                    <option value="NOTE">NOTE</option>
                  </select>

                  <div className="sm:col-span-3">
                    <Input
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      placeholder="Add an operational action item or observation..."
                      className="text-xs"
                    />
                  </div>
                </div>

                {newItemType === 'ISSUE' && branchIssues && branchIssues.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Link Branch Issue:</span>
                    <select
                      value={newItemIssueId}
                      onChange={(e) => setNewItemIssueId(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700 flex-1"
                    >
                      <option value="">-- None (Standalone Issue Item) --</option>
                      {branchIssues.map((bi) => (
                        <option key={bi.id} value={bi.id}>
                          [{bi.priority}] {bi.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={!newItemContent.trim()}
                    className="text-xs"
                  >
                    + Add Item
                  </Button>
                </div>
              </div>
            )}

            {/* Items List */}
            {debriefItems.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {debriefItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant={getItemBadgeVariant(it.type)}>{it.type}</Badge>
                      <span className="text-gray-900 text-xs md:text-sm">{it.content}</span>
                    </div>
                    {activeHandover?.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No operational items added yet.</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={() => setIsDebriefModalOpen(false)}>
              Close
            </Button>
            {activeHandover?.status === 'DRAFT' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => saveDraftMutation.mutate()}
                  isLoading={saveDraftMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (window.confirm('Submit handover? Once submitted, it cannot be modified.')) {
                      submitMutation.mutate();
                    }
                  }}
                  isLoading={submitMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Submit Handover
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* ACKNOWLEDGE MODAL */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Acknowledge Shift Handover"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are formally acknowledging receipt of the operational debrief from the previous shift.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Acknowledgement Notes (Optional)
            </label>
            <textarea
              value={ackNotes}
              onChange={(e) => setAckNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Reviewed tasks, continuing unresolved inventory count..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button variant="ghost" onClick={() => setIsAckModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (activeHandover) acknowledgeMutation.mutate(activeHandover.id);
              }}
              isLoading={acknowledgeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Acknowledgement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
