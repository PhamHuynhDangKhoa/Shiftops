import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Attendance,
  Branch,
  Shift,
  ApiResponse,
} from '../lib/types';
import {
  StaffShiftCheckInCard,
  AttendanceMetricsSummary,
  AttendanceFilterBar,
  AttendanceTable,
} from '../components/attendance';
import { IconClock, IconAlertTriangle, IconCheck, IconClose } from '../components/ui/Icons';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';

  // Branch Selection for Manager / Owner
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Subscribe to realtime operational branch topic for owners/managers
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Date range filters (defaults to today's date from 00:00 to 23:59:59)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d.toISOString().slice(0, 10);
  });

  // Status filter for Manager / Owner
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Action message / error state
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch branches for Owner / Manager
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: !isStaff,
  });

  // Auto-select first active branch if none selected for Owner
  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) {
        setSelectedBranchId(active.id);
      }
    }
  }, [branches, selectedBranchId]);

  // STAFF QUERIES
  // 1. Staff's assigned shifts to know which shift to check in to
  const { data: myShifts, isLoading: isLoadingMyShifts } = useQuery<Shift[]>({
    queryKey: ['my-shifts-attendance'],
    queryFn: async () => {
      const start = new Date();
      start.setHours(start.getHours() - 24); // Past 24 hours
      const end = new Date();
      end.setHours(end.getHours() + 24); // Next 24 hours
      const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // 2. Staff's attendance history
  const {
    data: myAttendanceList,
    isLoading: isLoadingMyAttendance,
  } = useQuery<Attendance[]>({
    queryKey: ['my-attendance', startDate, endDate],
    queryFn: async () => {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const res = await api.get<ApiResponse<Attendance[]>>('/attendance/my', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // MANAGER / OWNER QUERY: Branch attendance records
  const {
    data: branchAttendanceList,
    isLoading: isLoadingBranchAttendance,
    refetch: refetchBranchAttendance,
  } = useQuery<Attendance[]>({
    queryKey: ['branch-attendance', selectedBranchId, startDate, endDate, statusFilter],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const params: Record<string, string> = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get<ApiResponse<Attendance[]>>(`/branches/${selectedBranchId}/attendance`, {
        params,
      });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(`/attendance/${assignmentId}/check-in`);
      return res.data;
    },
    onSuccess: (data) => {
      setActionMessage({
        type: 'success',
        text: `Check-in recorded successfully. Status: ${data.data.status}${data.data.late ? ' (LATE)' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts-attendance'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error?.message || 'Check-in failed.';
      setActionMessage({ type: 'error', text: msg });
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(`/attendance/${assignmentId}/check-out`);
      return res.data;
    },
    onSuccess: () => {
      setActionMessage({
        type: 'success',
        text: 'Checked out successfully. Shift completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts-attendance'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error?.message || 'Check-out failed.';
      setActionMessage({ type: 'error', text: msg });
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#262c38]">
        <div>
          <h1 className="text-lg font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
            <IconClock size={18} className="text-[#00f0ff]" />
            <span>Attendance Ledger</span>
          </h1>
          <p className="text-xs font-mono text-[#8a94a6] mt-0.5">
            {isStaff
              ? 'Record shift punches and track your personal punctuality ledger'
              : 'Monitor floor clock-ins, verify punctuality, and track sector coverage'}
          </p>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-sm text-xs font-mono border flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40 shadow-[0_0_10px_rgba(0,230,118,0.15)]'
              : 'bg-[#ff1744]/10 text-[#ff335c] border-[#ff1744]/40 shadow-[0_0_10px_rgba(255,23,68,0.15)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <IconCheck size={14} className="text-[#00e676]" />
            ) : (
              <IconAlertTriangle size={14} className="text-[#ff1744]" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[#606c80] hover:text-white cursor-pointer"
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

      {/* STAFF VIEW */}
      {isStaff && (
        <div className="space-y-6">
          <StaffShiftCheckInCard
            shifts={myShifts}
            attendanceList={myAttendanceList}
            currentUserId={user?.id}
            isLoading={isLoadingMyShifts}
            onCheckIn={(id) => checkInMutation.mutate(id)}
            onCheckOut={(id) => checkOutMutation.mutate(id)}
            isCheckingIn={checkInMutation.isPending}
            isCheckingOut={checkOutMutation.isPending}
          />

          <div className="bg-[#11141a] border border-[#262c38] p-5 clip-chamfer-card">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-[#262c38]">
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                PERSONAL ATTENDANCE LEDGER
              </h2>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#606c80] text-[10px] uppercase font-bold">FROM:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
                />
                <span className="text-[#606c80] text-[10px] uppercase font-bold">TO:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            <AttendanceTable
              records={myAttendanceList}
              isLoading={isLoadingMyAttendance}
              showStaffColumn={false}
            />
          </div>
        </div>
      )}

      {/* MANAGER / OWNER VIEW */}
      {!isStaff && (
        <div className="space-y-5">
          <AttendanceFilterBar
            branches={branches}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={() => refetchBranchAttendance()}
          />

          <AttendanceMetricsSummary records={branchAttendanceList} />

          <div className="bg-[#11141a] border border-[#262c38] p-5 clip-chamfer-card">
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3.5">
              SECTOR OPERATOR ATTENDANCE LEDGER
            </h2>

            <AttendanceTable
              records={branchAttendanceList}
              isLoading={isLoadingBranchAttendance}
              showStaffColumn={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
