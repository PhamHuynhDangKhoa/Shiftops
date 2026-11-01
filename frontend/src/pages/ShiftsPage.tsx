import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Shift,
  ShiftStatus,
  Branch,
  User,
  ApiResponse,
  PagedResponse,
} from '../lib/types';
import {
  ShiftRosterHeader,
  ShiftRosterTelemetry,
  WeeklyTimelineMatrix,
  ShiftRosterTable,
  ShiftDetailModal,
  CreateShiftModal,
  AssignStaffModal,
  getWeekDays,
  generateFallbackWeekShifts,
} from '../components/shifts';

export const ShiftsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    user?.primaryBranchId || ''
  );

  // Week Reference Date (Default to current week)
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  const startDateIso = useMemo(() => {
    const d = new Date(weekDays[0]!.date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [weekDays]);

  const endDateIso = useMemo(() => {
    const d = new Date(weekDays[weekDays.length - 1]!.date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [weekDays]);

  // View state
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'TABLE'>('TIMELINE');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'DRAFT' | 'PUBLISHED' | 'COMPLETED'
  >('ALL');

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assigningShift, setAssigningShift] = useState<Shift | null>(null);
  const [inspectingShift, setInspectingShift] = useState<Shift | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Branches
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: !isStaff,
  });

  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) setSelectedBranchId(active.id);
    }
  }, [branches, selectedBranchId]);

  // Fetch Staff Shifts (Staff view)
  const { data: myShifts } = useQuery<Shift[]>({
    queryKey: ['my-shifts', startDateIso, endDateIso],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
        params: {
          startDate: startDateIso,
          endDate: endDateIso,
        },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Fetch Branch Shifts (Manager / Owner view)
  const { data: branchShifts } = useQuery<Shift[]>({
    queryKey: ['branch-shifts', selectedBranchId, startDateIso, endDateIso],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<Shift[]>>(
        `/branches/${selectedBranchId}/shifts`,
        {
          params: {
            startDate: startDateIso,
            endDate: endDateIso,
          },
        }
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Fetch Staff Directory for Assignment
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

  // Fallback Shifts for Demo / Offline development
  const fallbackShifts = useMemo(
    () => generateFallbackWeekShifts(weekDays),
    [weekDays]
  );

  const activeRawShifts = useMemo(() => {
    const queried = isStaff ? myShifts : branchShifts;
    if (queried && queried.length > 0) return queried;
    return fallbackShifts;
  }, [isStaff, myShifts, branchShifts, fallbackShifts]);

  // Filter shifts by status tab
  const filteredShifts = useMemo(() => {
    if (statusFilter === 'ALL') return activeRawShifts;
    return activeRawShifts.filter((s) => s.status === statusFilter);
  }, [activeRawShifts, statusFilter]);

  // Navigation handlers
  const handlePrevWeek = () => {
    setReferenceDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setReferenceDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleResetThisWeek = () => {
    setReferenceDate(new Date());
  };

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => {
      const res = await api.post<ApiResponse<Shift>>(
        `/branches/${selectedBranchId}/shifts`,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
      setIsCreateOpen(false);
      setFormError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{
        message?: string;
        error?: { message?: string };
      }>;
      const message =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        'Failed to create shift';
      setFormError(message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      shiftId,
      status,
    }: {
      shiftId: string;
      status: ShiftStatus;
    }) => {
      const res = await api.patch<ApiResponse<Shift>>(
        `/shifts/${shiftId}/status`,
        { status }
      );
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

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      await api.patch<ApiResponse<Shift>>(`/shifts/${shiftId}/status`, {
        status: 'CANCELLED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || 'Failed to cancel shift');
    },
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({
      shiftId,
      userId,
    }: {
      shiftId: string;
      userId: string;
    }) => {
      const res = await api.post<ApiResponse<Shift>>(
        `/shifts/${shiftId}/assignments`,
        { userId }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
      setAssigningShift(null);
      setAssignError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{
        message?: string;
        error?: { code?: string };
      }>;
      const detail =
        axiosErr.response?.data?.error?.code === 'SHIFT_OVERLAP_CONFLICT'
          ? 'Schedule Conflict: This staff member already has an overlapping shift.'
          : axiosErr.response?.data?.message || 'Failed to assign staff';
      setAssignError(detail);
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async ({
      shiftId,
      userId,
    }: {
      shiftId: string;
      userId: string;
    }) => {
      await api.delete(`/shifts/${shiftId}/assignments/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-shifts'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(axiosErr.response?.data?.message || 'Failed to remove assignment');
    },
  });

  const countDraft = activeRawShifts.filter((s) => s.status === 'DRAFT').length;
  const countPublished = activeRawShifts.filter(
    (s) => s.status === 'PUBLISHED'
  ).length;
  const countCompleted = activeRawShifts.filter(
    (s) => s.status === 'COMPLETED'
  ).length;

  return (
    <div className="space-y-5 text-[#131416]">
      {/* 1. Header & Week Controls */}
      <ShiftRosterHeader
        isStaff={isStaff}
        isOwner={isOwner}
        isManager={isManager}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        weekDays={weekDays}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onResetThisWeek={handleResetThisWeek}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => {
          setFormError(null);
          setIsCreateOpen(true);
        }}
      />

      {/* 2. Roster Telemetry Strip (4 Cells) */}
      <ShiftRosterTelemetry
        shifts={activeRawShifts}
        totalStaffCount={branchStaff?.length || 8}
      />

      {/* 3. Underline Filter Tabs on 1px Rule */}
      <div className="flex items-center gap-4 border-b border-[#f0f1f2] text-[13px] font-medium text-[#5d5f60]">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            statusFilter === 'ALL'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          All Shifts ({activeRawShifts.length})
          {statusFilter === 'ALL' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('DRAFT')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            statusFilter === 'DRAFT'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Draft ({countDraft})
          {statusFilter === 'DRAFT' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PUBLISHED')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            statusFilter === 'PUBLISHED'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Published ({countPublished})
          {statusFilter === 'PUBLISHED' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            statusFilter === 'COMPLETED'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Completed ({countCompleted})
          {statusFilter === 'COMPLETED' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>
      </div>

      {/* 4. Main View Display: Timeline Matrix or Roster Table */}
      {viewMode === 'TIMELINE' ? (
        <WeeklyTimelineMatrix
          weekDays={weekDays}
          shifts={filteredShifts}
          isStaff={isStaff}
          onSelectShift={(shift) => setInspectingShift(shift)}
          onQuickCreateShift={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
        />
      ) : (
        <ShiftRosterTable
          shifts={filteredShifts}
          isStaff={isStaff}
          onAssignClick={(s) => {
            setAssigningShift(s);
            setAssignError(null);
          }}
          onRemoveAssignment={(shiftId, userId) =>
            removeAssignmentMutation.mutate({ shiftId, userId })
          }
          onUpdateStatus={(shiftId, status) =>
            updateStatusMutation.mutate({ shiftId, status })
          }
          onDeleteShift={(shiftId) => deleteShiftMutation.mutate(shiftId)}
        />
      )}

      {/* 5. Modals */}
      <ShiftDetailModal
        shift={inspectingShift}
        isStaff={isStaff}
        onClose={() => setInspectingShift(null)}
        onAssignClick={(s) => {
          setAssigningShift(s);
          setAssignError(null);
        }}
        onRemoveAssignment={(shiftId, userId) =>
          removeAssignmentMutation.mutate({ shiftId, userId })
        }
        onUpdateStatus={(shiftId, status) =>
          updateStatusMutation.mutate({ shiftId, status })
        }
        onDeleteShift={(shiftId) => deleteShiftMutation.mutate(shiftId)}
      />

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
        onSubmit={(shiftId, userId) =>
          assignStaffMutation.mutate({ shiftId, userId })
        }
        isPending={assignStaffMutation.isPending}
        assignError={assignError}
      />
    </div>
  );
};
