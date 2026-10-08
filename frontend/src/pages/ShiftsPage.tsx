import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shift, ShiftStatus, Branch, User, ApiResponse, PagedResponse } from '../lib/types';

export const ShiftsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  // Branch Selection (defaults to primary branch, or first available branch for OWNER)
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
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Form states for Create Shift
  const [shiftName, setShiftName] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
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

  // Set default branch for Owner if none selected yet
  React.useEffect(() => {
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
      resetCreateForm();
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
      setSelectedStaffId('');
      setAssignError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { code?: string } }>;
      const detail = axiosErr.response?.data?.error?.code === 'SHIFT_OVERLAP_CONFLICT'
        ? '⚠️ Schedule Conflict: This staff member already has an overlapping shift assignment!'
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

  const resetCreateForm = () => {
    setShiftName('');
    setStartDateTime('');
    setEndDateTime('');
    setShiftNotes('');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDateTime || !endDateTime) {
      setFormError('Start time and end time are required.');
      return;
    }

    const start = new Date(startDateTime).toISOString();
    const end = new Date(endDateTime).toISOString();

    if (new Date(start) >= new Date(end)) {
      setFormError('End time must be strictly after start time.');
      return;
    }

    createShiftMutation.mutate({
      name: shiftName.trim() || undefined,
      startTime: start,
      endTime: end,
      notes: shiftNotes.trim() || undefined,
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningShift || !selectedStaffId) return;
    setAssignError(null);
    assignStaffMutation.mutate({ shiftId: assigningShift.id, userId: selectedStaffId });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusBadge = (status: ShiftStatus) => {
    const styles: Record<ShiftStatus, { bg: string; color: string }> = {
      DRAFT: { bg: '#fef3c7', color: '#92400e' },
      PUBLISHED: { bg: '#d1fae5', color: '#065f46' },
      COMPLETED: { bg: '#dbeafe', color: '#1e40af' },
      CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = styles[status] || { bg: '#f3f4f6', color: '#374151' };
    return (
      <span
        style={{
          backgroundColor: s.bg,
          color: s.color,
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    );
  };

  const activeShifts = isStaff ? myShifts : branchShifts;
  const isLoading = isStaff ? isLoadingMyShifts : isLoadingBranchShifts;
  const error = isStaff ? myShiftsError : branchShiftsError;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            {isStaff ? 'My Assigned Shifts' : 'Shift Scheduling'}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {isStaff
              ? 'View your upcoming published shifts and rosters'
              : 'Create, assign, and manage daily and overnight staff schedules'}
          </p>
        </div>

        {!isStaff && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isOwner && branches && branches.length > 0 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={!b.active}>
                    {b.name} {!b.active ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>+</span> Create Shift
            </button>
          </div>
        )}
      </div>

      {/* Date Window Filters */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Date Window:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>From:</label>
          <input
            type="date"
            value={startDate.slice(0, 10)}
            onChange={(e) => {
              const d = new Date(e.target.value);
              d.setHours(0, 0, 0, 0);
              setStartDate(d.toISOString());
            }}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>To:</label>
          <input
            type="date"
            value={endDate.slice(0, 10)}
            onChange={(e) => {
              const d = new Date(e.target.value);
              d.setHours(23, 59, 59, 999);
              setEndDate(d.toISOString());
            }}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>
          Showing shifts between {new Date(startDate).toLocaleDateString()} and {new Date(endDate).toLocaleDateString()}
        </div>
      </div>

      {/* Shifts Content */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Loading shifts...
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          Failed to load shifts. Please try again.
        </div>
      )}

      {!isLoading && !error && activeShifts && activeShifts.length === 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.5rem' }}>No shifts found</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            {isStaff
              ? 'You do not have any published shifts scheduled for this period.'
              : 'Create a new shift to start scheduling staff.'}
          </p>
        </div>
      )}

      {!isLoading && !error && activeShifts && activeShifts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {activeShifts.map((shift) => (
            <div
              key={shift.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                    {shift.name || 'Shift'}
                  </h3>
                  {getStatusBadge(shift.status)}
                </div>

                {/* Branch Name */}
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  📍 {shift.branchName}
                </div>

                {/* Time & Overnight badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                    🕒 {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}
                  </span>
                  {shift.overnight && (
                    <span
                      style={{
                        backgroundColor: '#ede9fe',
                        color: '#6d28d9',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      🌙 Overnight
                    </span>
                  )}
                </div>

                {/* Notes */}
                {shift.notes && (
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', color: '#4b5563', backgroundColor: '#f9fafb', padding: '0.5rem', borderRadius: '4px' }}>
                    💬 {shift.notes}
                  </p>
                )}

                {/* Assigned Staff */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.4rem' }}>
                    Assigned Staff ({shift.assignments.length})
                  </div>
                  {shift.assignments.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>No staff assigned</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {shift.assignments.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '9999px',
                            padding: '0.2rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: '#1f2937' }}>{a.userName}</span>
                          {!isStaff && shift.status === 'DRAFT' && (
                            <button
                              onClick={() => removeAssignmentMutation.mutate({ shiftId: shift.id, userId: a.userId })}
                              title="Remove assignment"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Managers / Owners */}
              {!isStaff && (
                <div
                  style={{
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {shift.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => {
                            setAssigningShift(shift);
                            setSelectedStaffId('');
                            setAssignError(null);
                          }}
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Assign Staff
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ shiftId: shift.id, status: 'PUBLISHED' })}
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Publish
                        </button>
                      </>
                    )}

                    {shift.status === 'PUBLISHED' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ shiftId: shift.id, status: 'DRAFT' })}
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Revert to Draft
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ shiftId: shift.id, status: 'COMPLETED' })}
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Complete
                        </button>
                      </>
                    )}

                    {(shift.status === 'DRAFT' || shift.status === 'PUBLISHED') && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this shift?')) {
                            updateStatusMutation.mutate({ shiftId: shift.id, status: 'CANCELLED' });
                          }
                        }}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {shift.status === 'DRAFT' && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this draft shift permanently?')) {
                          deleteShiftMutation.mutate(shift.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                      }}
                      title="Delete shift"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Shift Modal */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create New Shift</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Shift Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning Shift, Night Shift"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  💡 For overnight shifts crossing midnight, select the next day for the end date.
                </span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Notes / Briefing (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bring keycard, inventory handover..."
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createShiftMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {createShiftMutation.isPending ? 'Creating...' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assigningShift && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Assign Staff to {assigningShift.name || 'Shift'}
              </h2>
              <button
                onClick={() => setAssigningShift(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 1rem' }}>
              Shift: {formatDateTime(assigningShift.startTime)} → {formatDateTime(assigningShift.endTime)}
            </p>

            {assignError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Select Staff Member:
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">-- Choose staff --</option>
                  {branchStaff
                    ?.filter((s) => s.active)
                    ?.map((s) => {
                      const alreadyAssigned = assigningShift.assignments.some((a) => a.userId === s.id);
                      return (
                        <option key={s.id} value={s.id} disabled={alreadyAssigned}>
                          {s.fullName} ({s.email}) {alreadyAssigned ? '— (Already assigned)' : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAssigningShift(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStaffId || assignStaffMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
