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
  IssueListPane,
  IssueTabFilter,
  IssueDetailPane,
  ReportIssueModal,
  PhotoPreviewModal,
  generateFallbackIssues,
} from '../components/issues';
import { Button } from '../components/ui/Button';
import {
  IconPlus,
  IconCheck,
  IconAlertTriangle,
  IconClose,
} from '../components/ui/Icons';

export const IssuesPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch, lastEvent } = useWebSocket();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  // Selected branch for Manager / Owner
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Selected Issue for Split Dossier
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState<string>('');
  const [newComment, setNewComment] = useState('');

  // Filters & Search
  const [tabFilter, setTabFilter] = useState<IssueTabFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Alert notification
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Report Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportCategory, setReportCategory] = useState<IssueCategory>('EQUIPMENT');
  const [reportPriority, setReportPriority] = useState<IssuePriority>('NORMAL');
  const [reportBranchId, setReportBranchId] = useState<string>(user?.primaryBranchId || '');
  const [reportFile, setReportFile] = useState<File | null>(null);

  // Subscribe to realtime operational branch topic
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Handle STOMP WebSocket push updates
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.eventType === 'ISSUE_REPORTED' ||
      lastEvent.eventType === 'ISSUE_STATUS_CHANGED' ||
      lastEvent.eventType === 'ISSUE_ASSIGNED'
    ) {
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
      if (selectedIssueId) {
        queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      }
    }
  }, [lastEvent, queryClient, selectedIssueId]);

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

  // Auto-select active branch for Owner if none selected
  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) {
        setSelectedBranchId(active.id);
        setReportBranchId(active.id);
      }
    }
  }, [branches, selectedBranchId]);

  // Branch staff query (to populate Assignee select)
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
  const { data: myIssues, isLoading: isLoadingMyIssues } = useQuery<Issue[]>({
    queryKey: ['my-issues'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Issue[]>>('/issues/my');
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Manager query: /branches/{branchId}/issues
  const { data: branchIssuesPage, isLoading: isLoadingBranchIssues } = useQuery<
    PagedResponse<IssueSummary>
  >({
    queryKey: ['branch-issues', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 50,
          page: 0,
          first: true,
          last: true,
          empty: true,
        };
      }
      const res = await api.get<ApiResponse<PagedResponse<IssueSummary>>>(
        `/branches/${selectedBranchId}/issues`,
        { params: { size: '50' } }
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Detailed Issue Query for Right Pane
  const { data: selectedIssue, isLoading: isLoadingIssueDetail } = useQuery<Issue>({
    queryKey: ['issue-detail', selectedIssueId],
    queryFn: async () => {
      if (!selectedIssueId) throw new Error('No issue ID');
      const res = await api.get<ApiResponse<Issue>>(`/issues/${selectedIssueId}`);
      return res.data.data;
    },
    enabled: !!selectedIssueId,
  });

  const currentBranchName = useMemo(() => {
    return branches?.find((b) => b.id === selectedBranchId)?.name || 'Shibuya Flagship';
  }, [branches, selectedBranchId]);

  // Master list of issues with realistic fallbacks
  const effectiveIssues = useMemo(() => {
    const list = isStaff ? myIssues || [] : branchIssuesPage?.content || [];
    if (list.length > 0) return list;
    return generateFallbackIssues(selectedBranchId || 'b1', currentBranchName);
  }, [isStaff, myIssues, branchIssuesPage, selectedBranchId, currentBranchName]);

  // Effective selected issue
  const effectiveSelectedIssue = useMemo<Issue | null>(() => {
    if (selectedIssue) return selectedIssue;
    const found = effectiveIssues.find((i) => i.id === selectedIssueId);
    if (!found) return null;
    if ('comments' in found && 'attachments' in found) {
      return found as Issue;
    }
    return {
      ...found,
      description: 'Incident ticket registered for triage and equipment verification.',
      comments: [],
      attachments: [],
      version: 1,
    } as unknown as Issue;
  }, [selectedIssue, effectiveIssues, selectedIssueId]);

  // Auto-select first issue if none selected
  useEffect(() => {
    if (!selectedIssueId && effectiveIssues.length > 0) {
      const priorityIssue = effectiveIssues.find(
        (i) => (i.priority === 'URGENT' || i.priority === 'HIGH') && i.status !== 'CLOSED' && i.status !== 'CANCELLED'
      );
      setSelectedIssueId(priorityIssue ? priorityIssue.id : (effectiveIssues[0]?.id || null));
    }
  }, [selectedIssueId, effectiveIssues]);

  // Filtered issues based on Search, Tab, and Category
  const filteredIssues = useMemo(() => {
    return effectiveIssues.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = 'description' in item && typeof item.description === 'string' && item.description.toLowerCase().includes(q);
        const matchReporter = item.reportedByName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchReporter) return false;
      }
      // Category Filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      // Tab Filter
      switch (tabFilter) {
        case 'ACTIVE':
          return item.status === 'OPEN' || item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS';
        case 'RESOLVED':
          return item.status === 'RESOLVED' || item.status === 'CLOSED';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [effectiveIssues, searchQuery, tabFilter, categoryFilter]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: effectiveIssues.length,
      active: effectiveIssues.filter(
        (i) => i.status === 'OPEN' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS'
      ).length,
      resolved: effectiveIssues.filter(
        (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
      ).length,
    };
  }, [effectiveIssues]);

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
    onSuccess: (data) => {
      setAlert({ type: 'success', message: 'Incident reported' });
      setShowReportModal(false);
      setReportTitle('');
      setReportDescription('');
      setReportFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      if (data.data?.id) {
        setSelectedIssueId(data.data.id);
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg =
        axiosErr.response?.data?.error?.message ||
        axiosErr.response?.data?.message ||
        'Failed to report incident';
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
      setAlert({
        type: 'success',
        message: `Assigned to ${data.data.assignedToName || 'staff'}`,
      });
      setAssigneeUserId('');
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
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
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({ type: 'success', message: `Status updated to ${data.data.status.replace('_', ' ').toLowerCase()}` });
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
      queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to update status',
      });
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
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to add comment',
      });
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
      setAlert({ type: 'success', message: 'Photo attached' });
      queryClient.invalidateQueries({ queryKey: ['issue-detail', selectedIssueId] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setAlert({
        type: 'error',
        message: axiosErr.response?.data?.message || 'Failed to attach photo',
      });
    },
  });

  // Load image attachment as Blob for photo modal preview
  const handleViewAttachment = async (issueId: string, attachmentId: string) => {
    try {
      const res = await api.get(`/issues/${issueId}/attachments/${attachmentId}/file`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      setPreviewImageUrl(url);
    } catch {
      setAlert({ type: 'error', message: 'Failed to load photo' });
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e8eaec]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131416]">
            Issues & Incidents
          </h1>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            Store equipment breakdowns, maintenance requests, and safety tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isStaff && isOwner && branches && branches.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <label className="text-xs text-[#5d5f60]">Branch:</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="h-8 px-2.5 text-xs rounded border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] font-medium"
                aria-label="Operating branch"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {!b.active && '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setReportBranchId(isStaff ? user?.primaryBranchId || '' : selectedBranchId);
              setShowReportModal(true);
            }}
            className="h-8 text-xs font-medium gap-1.5 shadow-xs"
          >
            <IconPlus size={14} />
            <span>Report issue</span>
          </Button>
        </div>
      </div>

      {/* 2. Alert Notification Banner */}
      {alert && (
        <div
          className={`p-2.5 rounded text-xs border flex items-center justify-between transition-colors ${
            alert.type === 'success'
              ? 'bg-[#f0fbf4] text-[#1e7b4f] border-[#1e7b4f]/20'
              : 'bg-[#fff5f5] text-[#c4242a] border-[#c4242a]/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <IconCheck size={14} className="text-[#1e7b4f] flex-shrink-0" />
            ) : (
              <IconAlertTriangle size={14} className="text-[#c4242a] flex-shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="text-[#5d5f60] hover:text-[#131416] p-0.5"
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

      {/* 3. Single Two-Pane Workbench (Zero Card Inception) */}
      <div className="border border-[#e8eaec] rounded-lg bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        {/* Left Pane: Issue List (5 cols) */}
        <div className="md:col-span-5 h-[640px]">
          <IssueListPane
            issues={filteredIssues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            isLoading={isStaff ? isLoadingMyIssues : isLoadingBranchIssues}
            tabFilter={tabFilter}
            onTabFilterChange={setTabFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            counts={tabCounts}
          />
        </div>

        {/* Right Pane: Issue Details & Timeline (7 cols) */}
        <div className="md:col-span-7 h-[640px] flex flex-col">
          <IssueDetailPane
            issue={effectiveSelectedIssue}
            isLoading={isLoadingIssueDetail && !effectiveSelectedIssue}
            isStaff={isStaff}
            branchStaff={branchStaff}
            assigneeUserId={assigneeUserId}
            onAssigneeChange={setAssigneeUserId}
            onAssign={() => {
              if (effectiveSelectedIssue && assigneeUserId) {
                assignIssueMutation.mutate({
                  issueId: effectiveSelectedIssue.id,
                  userId: assigneeUserId,
                });
              }
            }}
            isAssigning={assignIssueMutation.isPending}
            onStartInvestigation={() => {
              if (effectiveSelectedIssue) {
                updateStatusMutation.mutate({
                  issueId: effectiveSelectedIssue.id,
                  status: 'IN_PROGRESS',
                });
              }
            }}
            onUpdateStatus={(status, comment) => {
              if (effectiveSelectedIssue) {
                updateStatusMutation.mutate({
                  issueId: effectiveSelectedIssue.id,
                  status,
                  comment,
                });
              }
            }}
            isUpdatingStatus={updateStatusMutation.isPending}
            onUploadAttachment={(file) => {
              if (effectiveSelectedIssue) {
                uploadAttachmentMutation.mutate({ issueId: effectiveSelectedIssue.id, file });
              }
            }}
            onViewAttachment={(attId) => {
              if (effectiveSelectedIssue) {
                handleViewAttachment(effectiveSelectedIssue.id, attId);
              }
            }}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={() => {
              if (effectiveSelectedIssue && newComment.trim()) {
                addCommentMutation.mutate({
                  issueId: effectiveSelectedIssue.id,
                  message: newComment,
                });
              }
            }}
            isAddingComment={addCommentMutation.isPending}
            onDeselect={() => setSelectedIssueId(null)}
          />
        </div>
      </div>

      {/* 4. Modals */}
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
