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

  // Format real-time event descriptions for tactical activity ticker
  const formatEventSummary = (evt: RealtimeEvent | null) => {
    if (!evt) return '';
    const payload = (evt.payload || {}) as Record<string, unknown>;
    switch (evt.eventType) {
      case 'STAFF_CHECKED_IN':
        return `OPERATOR DEPLOYED: ${String(payload.staffName || 'Staff Member')}`;
      case 'STAFF_CHECKED_OUT':
        return `OPERATOR CLOCKED OUT: ${String(payload.staffName || 'Staff Member')}`;
      case 'TASK_COMPLETED':
        return `MISSION TASK COMPLETED: ${String(payload.taskTitle || 'Task')}`;
      case 'TASK_STATUS_CHANGED':
        return `TASK STATUS TRANSITION: ${String(payload.taskTitle || 'Task')}`;
      case 'ISSUE_STATUS_CHANGED':
        return `INCIDENT UPDATED: ${String(payload.title || 'Issue')} [${String(payload.status || '')}]`;
      case 'HANDOVER_SUBMITTED':
        return `SHIFT DEBRIEF SUBMITTED: ${String(payload.shiftName || '')}`;
      case 'HANDOVER_ACKNOWLEDGED':
        return `SHIFT DEBRIEF SIGNED BY SUPERVISOR`;
      case 'ANNOUNCEMENT_PUBLISHED':
        return `BROADCAST TRANSMITTED: ${String(payload.title || '')}`;
      case 'NOTIFICATION_CREATED': {
        const notif = payload.notification as { title?: string } | undefined;
        return `DISPATCH ALERT: ${notif?.title || ''}`;
      }
      default:
        return `SYSTEM DISPATCH: ${evt.eventType}`;
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
  const isCurrentlyClockedIn = latestAttendance && latestAttendance.checkInAt && !latestAttendance.checkOutAt;
  const currentShift = myShifts?.[0];

  return (
    <div className="space-y-6">
      {/* 1. Tactical Command Header & Live Telemetry Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#262c38]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-none ${isOwner ? 'bg-[#e5c07b]' : isManager ? 'bg-[#ff6b00]' : 'bg-[#00f0ff]'}`} />
              <span>
                {isOwner
                  ? 'FLEET STRATEGIC COMMAND'
                  : isManager
                  ? 'SECTOR DISPATCH & COMBAT DECK'
                  : 'FIELD DEPLOYMENT TERMINAL'}
              </span>
            </h1>
            <Badge
              variant={isOwner ? 'gold' : isManager ? 'warning' : 'cyan'}
              size="sm"
            >
              {user?.role}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#9da8b9] mt-1 font-mono">
            <span className="flex items-center gap-1">
              <IconMapPin size={12} className="text-[#00f0ff]" />
              <span>{user?.primaryBranchName ? `STATION // ${user.primaryBranchName.toUpperCase()}` : 'SECTOR // ALL_FLEET'}</span>
            </span>
            <span className="text-[#3c4558]">|</span>
            <span className="text-[#606c80]">
              SYS_TIME: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          {(isOwner || isManager) && (
            <Button
              variant="amber"
              size="md"
              onClick={() => {
                setBroadcastTitle('');
                setBroadcastContent('');
                setBroadcastTargetType('BRANCH');
                setBroadcastBranchId(user?.primaryBranchId || branches?.[0]?.id || '');
                setBroadcastError(null);
                setIsBroadcastModalOpen(true);
              }}
              className="gap-2"
            >
              <IconMegaphone size={14} />
              <span>[ BROADCAST NOTICE ]</span>
            </Button>
          )}

          <Link to="/attendance">
            <Button variant="cyan" size="md" className="gap-2">
              <IconClock size={14} />
              <span>[ CLOCK TERMINAL ]</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real-time WebSocket Event Telemetry Ticker */}
      {lastEvent && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#11141a] border border-[#262c38] text-xs font-mono clip-chamfer-btn">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-[#00f0ff] tracking-widest">[ TELEMETRY ]</span>
            <span className="text-[#f1f5f9] truncate">{formatEventSummary(lastEvent)}</span>
          </div>
          <span className="text-[11px] font-mono text-[#606c80] ml-4 flex-shrink-0 tabular-nums">
            {new Date(lastEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3A. STAFF VIEW — THE "FIELD DEPLOYMENT TERMINAL"                            */}
      {/* ========================================================================= */}
      {isStaff && (
        <div className="space-y-6">
          {/* Hero Active Shift & Clock-In Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Primary HUD Card */}
            <Card className="lg:col-span-2 p-6 space-y-5 border-l-4 border-l-[#00f0ff] relative overflow-hidden" chamfer>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262c38]">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00f0ff] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00f0ff]" />
                    <span>FIELD OPERATOR STATUS HUD</span>
                  </span>
                  <h2 className="text-lg font-mono font-bold text-white mt-1">
                    {isCurrentlyClockedIn ? 'DEPLOYMENT ACTIVE // ON DUTY' : 'READY FOR SHIFT PUNCH-IN'}
                  </h2>
                </div>
                <Badge variant={isCurrentlyClockedIn ? 'success' : 'cyan'} size="md">
                  {isCurrentlyClockedIn ? '// CLOCKED_IN' : '// STANDBY'}
                </Badge>
              </div>

              {/* Shift Spec Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 bg-[#161922] border border-[#262c38]">
                  <span className="text-[#606c80] block text-[10px] uppercase">Assigned Shift</span>
                  <span className="text-white font-bold truncate block mt-0.5">
                    {currentShift ? currentShift.name : 'No Scheduled Shift'}
                  </span>
                </div>
                <div className="p-3 bg-[#161922] border border-[#262c38]">
                  <span className="text-[#606c80] block text-[10px] uppercase">Scheduled Window</span>
                  <span className="text-[#00f0ff] font-bold block mt-0.5">
                    {currentShift
                      ? `${new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(currentShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Standby'}
                  </span>
                </div>
                <div className="p-3 bg-[#161922] border border-[#262c38] col-span-2 sm:col-span-1">
                  <span className="text-[#606c80] block text-[10px] uppercase">Last Punch Time</span>
                  <span className="text-[#e5c07b] font-bold block mt-0.5">
                    {latestAttendance?.checkInAt
                      ? new Date(latestAttendance.checkInAt).toLocaleTimeString()
                      : 'None today'}
                  </span>
                </div>
              </div>

              {/* Massive Tactical Action Switch */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link to="/attendance" className="w-full sm:w-auto flex-1">
                  <Button
                    variant={isCurrentlyClockedIn ? 'amber' : 'primary'}
                    size="lg"
                    className="w-full text-sm font-bold tracking-widest gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                  >
                    <IconClock size={16} />
                    <span>{isCurrentlyClockedIn ? '[ PROCEED TO CHECK-OUT ]' : '[ INITIATE SHIFT CLOCK-IN ]'}</span>
                  </Button>
                </Link>

                <Link to="/issues">
                  <Button variant="danger" size="lg" className="w-full sm:w-auto gap-2">
                    <IconAlertTriangle size={15} />
                    <span>[ REPORT INCIDENT ]</span>
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Shift Tasks Quick Docket */}
            <Card className="p-5 space-y-4 border border-[#262c38]" chamfer>
              <div className="flex items-center justify-between pb-3 border-b border-[#262c38]">
                <div className="flex items-center gap-2">
                  <IconCheckList size={16} className="text-[#00f0ff]" />
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    MISSION CHECKLIST
                  </h3>
                </div>
                <Link to="/tasks" className="text-[11px] font-mono text-[#00f0ff] hover:underline flex items-center gap-0.5">
                  <span>VIEW ALL</span>
                  <IconArrowUpRight size={11} />
                </Link>
              </div>

              <div className="space-y-2">
                {myTasks && myTasks.length > 0 ? (
                  myTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 bg-[#161922] border border-[#262c38] flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[#f1f5f9] truncate block">{task.title}</span>
                        <span className="text-[10px] text-[#606c80] mt-0.5 block">
                          Priority: {task.priority}
                        </span>
                      </div>
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : 'cyan'} size="sm">
                        {task.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs font-mono text-[#606c80]">
                    [ NO ACTIVE TASKS ASSIGNED ]
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3B. MANAGER VIEW — SECTOR DISPATCH & COMBAT DECK                           */}
      {/* ========================================================================= */}
      {isManager && (
        <div className="space-y-6">
          {/* Tactical KPI Strips */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card compact className="space-y-1.5 border-l-2 border-l-[#ff6b00]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff6b00]">SECTOR ID</span>
                <IconBuilding size={14} className="text-[#ff6b00]" />
              </div>
              <div className="text-lg font-bold font-mono text-white truncate">
                {user?.primaryBranchName || 'ASSIGNED SECTOR'}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                Primary Branch Jurisdiction
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#00f0ff]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff]">COMMUNICATIONS</span>
                <IconMegaphone size={14} className="text-[#00f0ff]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {announcements ? announcements.length : 0}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                Active Branch Notices
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#00e676]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00e676]">TELEMETRY LINK</span>
                <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {health?.status || 'ONLINE'}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                PostgreSQL Core Verified
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#e5c07b]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e5c07b]">SECURITY CLEARANCE</span>
                <IconCheck size={14} className="text-[#e5c07b]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                LEVEL 2
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                Sector Command Active
              </div>
            </Card>
          </div>

          {/* Quick Dispatch Modules */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/shifts" className="p-4 bg-[#11141a] border border-[#262c38] hover:border-[#ff6b00] transition-colors clip-chamfer-btn flex flex-col justify-between min-h-[95px] group">
              <div className="flex items-center justify-between text-[#9da8b9] group-hover:text-[#ff6b00]">
                <IconCalendar size={18} />
                <span className="text-[10px] font-mono">01</span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block uppercase">ROSTER & SCHEDULE</span>
                <span className="text-[11px] text-[#606c80] font-mono">Author & assign shifts</span>
              </div>
            </Link>

            <Link to="/attendance" className="p-4 bg-[#11141a] border border-[#262c38] hover:border-[#00f0ff] transition-colors clip-chamfer-btn flex flex-col justify-between min-h-[95px] group">
              <div className="flex items-center justify-between text-[#9da8b9] group-hover:text-[#00f0ff]">
                <IconClock size={18} />
                <span className="text-[10px] font-mono">02</span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block uppercase">FLOOR ATTENDANCE</span>
                <span className="text-[11px] text-[#606c80] font-mono">Realtime check-in radar</span>
              </div>
            </Link>

            <Link to="/issues" className="p-4 bg-[#11141a] border border-[#262c38] hover:border-[#ff1744] transition-colors clip-chamfer-btn flex flex-col justify-between min-h-[95px] group">
              <div className="flex items-center justify-between text-[#9da8b9] group-hover:text-[#ff1744]">
                <IconAlertTriangle size={18} />
                <span className="text-[10px] font-mono">03</span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block uppercase">INCIDENT TRIAGE</span>
                <span className="text-[11px] text-[#606c80] font-mono">Floor issues & evidence</span>
              </div>
            </Link>

            <Link to="/handovers" className="p-4 bg-[#11141a] border border-[#262c38] hover:border-[#ff6b00] transition-colors clip-chamfer-btn flex flex-col justify-between min-h-[95px] group">
              <div className="flex items-center justify-between text-[#9da8b9] group-hover:text-[#ff6b00]">
                <IconHandshake size={18} />
                <span className="text-[10px] font-mono">04</span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white block uppercase">SHIFT HANDOVERS</span>
                <span className="text-[11px] text-[#606c80] font-mono">Supervisor debrief sign-off</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3C. OWNER VIEW — FLEET STRATEGIC COMMAND                                   */}
      {/* ========================================================================= */}
      {isOwner && (
        <div className="space-y-6">
          {/* Fleet Telemetry Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card compact className="space-y-1.5 border-l-2 border-l-[#e5c07b]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e5c07b]">FLEET SECTORS</span>
                <IconBuilding size={14} className="text-[#e5c07b]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {branches ? branches.length : '—'}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                {branches?.filter((b) => b.active).length || 0} active branches online
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#00f0ff]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff]">FLEET BROADCASTS</span>
                <IconMegaphone size={14} className="text-[#00f0ff]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {announcements ? announcements.length : 0}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                Organization notices dispatched
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#00e676]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00e676]">CORE DATABASE</span>
                <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {health?.status || 'ONLINE'}
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                PostgreSQL 16 · Flyway Migrations V1-V13
              </div>
            </Card>

            <Card compact className="space-y-1.5 border-l-2 border-l-[#ff6b00]" chamfer>
              <div className="flex items-center justify-between text-[#9da8b9]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff6b00]">GOVERNANCE POLICY</span>
                <IconCheck size={14} className="text-[#ff6b00]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                ENFORCED
              </div>
              <div className="text-[11px] text-[#606c80] font-mono">
                Role-Based Access Control
              </div>
            </Card>
          </div>

          {/* Operating Sectors Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9da8b9]">
                OPERATING FLEET SECTORS (BRANCHES)
              </span>
              <Link to="/branches" className="text-xs font-mono text-[#00f0ff] hover:underline flex items-center gap-1">
                <span>MANAGE SECTORS</span>
                <IconArrowUpRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {branches?.map((branch) => (
                <Card key={branch.id} className="p-4 border border-[#262c38] space-y-2.5" chamfer>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-mono font-bold text-white text-sm">{branch.name}</h3>
                      <p className="text-[11px] font-mono text-[#9da8b9] flex items-center gap-1 mt-0.5">
                        <IconMapPin size={11} className="text-[#00f0ff]" />
                        <span>{branch.address || 'Address unassigned'}</span>
                      </p>
                    </div>
                    <Badge variant={branch.active ? 'success' : 'neutral'} size="sm">
                      {branch.active ? 'ACTIVE' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-[#1e222b] flex items-center justify-between text-[11px] font-mono text-[#606c80]">
                    <span>BRANCH_ID: {branch.id.slice(0, 8)}...</span>
                    <Link to="/shifts" className="text-[#00f0ff] hover:underline">
                      VIEW ROSTER →
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
      <div className="space-y-3 pt-4 border-t border-[#262c38]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#00f0ff]" />
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              OPERATIONAL BROADCASTS
            </h2>
            {announcements && announcements.length > 0 && (
              <Badge variant="cyan" size="sm">
                {announcements.length} TRANSMISSIONS
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
              className="text-xs font-mono text-[#00f0ff] hover:underline cursor-pointer flex items-center gap-1"
            >
              <IconPlus size={13} />
              <span>[ TRANSMIT NOTICE ]</span>
            </button>
          )}
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {announcements.map((ann) => (
              <Card key={ann.id} accent="blue" className="p-4 space-y-2 border border-[#262c38]" chamfer>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono font-bold text-white text-xs truncate">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#606c80] mt-0.5">
                      <span>ORIGIN: {ann.createdByName}</span>
                      <span>·</span>
                      <span>{new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={ann.targetType === 'ORGANIZATION' ? 'urgent' : 'cyan'} size="sm">
                    {ann.targetType === 'ORGANIZATION' ? 'ORG_WIDE' : ann.branchName || 'SECTOR'}
                  </Badge>
                </div>
                <p className="text-xs text-[#9da8b9] whitespace-pre-line leading-relaxed font-sans">
                  {ann.content}
                </p>
                {ann.targetShiftName && (
                  <div className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-0.5 inline-block">
                    TARGET_SHIFT: {ann.targetShiftName}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-[#606c80] text-xs font-mono" chamfer>
            <div className="w-8 h-8 bg-[#181c24] border border-[#262c38] flex items-center justify-center text-[#606c80] mx-auto mb-2">
              <IconMegaphone size={16} />
            </div>
            <p className="font-bold text-white uppercase tracking-wider">NO ACTIVE BROADCASTS</p>
            <p className="text-[#606c80] text-[11px] mt-0.5">
              Normal operational conditions reported across all sectors.
            </p>
          </Card>
        )}
      </div>

      {/* Broadcast Announcement Tactical Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="TRANSMIT OPERATIONAL NOTICE"
        description="Broadcast mission update to shift personnel across sectors"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          {broadcastError && (
            <div className="p-3 text-xs font-mono text-[#ff335c] bg-[#ff1744]/10 border border-[#ff1744]/30 rounded-sm">
              [TRANSMIT_ERR]: {broadcastError}
            </div>
          )}

          <Input
            label="NOTICE HEADLINE"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Mandatory Shift Coverage for Evening Sector"
            maxLength={150}
            required
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-semibold uppercase text-[#9da8b9]">TARGET AUDIENCE</label>
              <select
                className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">Specific Branch Sector</option>
                <option value="ORGANIZATION">Organization-Wide (All Fleet Sectors)</option>
              </select>
            </div>
          )}

          {broadcastTargetType === 'BRANCH' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-semibold uppercase text-[#9da8b9]">SECTOR SELECTION</label>
              <select
                className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
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
            <label className="text-xs font-mono font-semibold uppercase text-[#9da8b9]">TRANSMISSION DETAILS</label>
            <textarea
              className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff] min-h-[110px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter exact operational directives or instructions..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#262c38]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBroadcastModalOpen(false)}
            >
              [ CANCEL ]
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={broadcastMutation.isPending}
            >
              {broadcastMutation.isPending ? 'TRANSMITTING...' : '[ TRANSMIT NOTICE ]'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
