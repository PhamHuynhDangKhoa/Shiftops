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
        text: `Check-in recorded successfully! Status: ${data.data.status}${data.data.late ? ' (LATE)' : ''}`,
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
        text: 'Checked out successfully! Shift completed.',
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
          ⏱️ Attendance & Clocking
        </h1>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
          {isStaff
            ? 'Record your shift attendance and view your punctuality history.'
            : 'Monitor staff clock-in/out records, punctuality, and absences.'}
        </p>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* STAFF VIEW */}
      {isStaff && (
        <div>
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

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                📜 My Attendance Records
              </h2>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: '#4b5563' }}>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
                <label style={{ fontSize: '0.85rem', color: '#4b5563' }}>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
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
        <div>
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

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem 0' }}>
              👥 Staff Attendance Records
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
