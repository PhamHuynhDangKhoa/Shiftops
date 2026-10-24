import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shift, ShiftStatus, Branch, User, ApiResponse, PagedResponse } from '../lib/types';
import {
  ShiftFilterBar,
  ShiftCard,
  CreateShiftModal,
  AssignStaffModal,
} from '../components/shifts';
import { Card } from '../components/ui/Card';
import { IconCalendar, IconAlertTriangle } from '../components/ui/Icons';

export const ShiftsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  // Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Date range filter defaults to current week
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 14); // Next 2 weeks
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assigningShift, setAssigningShift] = useState<Shift | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Branches for Manager / Owner
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: !isStaff,
  });

  // Auto-select first active branch if none selected
  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) {
        setSelectedBranchId(active.id);
      }
    }
  }, [branches, selectedBranchId]);

  // Fetch Staff Shifts (Staff view: /shifts/my-shifts)
  const {
    data: myShifts,
    isLoading: isLoadingMyShifts,
    error: myShiftsError,
  } = useQuery<Shift[]>({
    queryKey: ['my-shifts', startDate, endDate],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Fetch Branch Shifts (Owner / Manager view: /branches/{branchId}/shifts)
  const {
    data: branchShifts,
    isLoading: isLoadingBranchShifts,
    error: branchShiftsError,
  } = useQuery<Shift[]>({
    queryKey: ['branch-shifts', selectedBranchId, startDate, endDate],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<Shift[]>>(`/branches/${selectedBranchId}/shifts`, {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        },
      });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Fetch Staff for selected branch to populate Assign modal
  const { data: branchStaff } = useQuery<User[]>({
    queryKey: ['branch-staff', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<PagedResponse<User>>>('/users', {
        params: { branchId: selectedBranchId, size: 50 },
      });
      return res.data.data.content;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Create Shift Mutation
  const createShiftMutation = useMutation({
    mutationFn: async (payload: { name?: string; startTime: string; endTime: string; notes?: string }) => {
      const res = await api.post<ApiResponse<Shift>>(`/branches/${selectedBranchId}/shifts`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
      setIsCreateOpen(false);
      setFormError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const message = axiosErr.response?.data?.message || axiosErr.message || 'Failed to create shift';
      setFormError(message);
    },
  });

  // Update Shift Status Mutation (Publish / Complete / Cancel / Revert)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ shiftId, status }: { shiftId: string; status: ShiftStatus }) => {
      const res = await api.patch<ApiResponse<Shift>>(`/shifts/${shiftId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || 'Failed to update shift status');
    },
  });

  // Delete Shift Mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await api.delete(`/shifts/${shiftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || 'Failed to delete shift');
    },
  });

  // Assign Staff Mutation
  const assignStaffMutation = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      const res = await api.post<ApiResponse<Shift>>(`/shifts/${shiftId}/assignments`, { userId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
      setAssigningShift(null);
      setAssignError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { code?: string } }>;
      const detail =
        axiosErr.response?.data?.error?.code === 'SHIFT_OVERLAP_CONFLICT'
          ? 'Schedule Conflict: This staff member already has an overlapping shift assignment.'
          : axiosErr.response?.data?.message || 'Failed to assign staff';
      setAssignError(detail);
    },
  });

  // Remove Assignment Mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      await api.delete(`/shifts/${shiftId}/assignments/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || 'Failed to remove staff assignment');
    },
  });

  const activeShifts = isStaff ? myShifts : branchShifts;
  const isLoading = isStaff ? isLoadingMyShifts : isLoadingBranchShifts;
  const error = isStaff ? myShiftsError : branchShiftsError;

  return (
    <div className="space-y-6">
      {/* Shift Filter & Action Bar */}
      <ShiftFilterBar
        isStaff={isStaff}
        isOwner={isOwner}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(val) => {
          const d = new Date(val);
          d.setHours(0, 0, 0, 0);
          setStartDate(d.toISOString());
        }}
        onEndDateChange={(val) => {
          const d = new Date(val);
          d.setHours(23, 59, 59, 999);
          setEndDate(d.toISOString());
        }}
        onCreateClick={() => {
          setFormError(null);
          setIsCreateOpen(true);
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-[#11141a] animate-pulse border border-[#262c38]" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3.5 rounded-sm bg-[#ff1744]/10 border border-[#ff1744]/30 text-xs font-mono text-[#ff335c] flex items-center gap-2">
          <IconAlertTriangle size={15} className="text-[#ff1744] flex-shrink-0" />
          <span>Failed to load shift rosters. Please verify connectivity.</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && activeShifts && activeShifts.length === 0 && (
        <Card className="py-12 text-center text-[#8a94a6] border border-[#262c38] bg-[#11141a]" chamfer>
          <div className="w-9 h-9 bg-[#181c24] border border-[#262c38] flex items-center justify-center text-[#8a94a6] mx-auto mb-2.5">
            <IconCalendar size={18} />
          </div>
          <p className="font-bold text-sm text-white font-mono uppercase tracking-wider">No shifts scheduled</p>
          <p className="text-xs text-[#8a94a6] mt-1 font-mono">
            {isStaff
              ? 'You do not have any published shifts scheduled for this period.'
              : 'Create a new shift to start scheduling staff rosters.'}
          </p>
        </Card>
      )}

      {/* Shifts Grid */}
      {!isLoading && !error && activeShifts && activeShifts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              isStaff={isStaff}
              onAssignClick={(s) => {
                setAssigningShift(s);
                setAssignError(null);
              }}
              onRemoveAssignment={(shiftId, userId) => removeAssignmentMutation.mutate({ shiftId, userId })}
              onUpdateStatus={(shiftId, status) => updateStatusMutation.mutate({ shiftId, status })}
              onDeleteShift={(shiftId) => deleteShiftMutation.mutate(shiftId)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateShiftModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(payload) => createShiftMutation.mutate(payload)}
        isPending={createShiftMutation.isPending}
        formError={formError}
      />

      <AssignStaffModal
        shift={assigningShift}
        branchStaff={branchStaff}
        onClose={() => setAssigningShift(null)}
        onSubmit={(shiftId, userId) => assignStaffMutation.mutate({ shiftId, userId })}
        isPending={assignStaffMutation.isPending}
        assignError={assignError}
      />
    </div>
  );
};
