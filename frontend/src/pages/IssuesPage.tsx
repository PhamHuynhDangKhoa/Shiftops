import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
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
import {
  IssueSummaryCards,
  IssueFilterBar,
  StaffIssueCard,
  ManagerIssueTable,
  ReportIssueModal,
  PhotoPreviewModal,
  IssueDetailModal,
} from '../components/issues';

export const IssuesPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  // State for Branch selection (Manager / Owner)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Subscribe to realtime operational branch topic for owners/managers
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

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
  useEffect(() => {
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
    enabled: !isStaff && !!selectedBranchId,
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
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || axiosErr.message || 'Failed to report issue',
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
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to assign issue',
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
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to update issue status',
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
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to post comment',
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
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to upload attachment',
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
    } catch {
      setAlert({ type: 'error', message: 'Failed to load attachment image' });
    }
  };

  // Metrics calculation for Manager/Owner
  const metrics = useMemo(() => {
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
          <IssueSummaryCards metrics={metrics} />
        </div>
      )}

      {/* Filter Bar */}
      <IssueFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        isStaff={isStaff}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

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
                  <StaffIssueCard
                    key={issue.id}
                    issue={issue}
                    onSelectIssue={setSelectedIssueId}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Content Area: MANAGER / OWNER VIEW */}
      {!isStaff && (
        <ManagerIssueTable
          issues={branchIssuesPage?.content}
          isLoading={isLoadingBranchIssues}
          onSelectIssue={setSelectedIssueId}
        />
      )}

      {/* MODAL 1: REPORT ISSUE MODAL */}
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        isOwner={isOwner}
        branches={branches}
        branchId={reportBranchId}
        onBranchIdChange={setReportBranchId}
        title={reportTitle}
        onTitleChange={setReportTitle}
        category={reportCategory}
        onCategoryChange={setReportCategory}
        priority={reportPriority}
        onPriorityChange={setReportPriority}
        description={reportDescription}
        onDescriptionChange={setReportDescription}
        onFileChange={setReportFile}
        onSubmit={() => createIssueMutation.mutate()}
        isPending={createIssueMutation.isPending}
      />

      {/* MODAL 2: ISSUE DETAIL & INVESTIGATION MODAL */}
      <IssueDetailModal
        issueId={selectedIssueId}
        onClose={() => {
          setSelectedIssueId(null);
          setStatusActionTarget(null);
        }}
        issue={selectedIssue}
        isLoading={isLoadingIssueDetail}
        isStaff={isStaff}
        branchStaff={branchStaff}
        assigneeUserId={assigneeUserId}
        onAssigneeChange={setAssigneeUserId}
        onAssign={() => {
          if (selectedIssue && assigneeUserId) {
            assignIssueMutation.mutate({ issueId: selectedIssue.id, userId: assigneeUserId });
          }
        }}
        isAssigning={assignIssueMutation.isPending}
        statusActionTarget={statusActionTarget}
        onSetStatusActionTarget={setStatusActionTarget}
        statusComment={statusComment}
        onStatusCommentChange={setStatusComment}
        onConfirmStatusChange={() => {
          if (selectedIssue && statusActionTarget) {
            updateStatusMutation.mutate({
              issueId: selectedIssue.id,
              status: statusActionTarget,
              comment: statusComment,
            });
          }
        }}
        isUpdatingStatus={updateStatusMutation.isPending}
        onStartInvestigation={() => {
          if (selectedIssue) {
            updateStatusMutation.mutate({
              issueId: selectedIssue.id,
              status: 'IN_PROGRESS',
            });
          }
        }}
        onUploadAttachment={(file) => {
          if (selectedIssue) {
            uploadAttachmentMutation.mutate({ issueId: selectedIssue.id, file });
          }
        }}
        onViewAttachment={(attId) => {
          if (selectedIssue) {
            handleViewAttachment(selectedIssue.id, attId);
          }
        }}
        newComment={newComment}
        onNewCommentChange={setNewComment}
        onAddComment={() => {
          if (selectedIssue && newComment.trim()) {
            addCommentMutation.mutate({ issueId: selectedIssue.id, message: newComment });
          }
        }}
        isAddingComment={addCommentMutation.isPending}
      />

      {/* MODAL 3: PHOTO PREVIEW MODAL */}
      <PhotoPreviewModal
        imageUrl={previewImageUrl}
        onClose={() => {
          if (previewImageUrl) {
            URL.revokeObjectURL(previewImageUrl);
            setPreviewImageUrl(null);
          }
        }}
      />
    </div>
  );
};
