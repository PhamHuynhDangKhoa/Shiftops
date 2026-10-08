import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Branch,
  User,
  Issue,
  IssueSummary,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  ApiResponse,
} from '../lib/types';

export const IssuesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  // State for Branch selection (Manager / Owner)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Alert notification
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusActionTarget, setStatusActionTarget] = useState<IssueStatus | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form state for new Issue
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState<IssueCategory>('EQUIPMENT');
  const [reportPriority, setReportPriority] = useState<IssuePriority>('NORMAL');
  const [reportBranchId, setReportBranchId] = useState<string>(user?.primaryBranchId || '');
  const [reportFile, setReportFile] = useState<File | null>(null);

  // ==========================================
  // Queries
  // ==========================================

  // Branches query (Owner / Manager)
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: !isStaff,
  });

  // Auto-select first branch for Owner if none selected
  React.useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) {
        setSelectedBranchId(active.id);
        setReportBranchId(active.id);
      }
    }
  }, [branches, selectedBranchId]);

  // Branch Staff query (for Manager/Owner issue assignment)
  const { data: branchStaff } = useQuery<User[]>({
    queryKey: ['branch-staff', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<User[]>>(`/branches/${selectedBranchId}/staff`);
      return res.data.data;
    },
    enabled: (!isStaff && !!selectedBranchId) || (isStaff && false),
  });

  // STAFF: "My Issues" query
  const {
    data: myIssues,
    isLoading: isLoadingMyIssues,
  } = useQuery<Issue[]>({
    queryKey: ['my-issues'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Issue[]>>('/issues/my');
      return res.data.data;
    },
    enabled: isStaff,
  });

  // MANAGER / OWNER: Branch Issues query
  const {
    data: branchIssuesPage,
    isLoading: isLoadingBranchIssues,
  } = useQuery<{ content: IssueSummary[]; totalElements: number }>({
    queryKey: ['branch-issues', selectedBranchId, statusFilter, categoryFilter, priorityFilter],
    queryFn: async () => {
      if (!selectedBranchId) return { content: [], totalElements: 0 };
      const params: Record<string, string | number> = {
        size: 50,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const res = await api.get<ApiResponse<{ content: IssueSummary[]; totalElements: number }>>(
        `/branches/${selectedBranchId}/issues`,
        { params }
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Selected Issue Detail query
  const {
    data: selectedIssue,
    isLoading: isLoadingIssueDetail,
  } = useQuery<Issue>({
    queryKey: ['issue-detail', selectedIssueId],
    queryFn: async () => {
      if (!selectedIssueId) throw new Error('No issue selected');
      const res = await api.get<ApiResponse<Issue>>(`/issues/${selectedIssueId}`);
      return res.data.data;
    },
    enabled: !!selectedIssueId,
  });

  // ==========================================
  // Mutations
  // ==========================================

  // Create Issue
  const createIssueMutation = useMutation({
    mutationFn: async () => {
      const targetBranch = isStaff ? user?.primaryBranchId : (reportBranchId || selectedBranchId);
      if (!targetBranch) throw new Error('Branch is required');

      // 1. Create issue
      const res = await api.post<ApiResponse<Issue>>('/issues', {
        branchId: targetBranch,
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        category: reportCategory,
        priority: reportPriority,
      });

      const created = res.data.data;

      // 2. If photo attached, upload it
      if (reportFile && created.id) {
        const formData = new FormData();
        formData.append('file', reportFile);
        await api.post(`/issues/${created.id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      return created;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: `Issue "${data.title}" reported successfully!` });
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
      setReportFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
    },
    onError: (err: any) => {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to report issue',
      });
    },
  });

  // Assign Issue
  const assignIssueMutation = useMutation({
    mutationFn: async ({ issueId, userId }: { issueId: string; userId: string }) => {
      const res = await api.patch<ApiResponse<Issue>>(`/issues/${issueId}/assign`, {
        assignedToUserId: userId,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Issue assigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: any) => {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to assign issue',
      });
    },
  });

  // Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      issueId,
      status,
      comment,
    }: {
      issueId: string;
      status: IssueStatus;
      comment?: string;
    }) => {
      const res = await api.patch<ApiResponse<Issue>>(`/issues/${issueId}/status`, {
        status,
        comment: comment?.trim() || undefined,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: `Issue marked as ${data.status}` });
      setStatusActionTarget(null);
      setStatusComment('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: any) => {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update issue status',
      });
    },
  });

  // Add Comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ issueId, message }: { issueId: string; message: string }) => {
      const res = await api.post(`/issues/${issueId}/comments`, {
        message: message.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
    },
    onError: (err: any) => {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to post comment',
      });
    },
  });

  // Upload Additional Attachment
  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ issueId, file }: { issueId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/issues/${issueId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Attachment uploaded successfully' });
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
    },
    onError: (err: any) => {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to upload attachment',
      });
    },
  });

  // Helper: Fetch image attachment with JWT token as Blob and display preview
  const handleViewAttachment = async (issueId: string, attachmentId: string) => {
    try {
      const res = await api.get(`/issues/${issueId}/attachments/${attachmentId}/file`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      setPreviewImageUrl(url);
    } catch (e: any) {
      setAlert({ type: 'error', message: 'Failed to load attachment image' });
    }
  };

  // Helper styles
  const getPriorityBadgeStyle = (priority: IssuePriority) => {
    switch (priority) {
      case 'URGENT':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' };
      case 'HIGH':
        return { backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' };
      case 'NORMAL':
        return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
      case 'LOW':
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  const getStatusBadgeStyle = (status: IssueStatus) => {
    switch (status) {
      case 'OPEN':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
      case 'ASSIGNED':
        return { backgroundColor: '#ede9fe', color: '#6d28d9' };
      case 'IN_PROGRESS':
        return { backgroundColor: '#fef3c7', color: '#b45309' };
      case 'RESOLVED':
        return { backgroundColor: '#d1fae5', color: '#047857' };
      case 'CLOSED':
        return { backgroundColor: '#f3f4f6', color: '#4b5563' };
      case 'CANCELLED':
        return { backgroundColor: '#e5e7eb', color: '#6b7280' };
    }
  };

  const getCategoryBadgeStyle = (cat: IssueCategory) => {
    switch (cat) {
      case 'EQUIPMENT':
        return { backgroundColor: '#f0fdf4', color: '#166534' };
      case 'MAINTENANCE':
        return { backgroundColor: '#fdf2f8', color: '#9d174d' };
      case 'INVENTORY':
        return { backgroundColor: '#f0f9ff', color: '#075985' };
      case 'SAFETY':
        return { backgroundColor: '#fef2f2', color: '#b91c1c' };
      case 'FACILITY':
        return { backgroundColor: '#fefce8', color: '#854d0e' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // Metrics calculation for Manager/Owner
  const metrics = React.useMemo(() => {
    const list = branchIssuesPage?.content || [];
    const urgentCount = list.filter((i) => i.priority === 'URGENT' && i.status !== 'CLOSED' && i.status !== 'CANCELLED').length;
    const highCount = list.filter((i) => i.priority === 'HIGH' && i.status !== 'CLOSED' && i.status !== 'CANCELLED').length;
    const openAssignedCount = list.filter((i) => i.status === 'OPEN' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length;
    const resolvedCount = list.filter((i) => i.status === 'RESOLVED').length;
    return { urgentCount, highCount, openAssignedCount, resolvedCount };
  }, [branchIssuesPage]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Alert banner */}
      {alert && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            backgroundColor: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: alert.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Operational Issues
          </h1>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {isStaff
              ? 'Report equipment breakdowns, safety hazards, and track resolution.'
              : 'Monitor, assign, and resolve branch hazards, maintenance issues, and equipment failures.'}
          </p>
        </div>

        <button
          onClick={() => {
            setReportBranchId(isStaff ? user?.primaryBranchId || '' : selectedBranchId);
            setShowReportModal(true);
          }}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span> Report Issue
        </button>
      </div>

      {/* MANAGER / OWNER: Branch Selector and Metrics */}
      {!isStaff && (
        <div style={{ marginBottom: '1.5rem' }}>
          {isOwner && branches && branches.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Select Branch:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontWeight: 500,
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.active ? '' : '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Operational Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '1.25rem',
                borderLeft: '4px solid #ef4444',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600 }}>
                🚨 Urgent Issues
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#991b1b', marginTop: '0.25rem' }}>
                {metrics.urgentCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Immediate action required</span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                padding: '1.25rem',
                borderLeft: '4px solid #f97316',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#9a3412', fontWeight: 600 }}>
                High Priority
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9a3412', marginTop: '0.25rem' }}>
                {metrics.highCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#c2410c' }}>Pending resolution</span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dbeafe',
                borderRadius: '8px',
                padding: '1.25rem',
                borderLeft: '4px solid #3b82f6',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                Open & Active
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af', marginTop: '0.25rem' }}>
                {metrics.openAssignedCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>In investigation / progress</span>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                padding: '1.25rem',
                borderLeft: '4px solid #10b981',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
                Resolved
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>
                {metrics.resolvedCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669' }}>Ready for manager closing</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {!isStaff && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              >
                <option value="ALL">All Categories</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INVENTORY">Inventory</option>
                <option value="SAFETY">Safety</option>
                <option value="FACILITY">Facility</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                Priority:
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                }}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Content Area: STAFF VIEW */}
      {isStaff && (
        <div>
          {isLoadingMyIssues ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              Loading reported & assigned issues...
            </div>
          ) : !myIssues || myIssues.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #d1d5db',
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🛡️</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>
                No Issues Reported
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', maxWidth: '400px', margin: '0.5rem auto' }}>
                You have not reported any operational issues and none are currently assigned to you.
              </p>
              <button
                onClick={() => setShowReportModal(true)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Report New Issue
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {myIssues
                .filter((iss) => (statusFilter === 'ALL' ? true : iss.status === statusFilter))
                .map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            ...getPriorityBadgeStyle(issue.priority),
                          }}
                        >
                          {issue.priority}
                        </span>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            ...getCategoryBadgeStyle(issue.category),
                          }}
                        >
                          {issue.category}
                        </span>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(issue.status),
                          }}
                        >
                          {issue.status}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                          {issue.title}
                        </h3>
                      </div>

                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {new Date(issue.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                      {issue.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        borderTop: '1px solid #f3f4f6',
                        paddingTop: '0.75rem',
                        fontSize: '0.85rem',
                        color: '#6b7280',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>
                          Reported by: <strong>{issue.reportedByName}</strong>
                        </span>
                        {issue.assignedToName && (
                          <span>
                            Assigned to: <strong style={{ color: '#2563eb' }}>{issue.assignedToName}</strong>
                          </span>
                        )}
                        <span>💬 {issue.comments?.length || 0} comments</span>
                        <span>📎 {issue.attachments?.length || 0} photos</span>
                      </div>

                      <button
                        onClick={() => setSelectedIssueId(issue.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#f3f4f6',
                          color: '#1f2937',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        View & Update →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Content Area: MANAGER / OWNER VIEW */}
      {!isStaff && (
        <div>
          {isLoadingBranchIssues ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              Loading branch issues...
            </div>
          ) : !branchIssuesPage || branchIssuesPage.content.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #d1d5db',
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>
                All Clear! No Matching Issues Found
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                No active operational issues match the selected filters for this branch.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Title</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Reported By</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Assigned To</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Created</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchIssuesPage.content.map((issue) => (
                    <tr
                      key={issue.id}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                      onClick={() => setSelectedIssueId(issue.id)}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            ...getPriorityBadgeStyle(issue.priority),
                          }}
                        >
                          {issue.priority}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            ...getCategoryBadgeStyle(issue.category),
                          }}
                        >
                          {issue.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111827' }}>
                        {issue.title}
                        {issue.attachmentCount > 0 && (
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                            📎 {issue.attachmentCount}
                          </span>
                        )}
                        {issue.commentCount > 0 && (
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                            💬 {issue.commentCount}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(issue.status),
                          }}
                        >
                          {issue.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{issue.reportedByName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {issue.assignedToName ? (
                          <span style={{ color: '#2563eb', fontWeight: 500 }}>{issue.assignedToName}</span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssueId(issue.id);
                          }}
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REPORT ISSUE MODAL                              */}
      {/* ======================================================== */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                ⚠️ Report Operational Issue
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createIssueMutation.mutate();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {/* Branch Selector for Owner */}
              {isOwner && branches && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Branch:
                  </label>
                  <select
                    value={reportBranchId}
                    onChange={(e) => setReportBranchId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Steam wand leak, POS offline, Freezer warming up"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              {/* Category & Priority grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Category *
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as IssueCategory)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="SAFETY">Safety</option>
                    <option value="FACILITY">Facility</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Priority *
                  </label>
                  <select
                    value={reportPriority}
                    onChange={(e) => setReportPriority(e.target.value as IssuePriority)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">🚨 URGENT (Immediate Hazard/Blocker)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Description & Observations *
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what occurred, any hazard present, equipment model, and immediate actions taken..."
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                  Attach Photo (Optional - max 5MB, JPG/PNG/WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReportFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createIssueMutation.isPending}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {createIssueMutation.isPending ? 'Submitting...' : 'Submit Issue Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ISSUE DETAIL & INVESTIGATION MODAL              */}
      {/* ======================================================== */}
      {selectedIssueId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            {isLoadingIssueDetail || !selectedIssue ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                Loading issue details...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          ...getPriorityBadgeStyle(selectedIssue.priority),
                        }}
                      >
                        {selectedIssue.priority}
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...getCategoryBadgeStyle(selectedIssue.category),
                        }}
                      >
                        {selectedIssue.category}
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...getStatusBadgeStyle(selectedIssue.status),
                        }}
                      >
                        {selectedIssue.status}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        at {selectedIssue.branchName}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                      {selectedIssue.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedIssueId(null);
                      setStatusActionTarget(null);
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Description */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>
                    Description
                  </h4>
                  <div
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #f3f4f6',
                      borderRadius: '6px',
                      padding: '0.85rem',
                      fontSize: '0.9rem',
                      color: '#1f2937',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedIssue.description}
                  </div>
                </div>

                {/* Audit & Responsibility Information */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.85rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Reported By:</span>
                    <strong>{selectedIssue.reportedByName}</strong> ({selectedIssue.reportedByRole})
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(selectedIssue.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Assigned To:</span>
                    {selectedIssue.assignedToName ? (
                      <strong style={{ color: '#2563eb' }}>{selectedIssue.assignedToName}</strong>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </div>

                  {selectedIssue.resolvedAt && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Resolved By:</span>
                      <strong style={{ color: '#059669' }}>{selectedIssue.resolvedByName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(selectedIssue.resolvedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {selectedIssue.closedAt && (
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Closed By:</span>
                      <strong style={{ color: '#4b5563' }}>{selectedIssue.closedByName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(selectedIssue.closedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assignment Controls (Manager/Owner only, and issue not closed/cancelled) */}
                {!isStaff && selectedIssue.status !== 'CLOSED' && selectedIssue.status !== 'CANCELLED' && (
                  <div
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                      Assign Responsibility:
                    </label>
                    <select
                      value={assigneeUserId}
                      onChange={(e) => setAssigneeUserId(e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Choose staff member --</option>
                      {branchStaff?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!assigneeUserId || assignIssueMutation.isPending}
                      onClick={() =>
                        assignIssueMutation.mutate({ issueId: selectedIssue.id, userId: assigneeUserId })
                      }
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {assignIssueMutation.isPending ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                )}

                {/* Workflow Actions */}
                {selectedIssue.status === 'CLOSED' ? (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#4b5563',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>🔒</span> <strong>Closed:</strong> This issue has been verified and permanently closed. No further status changes are permitted.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* IN_PROGRESS action */}
                    {(selectedIssue.status === 'OPEN' || selectedIssue.status === 'ASSIGNED') && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            issueId: selectedIssue.id,
                            status: 'IN_PROGRESS',
                          })
                        }
                        style={{
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Start Investigation / Work
                      </button>
                    )}

                    {/* RESOLVED action */}
                    {selectedIssue.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => setStatusActionTarget('RESOLVED')}
                        style={{
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Mark Resolved
                      </button>
                    )}

                    {/* Manager / Owner closing actions */}
                    {!isStaff && (
                      <>
                        {selectedIssue.status === 'RESOLVED' && (
                          <button
                            onClick={() => setStatusActionTarget('CLOSED')}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#374151',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                            }}
                          >
                            🔒 Verify & Close Issue
                          </button>
                        )}

                        {selectedIssue.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setStatusActionTarget('CANCELLED')}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#9ca3af',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel Issue
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Sub-form for status confirmation with resolution comment */}
                {statusActionTarget && (
                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '1rem',
                      backgroundColor: '#f1f5f9',
                    }}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>
                      Confirm Transition to {statusActionTarget}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Add an optional resolution note or closing comment to record in the audit trail:
                    </p>
                    <input
                      type="text"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="e.g. Replaced faulty gasket; machine tested OK."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        marginBottom: '0.75rem',
                        fontSize: '0.875rem',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setStatusActionTarget(null);
                          setStatusComment('');
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            issueId: selectedIssue.id,
                            status: statusActionTarget,
                            comment: statusComment,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        style={{
                          padding: '0.4rem 0.9rem',
                          backgroundColor:
                            statusActionTarget === 'RESOLVED'
                              ? '#10b981'
                              : statusActionTarget === 'CLOSED'
                              ? '#374151'
                              : '#64748b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Confirm {statusActionTarget}
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                      📎 Photos & Attachments ({selectedIssue.attachments?.length || 0})
                    </h4>

                    {selectedIssue.status !== 'CLOSED' && (
                      <label
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#374151',
                        }}
                      >
                        + Upload Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              uploadAttachmentMutation.mutate({
                                issueId: selectedIssue.id,
                                file: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {selectedIssue.attachments && selectedIssue.attachments.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {selectedIssue.attachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            backgroundColor: '#fafafa',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.originalFileName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {(att.fileSizeBytes / 1024).toFixed(1)} KB • by {att.uploaderName}
                          </span>
                          <button
                            onClick={() => handleViewAttachment(selectedIssue.id, att.id)}
                            style={{
                              marginTop: '0.25rem',
                              padding: '0.3rem 0.6rem',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            View Photo
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      No photo attachments uploaded yet.
                    </div>
                  )}
                </div>

                {/* Comments & Discussion Thread */}
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                    💬 Discussion & Audit Trail ({selectedIssue.comments?.length || 0})
                  </h4>

                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      padding: '0.5rem',
                      border: '1px solid #f3f4f6',
                      borderRadius: '6px',
                      backgroundColor: '#fafafa',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {selectedIssue.comments && selectedIssue.comments.length > 0 ? (
                      selectedIssue.comments.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: c.systemGenerated ? '#f1f5f9' : '#ffffff',
                            border: `1px solid ${c.systemGenerated ? '#e2e8f0' : '#e5e7eb'}`,
                            fontSize: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ color: '#111827' }}>{c.authorName}</strong>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '9999px',
                                  backgroundColor: '#e5e7eb',
                                  color: '#374151',
                                  fontWeight: 600,
                                }}
                              >
                                {c.authorRole}
                              </span>
                              {c.systemGenerated && (
                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                                  (System)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>
                            {c.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', padding: '1rem' }}>
                        No comments yet. Start the conversation below.
                      </div>
                    )}
                  </div>

                  {/* Add comment box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newComment.trim()) return;
                      addCommentMutation.mutate({ issueId: selectedIssue.id, message: newComment });
                    }}
                    style={{ display: 'flex', gap: '0.5rem' }}
                  >
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an update, note, or reply..."
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PHOTO PREVIEW MODAL                             */}
      {/* ======================================================== */}
      {previewImageUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1.5rem',
          }}
          onClick={() => {
            URL.revokeObjectURL(previewImageUrl);
            setPreviewImageUrl(null);
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                URL.revokeObjectURL(previewImageUrl);
                setPreviewImageUrl(null);
              }}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.75rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <img
              src={previewImageUrl}
              alt="Issue evidence"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
