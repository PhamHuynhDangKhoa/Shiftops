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
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  IconCheckList,
  IconRefresh,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
  IconClose,
} from '../components/ui/Icons';

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

  // Staff query: /tasks/my
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

  // Shifts query for Manager/Owner (to filter tasks by shift and populate Generate modal)
  const { data: branchShifts } = useQuery<Shift[]>({
    queryKey: ['branch-shifts-tasks', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const start = new Date();
      start.setHours(start.getHours() - 48);
      const end = new Date();
      end.setHours(end.getHours() + 72);
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

  // Branch tasks query for Manager/Owner: /branches/{branchId}/tasks
  const {
    data: branchTasks,
    isLoading: isLoadingBranchTasks,
  } = useQuery<Task[]>({
    queryKey: ['branch-tasks', selectedBranchId, selectedShiftId, statusFilter],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const params: Record<string, string> = {};
      if (selectedShiftId !== 'ALL') params.shiftId = selectedShiftId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get<ApiResponse<Task[]>>(`/branches/${selectedBranchId}/tasks`, { params });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // Templates query: /branches/{branchId}/task-templates
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

  // Update Task Status Mutation (Staff & Manager)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({
        type: 'success',
        message: `Task updated: "${data.data.title}" is now ${data.data.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to update task status';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Generate Tasks from Template Mutation
  const generateTasksMutation = useMutation({
    mutationFn: async ({ shiftId, templateId }: { shiftId: string; templateId: string }) => {
      const res = await api.post<ApiResponse<Task[]>>(`/shifts/${shiftId}/tasks/generate`, {
        templateId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({
        type: 'success',
        message: `Successfully generated ${data.data.length} tasks from checklist template`,
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

  // Create Ad-Hoc Task Mutation
  const createAdHocMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: { title: string; description?: string; priority?: TaskPriority };
    }) => {
      const res = await api.post<ApiResponse<Task>>(`/shift-assignments/${assignmentId}/tasks`, data);
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({
        type: 'success',
        message: `Ad-hoc task "${data.data.title}" created successfully`,
      });
      setShowAdHocModal(false);
      setAdHocTitle('');
      setAdHocDescription('');
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to create task';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Create / Update Template Mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBranchId) throw new Error('No branch selected');
      const payload = {
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        items: templateItems.map((it, idx) => ({
          title: it.title.trim(),
          description: it.description?.trim() || undefined,
          priority: it.priority,
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
              <IconCheckList size={22} className="text-zinc-700" />
              <span>My Tasks</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Checklist duties and tasks assigned to your active shift.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchMyTasks()}
            className="gap-1.5"
          >
            <IconRefresh size={14} />
            <span>Refresh</span>
          </Button>
        </div>

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

        {/* Progress Card */}
        <Card compact className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5d5f60] font-medium">
              Shift task progress
            </span>
            <span className="font-medium text-[#131416] tabular-nums">
              {completedCount} of {tasks.length} completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#f0f1f2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e7b4f] rounded-full transition-colors duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        {/* Status Filter Segment */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`h-7 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                statusFilter === st
                  ? 'bg-[#131416] text-white border-[#131416]'
                  : 'bg-white text-[#5d5f60] border-[#cdced1] hover:bg-[#f4f6f8]'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'TODO' ? 'Pending' : st === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Task List */}
        {isLoadingMyTasks ? (
          <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <Card className="py-12 text-center text-zinc-500">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2">
              <IconCheckList size={18} />
            </div>
            <p className="font-semibold text-zinc-800 text-sm">No tasks found</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tasks generated for your shift will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
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
  const currentShift = branchShifts?.find((s) => s.id === selectedShiftId);
  const currentAssignments = currentShift?.assignments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <IconCheckList size={22} className="text-zinc-700" />
            <span>Task Management</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Checklist procedures, task delegation, and execution tracking
          </p>
        </div>

        {branches && branches.length > 1 && (
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
      </div>

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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('MONITORING')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'MONITORING'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Task Monitoring
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'TEMPLATES'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Checklist Templates
        </button>
      </div>

      {/* TAB 1: MONITORING */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e8eaec] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#5d5f60]">
                  Shift:
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                >
                  <option value="ALL">All Branch Shifts</option>
                  {branchShifts?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#5d5f60]">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedGenerateShiftId(selectedShiftId !== 'ALL' ? selectedShiftId : branchShifts?.[0]?.id || '');
                  setShowGenerateModal(true);
                }}
                disabled={!branchShifts || branchShifts.length === 0}
                className="gap-1.5"
              >
                <IconCheckList size={14} />
                <span>Generate from Template</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (currentAssignments.length > 0 && currentAssignments[0]) {
                    setAdHocAssignmentId(currentAssignments[0].id);
                  }
                  setShowAdHocModal(true);
                }}
                disabled={selectedShiftId === 'ALL' || currentAssignments.length === 0}
                className="gap-1.5"
              >
                <IconPlus size={14} />
                <span>Add Ad-Hoc Task</span>
              </Button>
            </div>
          </div>

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
