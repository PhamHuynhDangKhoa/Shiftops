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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#262c38]">
          <div>
            <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
              <IconCheckList size={20} className="text-[#00f0ff]" />
              <span>FIELD MISSION CHECKLIST</span>
            </h1>
            <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
              Operational duties and directives assigned to your active shift
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchMyTasks()}
            className="gap-2"
          >
            <IconRefresh size={13} className="text-[#00f0ff]" />
            <span>[ RE-SYNC ]</span>
          </Button>
        </div>

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

        {/* Progress Strip */}
        <Card compact className="space-y-2.5 border border-[#262c38] bg-[#11141a]" chamfer>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#9da8b9] uppercase font-bold text-[10px]">DIRECTIVE COMPLETION RATE</span>
            <span className="font-bold text-[#00f0ff] tabular-nums">
              {completedCount} OF {tasks.length} RESOLVED ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#181c24] rounded-none overflow-hidden border border-[#2a2f3d]">
            <div
              className="h-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        {/* Status Filter Segment */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase border transition-colors cursor-pointer clip-chamfer-btn ${
                statusFilter === st
                  ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-[#11141a] text-[#9da8b9] border-[#262c38] hover:border-[#384152] hover:text-white'
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#262c38]">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2.5">
            <IconCheckList size={20} className="text-[#00f0ff]" />
            <span>OPERATIONAL TASKS & CHECKLIST DIRECTIVES</span>
          </h1>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            Dispatch checklist routines, assign ad-hoc responsibilities, and monitor shift execution
          </p>
        </div>

        {branches && branches.length > 1 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <label className="text-[#606c80] uppercase font-bold text-[10px]">SECTOR:</label>
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
      </div>

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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262c38]">
        <button
          onClick={() => setActiveTab('MONITORING')}
          className={`pb-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MONITORING'
              ? 'border-[#00f0ff] text-[#00f0ff]'
              : 'border-transparent text-[#606c80] hover:text-white'
          }`}
        >
          [ 01 // TASK MONITORING ]
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'border-[#00f0ff] text-[#00f0ff]'
              : 'border-transparent text-[#606c80] hover:text-white'
          }`}
        >
          [ 02 // CHECKLIST TEMPLATES ]
        </button>
      </div>

      {/* TAB 1: MONITORING */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-4">
          <div className="bg-[#11141a] border border-[#262c38] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs clip-chamfer-btn">
            <div className="flex items-center gap-3 flex-wrap font-mono">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-[#606c80] uppercase font-bold">
                  SHIFT:
                </label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="ALL">All Sector Shifts</option>
                  {branchShifts?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || 'Shift'} ({new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] text-[#606c80] uppercase font-bold">
                  STATUS:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#161922] text-white focus:outline-none focus:border-[#00f0ff]"
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
