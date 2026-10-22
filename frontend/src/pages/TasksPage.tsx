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
      const res = await api.get<ApiResponse<Task[]>>('/tasks/my-tasks', { params });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // MANAGER: Branch shifts query (to filter tasks by shift)
  const { data: branchShifts } = useQuery<Shift[]>({
    queryKey: ['branch-shifts-tasks', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<Shift[]>>(`/branches/${selectedBranchId}/shifts`);
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // MANAGER: Branch tasks query
  const {
    data: branchTasks,
    isLoading: isLoadingBranchTasks,
  } = useQuery<Task[]>({
    queryKey: ['branch-tasks', selectedBranchId, selectedShiftId, statusFilter],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (selectedShiftId !== 'ALL') params.shiftId = selectedShiftId;

      const res = await api.get<ApiResponse<Task[]>>(`/branches/${selectedBranchId}/tasks`, { params });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // MANAGER: Branch templates query
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

  // Update Task Status (Staff complete / Manager cancel)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to update task';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Generate Tasks from Template
  const generateTasksMutation = useMutation({
    mutationFn: async ({ shiftId, templateId }: { shiftId: string; templateId: string }) => {
      const res = await api.post<ApiResponse<Task[]>>(`/shifts/${shiftId}/generate-tasks`, { templateId });
      return res.data;
    },
    onSuccess: (data) => {
      setAlert({
        type: 'success',
        message: `Successfully generated ${data.data.length} tasks for shift crew`,
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
      data: { title: string; description?: string; priority?: TaskPriority };
    }) => {
      const res = await api.post<ApiResponse<Task>>(`/shift-assignments/${assignmentId}/tasks`, data);
      return res.data;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Ad-hoc task assigned successfully' });
      setShowAdHocModal(false);
      setAdHocTitle('');
      setAdHocDescription('');
      setAdHocPriority('NORMAL');
      queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const msg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || 'Failed to add task';
      setAlert({ type: 'error', message: msg });
    },
  });

  // Save (Create/Update) Task Template
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 flex items-center gap-2">
              <IconCheckList size={20} className="text-zinc-950" />
              <span>My Shift Tasks</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Checklist of operational duties assigned to your active shifts
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchMyTasks()}
            className="gap-1.5"
          >
            <IconRefresh size={13} className="text-zinc-500" />
            <span>Refresh</span>
          </Button>
        </div>

        {alert && (
          <div
            className={`p-3 rounded-md text-xs border flex items-center justify-between ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                : 'bg-rose-50 text-rose-800 border-rose-200/90'
            }`}
          >
            <div className="flex items-center gap-2">
              {alert.type === 'success' ? (
                <IconCheck size={14} className="text-emerald-600" />
              ) : (
                <IconAlertTriangle size={14} className="text-rose-600" />
              )}
              <span>{alert.message}</span>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <IconClose size={13} />
            </button>
          </div>
        )}

        {/* Progress Strip */}
        <Card compact className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-600">Completion Progress</span>
            <span className="font-mono font-semibold text-zinc-950 tabular-nums">
              {completedCount} of {tasks.length} Done ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-950 transition-all duration-300"
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
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-900 text-zinc-50 border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Task List */}
        {isLoadingMyTasks ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-400">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
              <IconCheckList size={16} />
            </div>
            <p className="text-xs font-medium text-zinc-800">No tasks found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Tasks generated for your shift will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 flex items-center gap-2">
            <IconCheckList size={20} className="text-zinc-950" />
            <span>Shift Tasks & Operating Checklists</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Dispatch checklist routines, assign ad-hoc responsibilities, and monitor shift execution
          </p>
        </div>

        {branches && branches.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-zinc-500 font-mono text-[11px]">Branch:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
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
          className={`p-3 rounded-md text-xs border flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
              : 'bg-rose-50 text-rose-800 border-rose-200/90'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <IconCheck size={14} className="text-emerald-600" />
            ) : (
              <IconAlertTriangle size={14} className="text-rose-600" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <IconClose size={13} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('MONITORING')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MONITORING'
              ? 'border-zinc-950 text-zinc-950 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Shift Tasks Monitoring
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'border-zinc-950 text-zinc-950 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Checklist Templates
        </button>
      </div>

      {/* TAB 1: MONITORING */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Shift:
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="ALL">All Branch Shifts</option>
                  {branchShifts?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
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
                <IconCheckList size={13} />
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
                <IconPlus size={13} />
                <span>Add Ad-Hoc</span>
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
