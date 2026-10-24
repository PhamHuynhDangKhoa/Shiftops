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

  // Branch Staff query (for Manager/Owner issue assignment)
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
  } = useQuery<PagedResponse<IssueSummary>>({
    queryKey: ['branch-issues', selectedBranchId, statusFilter, categoryFilter, priorityFilter],
    queryFn: async () => {
      if (!selectedBranchId) return { content: [], totalElements: 0, totalPages: 0, size: 50, page: 0, last: true };
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

  // Issue Detail Query
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
      const targetBranch = isStaff ? (user?.primaryBranchId || reportBranchId) : reportBranchId;
      if (!targetBranch) throw new Error('Branch required');

      const formData = new FormData();
      formData.append('title', reportTitle.trim());
      formData.append('description', reportDescription.trim());
      formData.append('category', reportCategory);
      formData.append('priority', reportPriority);
      if (reportFile) {
        formData.append('attachment', reportFile);
      }

      const res = await api.post<ApiResponse<Issue>>(`/branches/${targetBranch}/issues`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Incident reported successfully' });
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
      setReportCategory('EQUIPMENT');
      setReportPriority('NORMAL');
      setReportFile(null);
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to report issue';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Assign Issue
  const assignIssueMutation = useMutation({
    mutationFn: async ({ issueId, userId }: { issueId: string; userId: string }) => {
      const res = await api.patch<ApiResponse<Issue>>(`/issues/${issueId}/assign`, { userId });
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Issue assigned successfully' });
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
    mutationFn: async ({ issueId, status, comment }: { issueId: string; status: IssueStatus; comment?: string }) => {
      const res = await api.patch<ApiResponse<Issue>>(`/issues/${issueId}/status`, { status, comment });
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Incident status updated' });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#262c38]">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
            <IconAlertTriangle size={20} className="text-[#ff1744]" />
            <span>INCIDENT LOG & THREAT TRIAGE</span>
          </h1>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            {isStaff
              ? 'Report equipment breakdowns, safety hazards, and track triage progress'
              : 'Monitor sector hazards, assign personnel, and verify resolution ledgers'}
          </p>
        </div>

        <Button
          variant="danger"
          size="md"
          onClick={() => {
            setReportBranchId(isStaff ? user?.primaryBranchId || '' : selectedBranchId);
            setShowReportModal(true);
          }}
          className="gap-2 shadow-[0_0_15px_rgba(255,23,68,0.3)]"
        >
          <IconAlertTriangle size={15} />
          <span>[ REPORT INCIDENT ]</span>
        </Button>
      </div>

      {/* Alert banner */}
      {alert && (
        <div
          className={`p-3.5 rounded-sm text-xs font-mono border flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40 shadow-[0_0_10px_rgba(0,230,118,0.15)]'
              : 'bg-[#ff1744]/10 text-[#ff335c] border-[#ff1744]/40 shadow-[0_0_10px_rgba(255,23,68,0.15)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <IconCheck size={14} className="text-[#00e676]" />
            ) : (
              <IconAlertTriangle size={14} className="text-[#ff1744]" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-[#606c80] hover:text-white cursor-pointer"
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

      {/* MANAGER / OWNER: Branch Selector and Metrics */}
      {!isStaff && (
        <div className="space-y-4">
          {isOwner && branches && branches.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <label className="text-[#606c80] font-bold text-[10px] uppercase">SECTOR:</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <div className="py-12 text-center text-xs font-mono text-zinc-400">
              Loading incident reports...
            </div>
          ) : !myIssues || myIssues.length === 0 ? (
            <Card className="py-12 text-center text-zinc-500">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
                <IconAlertTriangle size={16} />
              </div>
              <p className="text-xs font-medium text-zinc-800">No active incidents</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                You haven't reported any issues and none are assigned to you.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
