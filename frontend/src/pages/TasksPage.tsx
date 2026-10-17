import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Branch,
  Shift,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTemplate,
  ApiResponse,
} from '../lib/types';
import {
  TaskCard,
  ManagerTaskTable,
  GenerateTasksModal,
  CreateAdHocTaskModal,
  TaskTemplateModal,
  TaskTemplateList,
  TemplateDraftItem,
} from '../components/tasks';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';

  // State for Branch selection (Manager / Owner)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Subscribe to realtime operational branch topic for owners/managers
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Tab state for Manager / Owner: 'MONITORING' | 'TEMPLATES'
  const [activeTab, setActiveTab] = useState<'MONITORING' | 'TEMPLATES'>('MONITORING');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('ALL');

  // Alert / notification banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedGenerateShiftId, setSelectedGenerateShiftId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [showAdHocModal, setShowAdHocModal] = useState(false);
  const [adHocAssignmentId, setAdHocAssignmentId] = useState<string>('');
  const [adHocTitle, setAdHocTitle] = useState('');
  const [adHocDescription, setAdHocDescription] = useState('');
  const [adHocPriority, setAdHocPriority] = useState<TaskPriority>('NORMAL');

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateItems, setTemplateItems] = useState<TemplateDraftItem[]>([]);

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
      if (active) setSelectedBranchId(active.id);
    }
  }, [branches, selectedBranchId]);

  // STAFF: "My Tasks" query
  const {
    data: myTasks,
    isLoading: isLoadingMyTasks,
    refetch: refetchMyTasks,
  } = useQuery<Task[]>({
    queryKey: ['my-tasks', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get<ApiResponse<Task[]>>('/tasks/my', { params });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // MANAGER / OWNER: Branch Shifts (for shift selector and generation)
  const { data: branchShifts } = useQuery<Shift[]>({
    queryKey: ['branch-shifts-for-tasks', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const res = await api.get<ApiResponse<Shift[]>>(`/branches/${selectedBranchId}/shifts`, {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // MANAGER / OWNER: Branch Tasks query
  const {
    data: branchTasks,
    isLoading: isLoadingBranchTasks,
  } = useQuery<Task[]>({
    queryKey: ['branch-tasks', selectedBranchId, selectedShiftId, statusFilter],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      if (selectedShiftId !== 'ALL') {
        const res = await api.get<ApiResponse<Task[]>>(`/shifts/${selectedShiftId}/tasks`);
        return res.data.data;
      }
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get<ApiResponse<Task[]>>(`/branches/${selectedBranchId}/tasks`, { params });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // MANAGER / OWNER: Branch Templates query
  const {
    data: branchTemplates,
    isLoading: isLoadingTemplates,
  } = useQuery<TaskTemplate[]>({
    queryKey: ['branch-templates', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<TaskTemplate[]>>(`/branches/${selectedBranchId}/task-templates`);
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // ==========================================
  // Mutations
  // ==========================================

  // Update Task Status (Staff & Manager)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: (res) => {
      setAlert({ type: 'success', message: res.message || 'Task status updated' });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to update task status';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Generate Tasks from Template
  const generateTasksMutation = useMutation({
    mutationFn: async ({ shiftId, templateId }: { shiftId: string; templateId: string }) => {
      const res = await api.post<ApiResponse<Task[]>>(`/shifts/${shiftId}/tasks/generate`, { templateId });
      return res.data;
    },
    onSuccess: (res) => {
      setAlert({
        type: 'success',
        message: `Successfully generated ${res.data.length} task(s) for assigned staff!`,
      });
      setShowGenerateModal(false);
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to generate tasks';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Create Ad-Hoc Task
  const createAdHocMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: { title: string; description?: string; priority: TaskPriority };
    }) => {
      const res = await api.post<ApiResponse<Task>>(`/shift-assignments/${assignmentId}/tasks`, data);
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Ad-hoc task created successfully!' });
      setShowAdHocModal(false);
      setAdHocTitle('');
      setAdHocDescription('');
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to create ad-hoc task';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Save (Create or Update) Task Template
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateName,
        description: templateDescription || undefined,
        items: templateItems.map((item, idx) => ({
          title: item.title,
          description: item.description || undefined,
          priority: item.priority,
          orderIndex: idx,
        })),
      };

      if (editingTemplate) {
        const res = await api.put<ApiResponse<TaskTemplate>>(`/task-templates/${editingTemplate.id}`, payload);
        return res.data;
      } else {
        const res = await api.post<ApiResponse<TaskTemplate>>(`/branches/${selectedBranchId}/task-templates`, payload);
        return res.data;
      }
    },
    onSuccess: () => {
      setAlert({
        type: 'success',
        message: editingTemplate ? 'Template updated successfully' : 'Template created successfully',
      });
      setShowTemplateModal(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['branch-templates'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to save template';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Toggle Template Active Status
  const toggleTemplateStatusMutation = useMutation({
    mutationFn: async ({ templateId, active }: { templateId: string; active: boolean }) => {
      const res = await api.patch<ApiResponse<TaskTemplate>>(`/task-templates/${templateId}/status`, { active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-templates'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to toggle status';
      setAlert({ type: 'error', message: msg });
    },
  });

  const handleOpenEditTemplate = (tpl: TaskTemplate) => {
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTemplateDescription(tpl.description || '');
    setTemplateItems(
      tpl.items.map((i) => ({
        title: i.title,
        description: i.description || '',
        priority: i.priority,
        orderIndex: i.orderIndex,
      }))
    );
    setShowTemplateModal(true);
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateItems([
      { title: '', description: '', priority: 'NORMAL', orderIndex: 0 },
    ]);
    setShowTemplateModal(true);
  };

  // ==========================================
  // RENDER: STAFF VIEW
  // ==========================================
  if (isStaff) {
    const tasks = myTasks || [];
    const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>My Shift Tasks</h1>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              Checklist of operational duties assigned to your shift.
            </p>
          </div>
          <button
            onClick={() => refetchMyTasks()}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {alert && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              backgroundColor: alert.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: alert.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.875rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Progress & Stats Card */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>Shift Task Progress</span>
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
              {completedCount} of {tasks.length} Completed ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: progressPercent === 100 ? '#16a34a' : '#2563eb',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusFilter === st ? '1px solid #2563eb' : '1px solid #d1d5db',
                backgroundColor: statusFilter === st ? '#eff6ff' : '#fff',
                color: statusFilter === st ? '#1d4ed8' : '#4b5563',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Task List */}
        {isLoadingMyTasks ? (
          <p style={{ color: '#6b7280' }}>Loading your tasks...</p>
        ) : tasks.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <p style={{ margin: 0, fontWeight: 500 }}>No tasks found for the selected filter.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Tasks generated for your shift will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdateStatus={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
                isUpdating={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: MANAGER & OWNER VIEW
  // ==========================================

  // All shift assignments for the selected shift (for ad-hoc task creation)
  const currentShift = branchShifts?.find((s) => s.id === selectedShiftId);
  const currentAssignments = currentShift?.assignments || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#111827' }}>Shift Operations & Tasks</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Manage branch task checklists, generate shift duties, and monitor completion.
          </p>
        </div>

        {/* Branch Selector for OWNER / MANAGER */}
        {branches && branches.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Branch:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.active && '(Inactive)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {alert && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            backgroundColor: alert.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: alert.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('MONITORING')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'MONITORING' ? '2px solid #2563eb' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'MONITORING' ? '#2563eb' : '#6b7280',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          📊 Shift Tasks & Monitoring
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'TEMPLATES' ? '2px solid #2563eb' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'TEMPLATES' ? '#2563eb' : '#6b7280',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          📝 Task Templates
        </button>
      </div>

      {/* TAB 1: MONITORING */}
      {activeTab === 'MONITORING' && (
        <div>
          {/* Controls bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>
                  Filter by Shift:
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ALL">All Branch Shifts</option>
                  {branchShifts?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.2rem' }}>
                  Filter by Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setSelectedGenerateShiftId(selectedShiftId !== 'ALL' ? selectedShiftId : branchShifts?.[0]?.id || '');
                  setShowGenerateModal(true);
                }}
                disabled={!branchShifts || branchShifts.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                ⚡ Generate Tasks from Template
              </button>

              <button
                onClick={() => {
                  if (currentAssignments.length > 0 && currentAssignments[0]) {
                    setAdHocAssignmentId(currentAssignments[0].id);
                  }
                  setShowAdHocModal(true);
                }}
                disabled={selectedShiftId === 'ALL' || currentAssignments.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: selectedShiftId === 'ALL' || currentAssignments.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedShiftId === 'ALL' || currentAssignments.length === 0 ? 0.6 : 1,
                }}
                title={selectedShiftId === 'ALL' ? 'Select a specific shift to add ad-hoc tasks' : ''}
              >
                ➕ Add Ad-Hoc Task
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <ManagerTaskTable
            tasks={branchTasks}
            isLoading={isLoadingBranchTasks}
            onCancelTask={(taskId) => updateStatusMutation.mutate({ taskId, status: 'CANCELLED' })}
          />
        </div>
      )}

      {/* TAB 2: TASK TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <TaskTemplateList
          templates={branchTemplates}
          isLoading={isLoadingTemplates}
          onOpenCreate={handleOpenCreateTemplate}
          onOpenEdit={handleOpenEditTemplate}
          onToggleStatus={(templateId, active) =>
            toggleTemplateStatusMutation.mutate({ templateId, active })
          }
        />
      )}

      {/* MODALS */}
      <GenerateTasksModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        branchShifts={branchShifts}
        branchTemplates={branchTemplates}
        selectedShiftId={selectedGenerateShiftId}
        onSelectShiftId={setSelectedGenerateShiftId}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplateId={setSelectedTemplateId}
        onSubmit={() => {
          if (selectedGenerateShiftId && selectedTemplateId) {
            generateTasksMutation.mutate({
              shiftId: selectedGenerateShiftId,
              templateId: selectedTemplateId,
            });
          }
        }}
        isPending={generateTasksMutation.isPending}
      />

      <CreateAdHocTaskModal
        isOpen={showAdHocModal}
        onClose={() => setShowAdHocModal(false)}
        assignments={currentAssignments}
        assignmentId={adHocAssignmentId}
        onSelectAssignmentId={setAdHocAssignmentId}
        title={adHocTitle}
        onChangeTitle={setAdHocTitle}
        description={adHocDescription}
        onChangeDescription={setAdHocDescription}
        priority={adHocPriority}
        onChangePriority={setAdHocPriority}
        onSubmit={() => {
          if (adHocAssignmentId && adHocTitle.trim()) {
            createAdHocMutation.mutate({
              assignmentId: adHocAssignmentId,
              data: {
                title: adHocTitle.trim(),
                description: adHocDescription.trim() || undefined,
                priority: adHocPriority,
              },
            });
          }
        }}
        isPending={createAdHocMutation.isPending}
      />

      <TaskTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        isEditing={!!editingTemplate}
        name={templateName}
        onChangeName={setTemplateName}
        description={templateDescription}
        onChangeDescription={setTemplateDescription}
        items={templateItems}
        onChangeItems={setTemplateItems}
        onSubmit={() => saveTemplateMutation.mutate()}
        isPending={saveTemplateMutation.isPending}
      />
    </div>
  );
};
