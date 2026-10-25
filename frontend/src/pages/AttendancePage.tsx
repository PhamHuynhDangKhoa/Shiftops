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
import { Card } from '../components/ui/Card';
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
        text: `Check-in recorded successfully. Status: ${data.data.status}${data.data.late ? ' (Late)' : ''}`,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <IconClock size={22} className="text-zinc-700" />
            <span>Attendance & Punch Log</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isStaff
              ? 'Clock in or out for your shifts and view your punctuality history.'
              : 'Monitor real-time floor attendance, punctuality, and staff coverage.'}
          </p>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between shadow-2xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <IconCheck size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <IconAlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
          >
            <IconClose size={14} />
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

          <Card className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">
                Personal Attendance History
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5d5f60] font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                />
                <span className="text-[#5d5f60] font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                />
              </div>
            </div>

            <AttendanceTable
              records={myAttendanceList}
              isLoading={isLoadingMyAttendance}
              showStaffColumn={false}
            />
          </Card>
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

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-zinc-900">
              Staff Attendance Records
            </h2>

            <AttendanceTable
              records={branchAttendanceList}
              isLoading={isLoadingBranchAttendance}
              showStaffColumn={true}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
