import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Attendance,
  AttendanceStatus,
  Branch,
  Shift,
  ApiResponse,
} from '../lib/types';

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
  React.useEffect(() => {
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

  // Helper formatting functions
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusBadge = (status: AttendanceStatus, late: boolean) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
            }}
          >
            🟢 PRESENT
          </span>
        );
      case 'LATE':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#fffbeb',
              color: '#d97706',
              border: '1px solid #fde68a',
            }}
          >
            ⚠️ LATE
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
            }}
          >
            🏁 COMPLETED {late ? '(LATE START)' : ''}
          </span>
        );
      case 'ABSENT':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            }}
          >
            ❌ ABSENT
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
          ⏱️ Attendance & Clocking
        </h1>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
          {isStaff
            ? "Record your shift attendance and view your punctuality history."
            : "Monitor staff clock-in/out records, punctuality, and absences."}
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

      {/* ============================================================== */}
      {/* STAFF VIEW: TODAY'S SHIFT ACTION CARDS & PERSONAL HISTORY      */}
      {/* ============================================================== */}
      {isStaff && (
        <div>
          {/* Active Shift Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem 0' }}>
              📍 Current / Upcoming Shifts
            </h2>

            {isLoadingMyShifts ? (
              <p style={{ color: '#6b7280' }}>Loading your assigned shifts...</p>
            ) : !myShifts || myShifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No shifts assigned within the current window.</p>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Check the Shifts tab to view your complete schedule.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {myShifts.map((shift) => {
                  // Find staff's assignment on this shift
                  const assignment = shift.assignments?.find((a) => a.userId === user?.id);
                  if (!assignment) return null;

                  // Find if an attendance record already exists for this assignment
                  const attendanceRecord = myAttendanceList?.find((att) => att.shiftAssignmentId === assignment.id);

                  const now = new Date();
                  const startTime = new Date(shift.startTime);
                  const endTime = new Date(shift.endTime);
                  const checkInOpenTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 mins early

                  const isTooEarly = now < checkInOpenTime;
                  const isPastEnd = now > endTime;
                  const canCheckIn = !attendanceRecord && !isTooEarly && !isPastEnd;
                  const canCheckOut =
                    attendanceRecord &&
                    (attendanceRecord.status === 'PRESENT' || attendanceRecord.status === 'LATE') &&
                    !attendanceRecord.checkOutAt;

                  return (
                    <div
                      key={shift.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                            {shift.name || 'Scheduled Shift'}
                          </span>
                          {shift.overnight && (
                            <span
                              style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: '#ede9fe',
                                color: '#6d28d9',
                              }}
                            >
                              🌙 Overnight
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                          <div>🏢 <strong>{shift.branchName}</strong></div>
                          <div>📅 {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}</div>
                          {shift.notes && <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{shift.notes}"</div>}
                        </div>

                        {/* Attendance State Badge */}
                        <div style={{ margin: '0.75rem 0' }}>
                          {attendanceRecord ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Status:</span>
                                {getStatusBadge(attendanceRecord.status, attendanceRecord.late)}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                In: {formatTimeOnly(attendanceRecord.checkInAt)}
                                {attendanceRecord.checkOutAt && ` | Out: ${formatTimeOnly(attendanceRecord.checkOutAt)}`}
                              </div>
                            </div>
                          ) : isTooEarly ? (
                            <div style={{ fontSize: '0.85rem', color: '#d97706', backgroundColor: '#fffbeb', padding: '0.5rem', borderRadius: '6px' }}>
                              ⏳ Check-in opens 15 mins before shift ({formatTimeOnly(checkInOpenTime.toISOString())})
                            </div>
                          ) : isPastEnd ? (
                            <div style={{ fontSize: '0.85rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '6px' }}>
                              ⚠️ Shift time has ended.
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.5rem', borderRadius: '6px' }}>
                              ✅ Check-in window is open!
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        {!attendanceRecord && (
                          <button
                            onClick={() => checkInMutation.mutate(assignment.id)}
                            disabled={!canCheckIn || checkInMutation.isPending}
                            style={{
                              flex: 1,
                              padding: '0.65rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: canCheckIn ? '#059669' : '#9ca3af',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              cursor: canCheckIn ? 'pointer' : 'not-allowed',
                              fontSize: '0.9rem',
                            }}
                          >
                            {checkInMutation.isPending ? 'Checking In...' : '🟢 Clock In Now'}
                          </button>
                        )}

                        {canCheckOut && (
                          <button
                            onClick={() => checkOutMutation.mutate(assignment.id)}
                            disabled={checkOutMutation.isPending}
                            style={{
                              flex: 1,
                              padding: '0.65rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                            }}
                          >
                            {checkOutMutation.isPending ? 'Checking Out...' : '🏁 Clock Out'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personal Attendance History Table */}
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

              {/* Date Filters */}
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

            {isLoadingMyAttendance ? (
              <p style={{ color: '#6b7280' }}>Loading records...</p>
            ) : !myAttendanceList || myAttendanceList.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '1.5rem' }}>No attendance records found for this period.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                      <th style={{ padding: '0.75rem' }}>Shift Date & Time</th>
                      <th style={{ padding: '0.75rem' }}>Shift Name</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Check In</th>
                      <th style={{ padding: '0.75rem' }}>Check Out</th>
                      <th style={{ padding: '0.75rem' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAttendanceList.map((att) => (
                      <tr key={att.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div>{formatDateTime(att.shiftStartTime)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>to {formatDateTime(att.shiftEndTime)}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: 600 }}>{att.shiftName || 'Scheduled Shift'}</span>
                          {att.overnight && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#6d28d9' }}>🌙 Overnight</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{getStatusBadge(att.status, att.late)}</td>
                        <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkInAt)}</td>
                        <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkOutAt)}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>{att.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MANAGER / OWNER VIEW: BRANCH MONITORING & ATTENDANCE AUDIT     */}
      {/* ============================================================== */}
      {!isStaff && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {/* Branch Selector (OWNER / Multi-branch) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                  Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    minWidth: '180px',
                  }}
                >
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {!b.active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filters */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => refetchBranchAttendance()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Records</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
                {branchAttendanceList?.length || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>Present (On-Time)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: '0.25rem' }}>
                {branchAttendanceList?.filter((a) => a.status === 'PRESENT' && !a.late).length || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 600 }}>Late Arrivals</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>
                {branchAttendanceList?.filter((a) => a.late).length || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>
                {branchAttendanceList?.filter((a) => a.status === 'COMPLETED').length || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>Absent</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>
                {branchAttendanceList?.filter((a) => a.status === 'ABSENT').length || 0}
              </div>
            </div>
          </div>

          {/* Attendance Table */}
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

            {isLoadingBranchAttendance ? (
              <p style={{ color: '#6b7280' }}>Loading branch attendance...</p>
            ) : !branchAttendanceList || branchAttendanceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p style={{ margin: 0 }}>No attendance records match the current filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                      <th style={{ padding: '0.75rem' }}>Staff Member</th>
                      <th style={{ padding: '0.75rem' }}>Shift Schedule</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Check In</th>
                      <th style={{ padding: '0.75rem' }}>Check Out</th>
                      <th style={{ padding: '0.75rem' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchAttendanceList.map((att) => (
                      <tr key={att.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{att.userName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{att.userEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 500 }}>{att.shiftName || 'Scheduled Shift'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {formatDateTime(att.shiftStartTime)} → {formatDateTime(att.shiftEndTime)}
                          </div>
                          {att.overnight && (
                            <span style={{ fontSize: '0.7rem', color: '#6d28d9', fontWeight: 600 }}>
                              🌙 Overnight
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{getStatusBadge(att.status, att.late)}</td>
                        <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkInAt)}</td>
                        <td style={{ padding: '0.75rem' }}>{formatDateTime(att.checkOutAt)}</td>
                        <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.8rem' }}>
                          {att.notes || (att.late ? 'Checked in after shift start' : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AttendancePage;
