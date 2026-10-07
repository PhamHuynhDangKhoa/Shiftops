import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Branch,
  Shift,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTemplate,
  ApiResponse,
} from '../lib/types';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user?.role === 'STAFF';

  // State for Branch selection (Manager / Owner)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Tab state for Manager / Owner: 'MONITORING' | 'TEMPLATES'
  const [activeTab, setActiveTab] = useState<'MONITORING' | 'TEMPLATES'>('MONITORING');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('ALL');

  // Alert / notification banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
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
  const [templateItems, setTemplateItems] = useState<
    Array<{ title: string; description: string; priority: TaskPriority; orderIndex: number }>
  >([]);

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
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update task status';
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
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to generate tasks';
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
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create ad-hoc task';
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
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save template';
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
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to toggle status';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Helpers
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>HIGH</span>;
      case 'NORMAL':
        return <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>NORMAL</span>;
      case 'LOW':
        return <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>LOW</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <span style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>TODO</span>;
      case 'IN_PROGRESS':
        return <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>IN PROGRESS</span>;
      case 'COMPLETED':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>✓ COMPLETED</span>;
      case 'CANCELLED':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>CANCELLED</span>;
    }
  };

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
              <div
                key={task.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  opacity: task.status === 'COMPLETED' ? 0.85 : 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: task.status === 'COMPLETED' ? '#4b5563' : '#111827',
                        textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    <span>📍 {task.branchName}</span>
                    {task.shiftName && <span>⏰ {task.shiftName}</span>}
                    {task.completedAt && (
                      <span style={{ color: '#16a34a', fontWeight: 500 }}>
                        ✓ Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Staff Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {task.status === 'TODO' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'IN_PROGRESS' })}
                      disabled={updateStatusMutation.isPending}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Start Task
                    </button>
                  )}

                  {(task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'COMPLETED' })}
                      disabled={updateStatusMutation.isPending}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Complete
                    </button>
                  )}

                  {task.status === 'COMPLETED' && (
                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>
                      Done
                    </span>
                  )}
                </div>
              </div>
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
          {isLoadingBranchTasks ? (
            <p style={{ color: '#6b7280' }}>Loading branch tasks...</p>
          ) : !branchTasks || branchTasks.length === 0 ? (
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
              <p style={{ margin: 0, fontWeight: 500 }}>No tasks found for this branch or shift.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Click "Generate Tasks from Template" above to populate checklists for assigned staff.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Task</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Staff Assigned</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Shift</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Completed At</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branchTasks.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{t.title}</div>
                        {t.description && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>{t.description}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                        <span style={{ fontWeight: 500 }}>{t.userName}</span>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.userEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#4b5563', fontSize: '0.8rem' }}>
                        {t.shiftName || 'Shift'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{getPriorityBadge(t.priority)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{getStatusBadge(t.status)}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        {t.completedAt ? (
                          <span style={{ color: '#16a34a', fontWeight: 500 }}>
                            {new Date(t.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ taskId: t.id, status: 'CANCELLED' })}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #fee2e2',
                              borderRadius: '4px',
                              backgroundColor: '#fff',
                              color: '#b91c1c',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASK TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>
              Templates define reusable operational checklists (e.g. Opening, Closing, Cleanliness) for this branch.
            </span>
            <button
              onClick={handleOpenCreateTemplate}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ➕ Create Template
            </button>
          </div>

          {isLoadingTemplates ? (
            <p style={{ color: '#6b7280' }}>Loading templates...</p>
          ) : !branchTemplates || branchTemplates.length === 0 ? (
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
              <p style={{ margin: 0, fontWeight: 500 }}>No task templates created yet for this branch.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Create your first template to standardize operational routines.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
              {branchTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '1.25rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                          {tpl.name}
                        </h3>
                        {tpl.description && (
                          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                            {tpl.description}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: tpl.active ? '#dcfce7' : '#f3f4f6',
                          color: tpl.active ? '#166534' : '#6b7280',
                        }}
                      >
                        {tpl.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>
                        Checklist Items ({tpl.items.length}):
                      </span>
                      <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#374151' }}>
                        {tpl.items.map((it) => (
                          <li key={it.id} style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 500 }}>{it.title}</span>{' '}
                            {it.priority !== 'NORMAL' && (
                              <span style={{ fontSize: '0.7rem', color: it.priority === 'HIGH' ? '#dc2626' : '#6b7280' }}>
                                [{it.priority}]
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() =>
                        toggleTemplateStatusMutation.mutate({
                          templateId: tpl.id,
                          active: !tpl.active,
                        })
                      }
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {tpl.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditTemplate(tpl)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #2563eb',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: GENERATE TASKS FROM TEMPLATE        */}
      {/* ========================================== */}
      {showGenerateModal && (
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
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              Generate Tasks for Shift
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
              Select a shift and task template. A distinct task will be assigned to every staff member on the shift.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Target Shift:
              </label>
              <select
                value={selectedGenerateShiftId}
                onChange={(e) => setSelectedGenerateShiftId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                {branchShifts?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {s.assignments?.length || 0} staff
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Select Template:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Choose Template --</option>
                {branchTemplates
                  ?.filter((t) => t.active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items?.length || 0} checklist items)
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowGenerateModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedGenerateShiftId && selectedTemplateId) {
                    generateTasksMutation.mutate({
                      shiftId: selectedGenerateShiftId,
                      templateId: selectedTemplateId,
                    });
                  }
                }}
                disabled={!selectedGenerateShiftId || !selectedTemplateId || generateTasksMutation.isPending}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: !selectedGenerateShiftId || !selectedTemplateId ? 'not-allowed' : 'pointer',
                }}
              >
                {generateTasksMutation.isPending ? 'Generating...' : 'Generate Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD AD-HOC TASK                     */}
      {/* ========================================== */}
      {showAdHocModal && (
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
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              Add Ad-Hoc Task
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Assign to Staff Member:
              </label>
              <select
                value={adHocAssignmentId}
                onChange={(e) => setAdHocAssignmentId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                {currentAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.userName} ({a.userRole})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Task Title:
              </label>
              <input
                type="text"
                value={adHocTitle}
                onChange={(e) => setAdHocTitle(e.target.value)}
                placeholder="e.g. Unpack delivery box #4"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Description (Optional):
              </label>
              <textarea
                value={adHocDescription}
                onChange={(e) => setAdHocDescription(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Priority:
              </label>
              <select
                value={adHocPriority}
                onChange={(e) => setAdHocPriority(e.target.value as TaskPriority)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowAdHocModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
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
                disabled={!adHocAssignmentId || !adHocTitle.trim() || createAdHocMutation.isPending}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: !adHocAssignmentId || !adHocTitle.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {createAdHocMutation.isPending ? 'Saving...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CREATE / EDIT TASK TEMPLATE         */}
      {/* ========================================== */}
      {showTemplateModal && (
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
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              {editingTemplate ? 'Edit Task Template' : 'Create Task Template'}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Template Name:
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Morning Opening Checklist"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Description (Optional):
              </label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief summary of duties"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Checklist Items:</label>
                <button
                  type="button"
                  onClick={() =>
                    setTemplateItems([
                      ...templateItems,
                      { title: '', description: '', priority: 'NORMAL', orderIndex: templateItems.length },
                    ])
                  }
                  style={{
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ➕ Add Item
                </button>
              </div>

              {templateItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9fafb',
                    padding: '0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', width: '20px' }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...templateItems];
                      const cur = updated[idx];
                      if (cur) {
                        cur.title = e.target.value;
                        setTemplateItems(updated);
                      }
                    }}
                    placeholder="Task item title"
                    style={{ flex: 2, padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                  <select
                    value={item.priority}
                    onChange={(e) => {
                      const updated = [...templateItems];
                      const cur = updated[idx];
                      if (cur) {
                        cur.priority = e.target.value as TaskPriority;
                        setTemplateItems(updated);
                      }
                    }}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateItems(templateItems.filter((_, i) => i !== idx));
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0 0.3rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveTemplateMutation.mutate()}
                disabled={
                  !templateName.trim() ||
                  templateItems.some((it) => !it.title.trim()) ||
                  saveTemplateMutation.isPending
                }
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor:
                    !templateName.trim() || templateItems.some((it) => !it.title.trim())
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
