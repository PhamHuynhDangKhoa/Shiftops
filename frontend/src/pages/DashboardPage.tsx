import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ApiResponse,
  Branch,
  Announcement,
  AnnouncementTargetType,
  RealtimeEvent,
  Shift,
  Task,
  PagedResponse,
  Attendance,
} from '../lib/types';
import { Card, Badge, Button, Modal, Input } from '../components/ui';
import {
  IconMegaphone,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconCheckList,
  IconAlertTriangle,
  IconHandshake,
  IconMapPin,
  IconPlus,
  IconCheck,
  IconArrowUpRight,
} from '../components/ui/Icons';

interface HealthData {
  status: string;
  version: string;
  database: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { lastEvent } = useWebSocket();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isStaff = !isOwner && !isManager;

  // Format real-time event descriptions cleanly in plain English
  const formatEventSummary = (evt: RealtimeEvent | null) => {
    if (!evt) return '';
    const payload = (evt.payload || {}) as Record<string, unknown>;
    switch (evt.eventType) {
      case 'STAFF_CHECKED_IN':
        return `${String(payload.staffName || 'Staff member')} clocked in`;
      case 'STAFF_CHECKED_OUT':
        return `${String(payload.staffName || 'Staff member')} clocked out`;
      case 'TASK_COMPLETED':
        return `Task completed: ${String(payload.taskTitle || 'Task')}`;
      case 'TASK_STATUS_CHANGED':
        return `Task status updated: ${String(payload.taskTitle || 'Task')}`;
      case 'ISSUE_STATUS_CHANGED':
        return `Issue updated: ${String(payload.title || 'Issue')} (${String(payload.status || '')})`;
      case 'HANDOVER_SUBMITTED':
        return `Shift handover submitted: ${String(payload.shiftName || '')}`;
      case 'HANDOVER_ACKNOWLEDGED':
        return `Shift handover signed by manager`;
      case 'ANNOUNCEMENT_PUBLISHED':
        return `New announcement: ${String(payload.title || '')}`;
      case 'NOTIFICATION_CREATED': {
        const notif = payload.notification as { title?: string } | undefined;
        return `Notification: ${notif?.title || 'New alert'}`;
      }
      default:
        return `Activity: ${evt.eventType.replace(/_/g, ' ').toLowerCase()}`;
    }
  };

  // Broadcast modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetType, setBroadcastTargetType] = useState<AnnouncementTargetType>('BRANCH');
  const [broadcastBranchId, setBroadcastBranchId] = useState(user?.primaryBranchId || '');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Common queries
  const { data: health } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HealthData>>('/health');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  const { data: announcements, refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['announcements', 'my'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Announcement[]>>('/announcements/my');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // STAFF-SPECIFIC QUERIES
  const { data: myShifts } = useQuery<Shift[]>({
    queryKey: ['my-shifts-today'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts');
      return res.data.data;
    },
    enabled: isStaff,
  });

  const { data: myAttendance } = useQuery<PagedResponse<Attendance>>({
    queryKey: ['my-attendance-latest'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PagedResponse<Attendance>>>('/attendance/my?size=1');
      return res.data.data;
    },
    enabled: isStaff,
  });

  const { data: myTasks } = useQuery<Task[]>({
    queryKey: ['my-tasks-today'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>('/tasks/my');
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Create announcement mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const targetBranch =
        broadcastTargetType === 'ORGANIZATION'
          ? broadcastBranchId || branches?.[0]?.id || user?.primaryBranchId
          : broadcastBranchId || user?.primaryBranchId || branches?.[0]?.id;

      if (!targetBranch && broadcastTargetType !== 'ORGANIZATION') {
        throw new Error('Please select a branch');
      }

      await api.post(`/branches/${targetBranch}/announcements`, {
        title: broadcastTitle,
        content: broadcastContent,
        targetType: broadcastTargetType,
        publishImmediately: true,
      });
    },
    onSuccess: () => {
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastError(null);
      refetchAnnouncements();
    },
    onError: (err: unknown) => {
      let msg = 'Failed to create announcement';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setBroadcastError(msg);
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      setBroadcastError('Title and content are required.');
      return;
    }
    setBroadcastError(null);
    broadcastMutation.mutate();
  };

  // Staff current shift & attendance check
  const latestAttendance = myAttendance?.content?.[0];
  const isCurrentlyClockedIn = !!(latestAttendance && latestAttendance.checkInAt && !latestAttendance.checkOutAt);
  const currentShift = myShifts?.[0];

  const completedTasksCount = myTasks?.filter((t) => t.status === 'COMPLETED').length || 0;
  const totalTasksCount = myTasks?.length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Context Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              {isOwner
                ? 'Company Overview'
                : isManager
                ? 'Branch Dashboard'
                : 'My Workspace'}
            </h1>
            <Badge
              variant={isOwner ? 'gold' : isManager ? 'warning' : 'brand'}
              size="sm"
            >
              {user?.role}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
            <span className="flex items-center gap-1 font-medium text-zinc-700">
              <IconMapPin size={14} className="text-zinc-400" />
              <span>{user?.primaryBranchName ? user.primaryBranchName : 'All Branches'}</span>
            </span>
            <span className="text-zinc-300">·</span>
            <span>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {(isOwner || isManager) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBroadcastTitle('');
                setBroadcastContent('');
                setBroadcastTargetType('BRANCH');
                setBroadcastBranchId(user?.primaryBranchId || branches?.[0]?.id || '');
                setBroadcastError(null);
                setIsBroadcastModalOpen(true);
              }}
              className="gap-1.5 whitespace-nowrap"
            >
              <IconMegaphone size={14} />
              <span>Broadcast Notice</span>
            </Button>
          )}

          <Link to="/attendance" className="whitespace-nowrap">
            <Button
              variant={isStaff && isCurrentlyClockedIn ? 'amber' : 'primary'}
              size="sm"
              className="gap-1.5 whitespace-nowrap"
            >
              <IconClock size={14} />
              <span>{isStaff ? (isCurrentlyClockedIn ? 'Clock Out' : 'Clock In') : 'Floor Attendance'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real-time Live Event Telemetry Ticker */}
      {lastEvent && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-zinc-200/90 rounded-xl text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Live Feed</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-800 font-medium truncate">{formatEventSummary(lastEvent)}</span>
          </div>
          <span className="text-[11px] text-zinc-400 ml-4 flex-shrink-0 tabular-nums">
            {new Date(lastEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3A. STAFF VIEW — CLEAN FIELD DESK                                         */}
      {/* ========================================================================= */}
      {isStaff && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Primary Shift Status Card */}
            <Card className="lg:col-span-2 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
                    Current Shift Status
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 mt-1">
                    {isCurrentlyClockedIn ? 'You are currently on shift' : 'Ready to start your shift'}
                  </h2>
                </div>
                <Badge
                  variant={isCurrentlyClockedIn ? 'success' : 'neutral'}
                  size="md"
                  showDot
                >
                  {isCurrentlyClockedIn ? 'Clocked In' : 'Off Duty'}
                </Badge>
              </div>

              {/* Shift Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-lg">
                  <span className="text-xs font-medium text-zinc-500 block">Assigned Shift</span>
                  <span className="text-sm font-semibold text-zinc-900 truncate block mt-1">
                    {currentShift ? currentShift.name : 'No Scheduled Shift'}
                  </span>
                </div>
                <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-lg">
                  <span className="text-xs font-medium text-zinc-500 block">Scheduled Hours</span>
                  <span className="text-sm font-semibold text-zinc-900 block mt-1 tabular-nums whitespace-nowrap">
                    {currentShift
                      ? `${new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(currentShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Not Scheduled'}
                  </span>
                </div>
                <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/60 rounded-lg">
                  <span className="text-xs font-medium text-zinc-500 block">Last Recorded Punch</span>
                  <span className="text-sm font-semibold text-zinc-900 block mt-1 tabular-nums">
                    {latestAttendance?.checkInAt
                      ? new Date(latestAttendance.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'None today'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link to="/attendance" className="w-full sm:w-auto flex-1">
                  <Button
                    variant={isCurrentlyClockedIn ? 'amber' : 'emerald'}
                    size="lg"
                    className="w-full gap-2 text-sm font-semibold shadow-xs"
                  >
                    <IconClock size={16} />
                    <span>{isCurrentlyClockedIn ? 'Clock Out of Shift' : 'Clock In Now'}</span>
                  </Button>
                </Link>

                <Link to="/issues" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto gap-2 text-sm text-rose-700 hover:text-rose-800 hover:border-rose-300"
                  >
                    <IconAlertTriangle size={16} className="text-rose-600" />
                    <span>Report an Issue</span>
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Today's Tasks Quick Card */}
            <Card className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <IconCheckList size={16} className="text-zinc-600" />
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Today's Tasks
                    </h3>
                  </div>
                  {totalTasksCount > 0 && (
                    <span className="text-xs font-medium text-zinc-500 tabular-nums">
                      {completedTasksCount} / {totalTasksCount} done
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  {myTasks && myTasks.length > 0 ? (
                    myTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-lg flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-zinc-900 font-medium truncate block">{task.title}</span>
                          <span className="text-[11px] text-zinc-500 mt-0.5 block">
                            Priority: {task.priority.toLowerCase()}
                          </span>
                        </div>
                        <Badge
                          variant={task.status === 'COMPLETED' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {task.status === 'COMPLETED' ? 'Done' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      No tasks assigned for today.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100">
                <Link
                  to="/tasks"
                  className="text-xs font-medium text-zinc-900 hover:text-zinc-600 flex items-center justify-center gap-1 w-full py-1.5"
                >
                  <span>View all task details</span>
                  <IconArrowUpRight size={13} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3B. MANAGER VIEW — BRANCH OPERATIONS DECK                                 */}
      {/* ========================================================================= */}
      {isManager && (
        <div className="space-y-6">
          {/* Manager KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Branch</span>
                <IconBuilding size={16} className="text-zinc-400" />
              </div>
              <div className="text-lg font-bold text-zinc-900 truncate">
                {user?.primaryBranchName || 'Assigned Branch'}
              </div>
              <div className="text-xs text-zinc-500">
                Primary jurisdiction
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Notices</span>
                <IconMegaphone size={16} className="text-zinc-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                {announcements ? announcements.length : 0}
              </div>
              <div className="text-xs text-zinc-500">
                Active announcements
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">System Link</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-2xl font-bold text-zinc-900">
                {health?.status || 'Online'}
              </div>
              <div className="text-xs text-zinc-500">
                Database connected
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Role</span>
                <IconCheck size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-900">
                Manager
              </div>
              <div className="text-xs text-zinc-500">
                Full branch management
              </div>
            </Card>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/shifts"
              className="p-5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px] group"
            >
              <div className="flex items-center justify-between text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <IconCalendar size={20} />
                <IconArrowUpRight size={15} />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-zinc-900 block">Roster & Shifts</span>
                <span className="text-xs text-zinc-500">Create & assign shifts</span>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="p-5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px] group"
            >
              <div className="flex items-center justify-between text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <IconClock size={20} />
                <IconArrowUpRight size={15} />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-zinc-900 block">Floor Attendance</span>
                <span className="text-xs text-zinc-500">Real-time check-in radar</span>
              </div>
            </Link>

            <Link
              to="/issues"
              className="p-5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px] group"
            >
              <div className="flex items-center justify-between text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <IconAlertTriangle size={20} />
                <IconArrowUpRight size={15} />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-zinc-900 block">Issue Triage</span>
                <span className="text-xs text-zinc-500">Track floor incidents & fixes</span>
              </div>
            </Link>

            <Link
              to="/handovers"
              className="p-5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between min-h-[110px] group"
            >
              <div className="flex items-center justify-between text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <IconHandshake size={20} />
                <IconArrowUpRight size={15} />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-zinc-900 block">Shift Handovers</span>
                <span className="text-xs text-zinc-500">Review & acknowledge debriefs</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3C. OWNER VIEW — MULTI-BRANCH COMPANY OVERVIEW                            */}
      {/* ========================================================================= */}
      {isOwner && (
        <div className="space-y-6">
          {/* Owner Top Level Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Branches</span>
                <IconBuilding size={16} className="text-zinc-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                {branches ? branches.length : '—'}
              </div>
              <div className="text-xs text-zinc-500">
                {branches?.filter((b) => b.active).length || 0} active locations
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Announcements</span>
                <IconMegaphone size={16} className="text-zinc-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                {announcements ? announcements.length : 0}
              </div>
              <div className="text-xs text-zinc-500">
                Company-wide notices
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">System Health</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-2xl font-bold text-zinc-900">
                {health?.status || 'Online'}
              </div>
              <div className="text-xs text-zinc-500">
                PostgreSQL & API Operational
              </div>
            </Card>

            <Card compact className="space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Governance</span>
                <IconCheck size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-900">
                Enforced
              </div>
              <div className="text-xs text-zinc-500">
                Role-based access active
              </div>
            </Card>
          </div>

          {/* Operating Branches Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Company Branches
              </span>
              <Link to="/branches" className="text-xs font-medium text-zinc-900 hover:text-zinc-600 flex items-center gap-1">
                <span>Manage branches</span>
                <IconArrowUpRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches?.map((branch) => (
                <Card key={branch.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-base">{branch.name}</h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <IconMapPin size={13} className="text-zinc-400 flex-shrink-0" />
                        <span>{branch.address || 'Address unassigned'}</span>
                      </p>
                    </div>
                    <Badge variant={branch.active ? 'success' : 'neutral'} size="sm" showDot>
                      {branch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span className="tabular-nums">ID: {branch.id.slice(0, 8)}</span>
                    <Link to="/shifts" className="font-medium text-zinc-900 hover:text-zinc-600">
                      View shifts →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ACTIVE OPERATIONAL BROADCASTS (Shared)                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t border-zinc-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900">
              Announcements
            </h2>
            {announcements && announcements.length > 0 && (
              <Badge variant="brand" size="sm">
                {announcements.length}
              </Badge>
            )}
          </div>
          {(isOwner || isManager) && (
            <button
              onClick={() => {
                setBroadcastTitle('');
                setBroadcastContent('');
                setBroadcastTargetType('BRANCH');
                setBroadcastBranchId(user?.primaryBranchId || branches?.[0]?.id || '');
                setBroadcastError(null);
                setIsBroadcastModalOpen(true);
              }}
              className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer flex items-center gap-1"
            >
              <IconPlus size={14} />
              <span>New Announcement</span>
            </button>
          )}
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <Card key={ann.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-900 text-sm truncate">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <span>Posted by {ann.createdByName}</span>
                      <span>·</span>
                      <span className="tabular-nums">{new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={ann.targetType === 'ORGANIZATION' ? 'warning' : 'brand'} size="sm">
                    {ann.targetType === 'ORGANIZATION' ? 'All Branches' : ann.branchName || 'Branch'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-600 whitespace-pre-line leading-relaxed font-sans">
                  {ann.content}
                </p>
                {ann.targetShiftName && (
                  <div className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/70 rounded-md px-2.5 py-1 inline-block">
                    Target shift: {ann.targetShiftName}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-10 text-center text-zinc-500 text-xs">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2.5">
              <IconMegaphone size={18} />
            </div>
            <p className="font-semibold text-zinc-800 text-sm">No announcements at this time</p>
            <p className="text-zinc-500 text-xs mt-1">
              Check back later for company and branch operational updates.
            </p>
          </Card>
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Create Announcement"
        description="Publish an operational notice to branch personnel"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          {broadcastError && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {broadcastError}
            </div>
          )}

          <Input
            label="Title"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Mandatory Shift Coverage for Evening Shift"
            maxLength={150}
            required
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Target Audience</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">Specific Branch</option>
                <option value="ORGANIZATION">Organization-Wide (All Branches)</option>
              </select>
            </div>
          )}

          {broadcastTargetType === 'BRANCH' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Branch</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
                value={broadcastBranchId}
                onChange={(e) => setBroadcastBranchId(e.target.value)}
                disabled={!isOwner && !!user?.primaryBranchId}
              >
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Notice Details</label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs min-h-[110px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter announcement details, instructions, or operational updates..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBroadcastModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={broadcastMutation.isPending}
            >
              {broadcastMutation.isPending ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
