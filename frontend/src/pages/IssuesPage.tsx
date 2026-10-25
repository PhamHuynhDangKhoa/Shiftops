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
  PagedResponse,
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
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  IconAlertTriangle,
  IconCheck,
  IconClose,
} from '../components/ui/Icons';

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

  // Branch staff query (to populate Assignee select in Manager Detail Modal)
  const { data: branchStaff } = useQuery<User[]>({
    queryKey: ['branch-staff-issues', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<PagedResponse<User>>>('/users', {
        params: { branchId: selectedBranchId, size: 50 },
      });
      return res.data.data.content;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Staff query: /issues/my
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

  // Manager query: /branches/{branchId}/issues
  const {
    data: branchIssuesPage,
    isLoading: isLoadingBranchIssues,
  } = useQuery<PagedResponse<IssueSummary>>({
    queryKey: ['branch-issues', selectedBranchId, statusFilter, categoryFilter, priorityFilter],
    queryFn: async () => {
      if (!selectedBranchId) return { content: [], totalElements: 0, totalPages: 0, size: 20, page: 0, first: true, last: true, empty: true };
      const params: Record<string, string> = { size: '50' };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      const res = await api.get<ApiResponse<PagedResponse<IssueSummary>>>(`/branches/${selectedBranchId}/issues`, {
        params,
      });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Detailed Issue Query (when opening detail modal)
  const {
    data: selectedIssue,
    isLoading: isLoadingIssueDetail,
  } = useQuery<Issue>({
    queryKey: ['issue-detail', selectedIssueId],
    queryFn: async () => {
      if (!selectedIssueId) throw new Error('No issue ID');
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
      const effectiveBranchId = reportBranchId || user?.primaryBranchId || selectedBranchId;
      if (!effectiveBranchId) throw new Error('Operating branch required');

      const payload = {
        branchId: effectiveBranchId,
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        category: reportCategory,
        priority: reportPriority,
      };

      const res = await api.post<ApiResponse<Issue>>('/issues', payload);
      const created = res.data.data;

      if (reportFile && created?.id) {
        const formData = new FormData();
        formData.append('file', reportFile);
        await api.post(`/issues/${created.id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Incident reported successfully' });
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
      setReportFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to report incident';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Assign Issue
  const assignIssueMutation = useMutation({
    mutationFn: async ({ issueId, userId }: { issueId: string; userId: string }) => {
      const res = await api.patch<ApiResponse<Issue>>(`/issues/${issueId}/assign`, {
        assignedToUserId: userId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: `Incident assigned to ${data.data.assignedToName || 'staff'}` });
      setAssigneeUserId('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({ type: 'error', message: axiosErr.response?.data?.message || 'Failed to assign issue' });
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
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: `Status updated to ${data.data.status}` });
      setStatusActionTarget(null);
      setStatusComment('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({ type: 'error', message: axiosErr.response?.data?.message || 'Failed to update status' });
    },
  });

  // Add Comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ issueId, message }: { issueId: string; message: string }) => {
      const res = await api.post<ApiResponse<Issue>>(`/issues/${issueId}/comments`, { message });
      return res.data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({ type: 'error', message: axiosErr.response?.data?.message || 'Failed to add comment' });
    },
  });

  // Upload Attachment
  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ issueId, file }: { issueId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ApiResponse<Issue>>(`/issues/${issueId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Attachment uploaded' });
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <IconAlertTriangle size={22} className="text-zinc-700" />
            <span>Incident & Issue Tracker</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isStaff
              ? 'Report equipment breakdowns or safety concerns and track resolution progress.'
              : 'Monitor branch incidents, assign staff, and track resolution ledgers.'}
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setReportBranchId(isStaff ? user?.primaryBranchId || '' : selectedBranchId);
            setShowReportModal(true);
          }}
          className="gap-1.5 whitespace-nowrap"
        >
          <IconAlertTriangle size={15} />
          <span>Report Issue</span>
        </Button>
      </div>

      {/* Alert banner */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between shadow-2xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <IconCheck size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <IconAlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* MANAGER / OWNER: Branch Selector and Metrics */}
      {!isStaff && (
        <div className="space-y-4">
          {isOwner && branches && branches.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-[#5d5f60] font-medium text-xs">Branch:</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {!b.active && '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
              Loading incident reports...
            </div>
          ) : !myIssues || myIssues.length === 0 ? (
            <Card className="py-12 text-center text-zinc-500">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2">
                <IconAlertTriangle size={18} />
              </div>
              <p className="text-sm font-semibold text-zinc-800">No active incidents</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                You haven&apos;t reported any issues and none are assigned to you.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* MODALS */}
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

      <IssueDetailModal
        issueId={selectedIssueId}
        onClose={() => {
          setSelectedIssueId(null);
          setStatusActionTarget(null);
        }}
        issue={selectedIssue || null}
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
