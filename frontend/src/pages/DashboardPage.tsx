import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ApiResponse,
  Branch,
  Shift,
  Attendance,
  Task,
  TaskStatus,
  ShiftHandover,
  Announcement,
  AnnouncementTargetType,
  IssueSummary,
  PagedResponse,
} from '../lib/types';
import { Button, Modal, Input } from '../components/ui';
import {
  IconClock,
  IconCheckList,
  IconCheck,
  IconAlertTriangle,
  IconHandshake,
  IconMegaphone,
  IconArrowUpRight,
  IconUsers,
  IconBuilding,
  IconClose,
} from '../components/ui/Icons';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { status: wsStatus, lastEvent, subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();

  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Live Clock state for tactile hardware chronometer
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected branch for Manager / Owner
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.primaryBranchId || '');

  // Subscribe to real-time branch channel for Owner / Manager
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Operational wire events log (real-time STOMP feed)
  const [liveEventFeed, setLiveEventFeed] = useState<{ id: string; time: string; text: string; type: string }[]>([]);

  useEffect(() => {
    if (!lastEvent) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let desc = lastEvent.eventType.replace(/_/g, ' ').toLowerCase();

    const payload = (lastEvent.payload || {}) as Record<string, unknown>;
    switch (lastEvent.eventType) {
      case 'STAFF_CHECKED_IN':
        desc = `${payload.staffName || 'Staff member'} clocked in`;
        break;
      case 'STAFF_CHECKED_OUT':
        desc = `${payload.staffName || 'Staff member'} clocked out`;
        break;
      case 'TASK_COMPLETED':
        desc = `Task completed: ${payload.taskTitle || 'Checklist routine'}`;
        break;
      case 'TASK_STATUS_CHANGED':
        desc = `Task updated: ${payload.taskTitle || 'Checklist routine'} (${payload.status || ''})`;
        break;
      case 'ISSUE_STATUS_CHANGED':
        desc = `Incident updated: ${payload.title || 'Reported issue'}`;
        break;
      case 'HANDOVER_SUBMITTED':
        desc = `Shift handover submitted: ${payload.shiftName || 'Outgoing shift'}`;
        break;
      case 'HANDOVER_ACKNOWLEDGED':
        desc = `Shift handover acknowledged by manager`;
        break;
      case 'ANNOUNCEMENT_PUBLISHED':
        desc = `New announcement: ${payload.title || 'Broadcast memo'}`;
        break;
      default:
        break;
    }

    setLiveEventFeed((prev) => [
      { id: `${Date.now()}-${Math.random()}`, time: nowStr, text: desc, type: lastEvent.eventType },
      ...prev.slice(0, 9),
    ]);
  }, [lastEvent]);

  // Modal states
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetType, setBroadcastTargetType] = useState<AnnouncementTargetType>('BRANCH');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const [acknowledgingHandover, setAcknowledgingHandover] = useState<ShiftHandover | null>(null);
  const [ackNotes, setAckNotes] = useState('');

  // -------------------------------------------------------------
  // QUERIES: Branches (Owner / Manager)
  // -------------------------------------------------------------
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  useEffect(() => {
    if (!selectedBranchId && branches && branches.length > 0) {
      const active = branches.find((b) => b.active) || branches[0];
      if (active) setSelectedBranchId(active.id);
    }
  }, [branches, selectedBranchId]);

  // Active operating branch object
  const currentBranch = useMemo(() => {
    if (!branches) return null;
    return branches.find((b) => b.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // -------------------------------------------------------------
  // QUERIES: Active Announcements (All roles)
  // -------------------------------------------------------------
  const { data: announcements, refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['announcements', 'my'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Announcement[]>>('/announcements/my');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // -------------------------------------------------------------
  // QUERIES: Staff Specific
  // -------------------------------------------------------------
  // 1. Staff's assigned shifts today
  const { data: myShifts, isLoading: isLoadingMyShifts } = useQuery<Shift[]>({
    queryKey: ['my-shifts-today'],
    queryFn: async () => {
      const start = new Date();
      start.setHours(start.getHours() - 14);
      const end = new Date();
      end.setHours(end.getHours() + 18);
      const res = await api.get<ApiResponse<Shift[]>>('/shifts/my-shifts', {
        params: { startDate: start.toISOString(), endDate: end.toISOString() },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // 2. Staff's attendance record today
  const { data: myAttendanceList } = useQuery<Attendance[]>({
    queryKey: ['my-attendance-today'],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const res = await api.get<ApiResponse<Attendance[]>>('/attendance/my', {
        params: { startDate: start.toISOString(), endDate: end.toISOString() },
      });
      return res.data.data;
    },
    enabled: isStaff,
  });

  // 3. Staff's assigned tasks
  const { data: myTasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['my-tasks-today'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>('/tasks/my');
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Active shift for staff member
  const currentStaffShift = useMemo(() => {
    if (!myShifts || myShifts.length === 0) return null;
    const now = currentTime.getTime();
    return (
      myShifts.find((s) => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        return now >= start - 15 * 60 * 1000 && now <= end + 60 * 60 * 1000;
      }) || myShifts[0]
    );
  }, [myShifts, currentTime]);

  const currentAssignment = useMemo(() => {
    if (!currentStaffShift || !user) return null;
    return currentStaffShift.assignments?.find((a) => a.userId === user.id);
  }, [currentStaffShift, user]);

  const currentAttendance = useMemo(() => {
    if (!currentAssignment || !myAttendanceList) return null;
    return myAttendanceList.find((att) => att.shiftAssignmentId === currentAssignment.id);
  }, [currentAssignment, myAttendanceList]);

  // -------------------------------------------------------------
  // QUERIES: Manager & Owner Specific
  // -------------------------------------------------------------
  // 1. Branch floor attendance today
  const { data: branchAttendance } = useQuery<Attendance[]>({
    queryKey: ['branch-attendance-today', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const res = await api.get<ApiResponse<Attendance[]>>(`/branches/${selectedBranchId}/attendance`, {
        params: { startDate: start.toISOString(), endDate: end.toISOString() },
      });
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // 2. Branch tasks today
  const { data: branchTasks } = useQuery<Task[]>({
    queryKey: ['branch-tasks-today', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<Task[]>>(`/branches/${selectedBranchId}/tasks`);
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // 3. Branch issues summary
  const { data: branchIssuesPage } = useQuery<PagedResponse<IssueSummary>>({
    queryKey: ['branch-issues-summary-page', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return { content: [], totalElements: 0, totalPages: 0, size: 20, page: 0, first: true, last: true, empty: true };
      const res = await api.get<ApiResponse<PagedResponse<IssueSummary>>>(`/branches/${selectedBranchId}/issues?size=15`);
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // 4. Latest handover for branch
  const { data: latestHandover } = useQuery<ShiftHandover | null>({
    queryKey: ['branch-latest-handover-dash', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return null;
      try {
        const res = await api.get<ApiResponse<ShiftHandover>>(`/branches/${selectedBranchId}/handovers/latest`);
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // -------------------------------------------------------------
  // MUTATIONS: Clock In & Clock Out
  // -------------------------------------------------------------
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(`/attendance/${assignmentId}/check-in`);
      return res.data;
    },
    onSuccess: (data) => {
      setPunchFeedback(`Checked in: ${data.data.status}${data.data.late ? ' (Late)' : ' (On-Time)'}`);
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-attendance-today'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error?.message || 'Check-in failed.';
      setPunchFeedback(msg);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(`/attendance/${assignmentId}/check-out`);
      return res.data;
    },
    onSuccess: () => {
      setPunchFeedback('Checked out successfully. Shift completed.');
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-attendance-today'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error?.message || 'Check-out failed.';
      setPunchFeedback(msg);
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Task Status Advance
  // -------------------------------------------------------------
  const advanceTaskMutation = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status: nextStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-tasks-today'] });
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Broadcast Announcement
  // -------------------------------------------------------------
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const branchId = broadcastTargetType === 'ORGANIZATION' ? branches?.[0]?.id || selectedBranchId : selectedBranchId;
      if (!branchId) throw new Error('Operating branch is required');
      const res = await api.post<ApiResponse<Announcement>>(`/branches/${branchId}/announcements`, {
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        targetType: broadcastTargetType,
        publishImmediately: true,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastError(null);
      refetchAnnouncements();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error?.message || 'Failed to publish announcement';
      setBroadcastError(msg);
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Acknowledge Handover
  // -------------------------------------------------------------
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ handoverId, notes }: { handoverId: string; notes: string }) => {
      const res = await api.patch<ApiResponse<ShiftHandover>>(`/handovers/${handoverId}/acknowledge`, {
        notes,
      });
      return res.data;
    },
    onSuccess: () => {
      setAcknowledgingHandover(null);
      setAckNotes('');
      queryClient.invalidateQueries({ queryKey: ['branch-latest-handover-dash'] });
    },
  });

  // Clock calculations for physical analog dial
  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  // Punch readiness check
  const punchState = useMemo(() => {
    if (!currentStaffShift || !currentAssignment) {
      return { canIn: false, canOut: false, isCompleted: false, label: 'No Shift Assigned' };
    }
    const now = currentTime.getTime();
    const start = new Date(currentStaffShift.startTime).getTime();
    const end = new Date(currentStaffShift.endTime).getTime();
    const earlyOpen = start - 15 * 60 * 1000;

    if (!currentAttendance) {
      if (now < earlyOpen) {
        return { canIn: false, canOut: false, isCompleted: false, label: 'Punches open 15m prior' };
      }
      if (now > end) {
        return { canIn: false, canOut: false, isCompleted: false, label: 'Shift window closed' };
      }
      return { canIn: true, canOut: false, isCompleted: false, label: 'Ready to Clock In' };
    }

    if ((currentAttendance.status === 'PRESENT' || currentAttendance.status === 'LATE') && !currentAttendance.checkOutAt) {
      return { canIn: false, canOut: true, isCompleted: false, label: 'Active on Shift' };
    }

    if (currentAttendance.checkOutAt) {
      return { canIn: false, canOut: false, isCompleted: true, label: 'Shift Completed' };
    }

    return { canIn: false, canOut: false, isCompleted: false, label: currentAttendance.status };
  }, [currentStaffShift, currentAssignment, currentAttendance, currentTime]);

  return (
    <div className="space-y-6 pb-10 text-[#0F172A]">
      {/* ------------------------------------------------------------- */}
      {/* TOP DECK: Identity & Operations Control Header */}
      {/* ------------------------------------------------------------- */}
      {isStaff ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Physical Access Badge Slotted into Reader Dock */}
            <div className="relative shrink-0 select-none">
              <div className="w-13 h-16 sm:w-14 sm:h-17 rounded-xl bg-white border border-slate-300 shadow-[0_3px_8px_rgba(15,23,42,0.08),inset_0_1px_0_#FFFFFF] p-1.5 flex flex-col items-center justify-between">
                <div className="w-full flex items-center justify-between px-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]" />
                  <span className="text-[11px] font-mono font-bold text-slate-500">RFID</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'ST'}
                </div>
                <div className="w-full flex items-center justify-center gap-0.5 px-0.5">
                  <span className="w-0.5 h-2 bg-slate-800" />
                  <span className="w-1 h-2 bg-slate-400" />
                  <span className="w-0.5 h-2 bg-slate-800" />
                  <span className="w-1.5 h-2 bg-slate-800" />
                  <span className="w-0.5 h-2 bg-slate-400" />
                </div>
              </div>
            </div>

            {/* Badge Reader Terminal Readout */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A]">
                  {user?.fullName || 'Shift Associate'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-300/80">
                  ID #{user?.id ? (user.id.includes('-') ? `EMP-${user.id.split('-').pop()}` : user.id.slice(-6)).toUpperCase() : 'EMP-01'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {punchState.label}
                </span>
              </div>
              <p className="text-[13px] text-[#475569] flex items-center gap-2 flex-wrap">
                <span>{user?.primaryBranchName || 'Shibuya Flagship'}</span>
                <span>·</span>
                <span>Station Terminal #01</span>
                <span>·</span>
                <span className="text-slate-500">RFID Reader Active</span>
              </p>
            </div>
          </div>

          {/* Quick Schedule Telemetry */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200/90 shadow-[inset_0_1px_0_#FFFFFF] text-left">
              <span className="text-xs font-medium text-slate-500 block">Today&apos;s Assignment</span>
              <span className="text-sm font-bold text-[#0F172A]">
                {currentStaffShift ? currentStaffShift.name || 'Assigned Shift' : 'Roster Standby'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/60 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.05),inset_0_1.5px_0_0_#FFFFFF]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-base shadow-md shadow-slate-900/10">
              {isManager ? 'MG' : 'HQ'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">
                  Operations Command · {currentBranch?.name || user?.primaryBranchName || 'Fleet'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1]/70 shadow-[inset_0_1px_0_#FFFFFF]">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Floor attendance tracking, shift routines execution, and incident escalations.
              </p>
            </div>
          </div>

          {/* Manager Branch Selector & Quick Actions */}
          <div className="flex items-center gap-2.5">
            {(isOwner || isManager) && branches && branches.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1]/70 text-xs font-medium shadow-xs">
                <IconBuilding size={14} className="text-[#64748B]" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-[#0F172A] font-semibold focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {!b.active && '(Inactive)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(isOwner || isManager) && (
              <Button
                variant="dark"
                size="sm"
                onClick={() => setIsBroadcastOpen(true)}
                className="gap-1.5 shadow-[0_2px_6px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] rounded-xl"
              >
                <IconMegaphone size={14} />
                <span>Broadcast Notice</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: Operational Broadcast Announcements Banner */}
      {/* ------------------------------------------------------------- */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1 text-[#475569] font-medium">
            <span className="flex items-center gap-1.5">
              <IconMegaphone size={14} className="text-[#0F172A]" />
              <span>Active Operations Bulletins</span>
            </span>
            <span className="text-[11px] tabular-nums font-semibold">{announcements.length} posted</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A]/80 shadow-[0_2px_8px_rgba(217,119,6,0.05),inset_0_1px_0_#FFFFFF] flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-[#78350F] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                      {ann.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      {ann.targetType === 'ORGANIZATION' ? 'All Branches' : ann.branchName || 'Store Notice'}
                    </span>
                  </div>
                  <p className="text-xs text-[#92400E]/90 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#B45309] pt-2 border-t border-[#FDE68A]/60">
                  <span>Posted by {ann.createdByName}</span>
                  <span className="tabular-nums">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW: STAFF DASHBOARD EXPERIENCE                             */}
      {/* ============================================================= */}
      {isStaff && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: Hero Punch Clock Terminal (Skeuomorphic Hardware Chronometer) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] h-full flex flex-col justify-between">
              <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]/70">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                  <span className="text-sm font-bold tracking-tight text-[#0F172A]">Time Clock Station</span>
                </div>
                <span className="text-[13px] font-medium text-slate-600 tabular-nums">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Physical Analog Dial + Industrial Backlit Digital Readout */}
              <div className="flex items-center justify-center gap-6 px-6 py-5 bg-white/70 rounded-xl border border-[#CBD5E1]/80 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)]">
                <div className="relative w-24 h-24 rounded-full border-[3px] border-slate-300 bg-white shadow-[inset_0_3px_8px_rgba(15,23,42,0.1),0_2px_4px_rgba(0,0,0,0.04)] shrink-0 select-none">
                  {/* Subtle Cardinal Ticks */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-slate-400 rounded-full" />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-slate-400 rounded-full" />
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-slate-400 rounded-full" />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-slate-400 rounded-full" />

                  {/* Dial Center Pin with Metallic Core */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-xs z-20 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                  </div>
                  {/* Hour Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 w-[2.5px] h-7 bg-slate-900 rounded-t-full origin-bottom z-10"
                    style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }}
                  />
                  {/* Minute Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 w-[1.5px] h-9 bg-slate-600 rounded-t-full origin-bottom z-10"
                    style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }}
                  />
                  {/* Second Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 w-[1px] h-10 bg-rose-500 rounded-t-full origin-bottom z-10"
                    style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }}
                  />
                </div>

                {/* Digital Readout */}
                <div className="text-left space-y-1.5">
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                    <span>Server UTC Synced</span>
                  </div>
                </div>
              </div>

              {/* Shift Context Card: Stamped Timecard Bay */}
              {isLoadingMyShifts ? (
                <div className="py-6 text-center text-xs text-slate-500">Verifying schedule...</div>
              ) : currentStaffShift ? (
                <div className="p-4 rounded-xl bg-[#FFFDF7] border border-amber-200/90 space-y-2.5 shadow-[inset_0_1px_0_#FFFFFF,0_2px_6px_rgba(217,119,6,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-amber-200">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-amber-800 uppercase tracking-wider block">TIMECARD SLIP</span>
                      <span className="text-sm font-bold text-slate-900">
                        {currentStaffShift.name || 'Scheduled Floor Shift'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {punchState.label}
                    </span>
                  </div>

                  <div className="text-[13px] text-slate-700 flex items-center gap-1.5">
                    <IconClock size={14} className="text-slate-500" />
                    <span className="tabular-nums font-mono font-medium">
                      {new Date(currentStaffShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(currentStaffShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {currentAttendance && (
                    <div className="pt-2 border-t border-dashed border-amber-200/80 text-[13px] space-y-1 font-mono text-slate-700">
                      <div className="flex justify-between">
                        <span>PUNCH IN:</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {currentAttendance.checkInAt ? new Date(currentAttendance.checkInAt).toLocaleTimeString() : '—'}
                          {currentAttendance.late && <span className="text-amber-700 font-bold ml-1">[LATE]</span>}
                        </span>
                      </div>
                      {currentAttendance.checkOutAt && (
                        <div className="flex justify-between">
                          <span>PUNCH OUT:</span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {new Date(currentAttendance.checkOutAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFFDF7] border border-dashed border-slate-300 text-center space-y-1.5 shadow-[inset_0_1px_3px_rgba(15,23,42,0.02)]">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-semibold text-slate-600">
                    <span>TIMECARD BAY: EMPTY</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No Shift Scheduled Today</p>
                  <p className="text-[13px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Your attendance card will automatically slot into this bay when a shift is assigned.
                  </p>
                </div>
              )}

              {/* Hardware Tactile Punch Button */}
              {punchFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <span>{punchFeedback}</span>
                  <button onClick={() => setPunchFeedback(null)} className="cursor-pointer">
                    <IconClose size={12} />
                  </button>
                </div>
              )}

              {/* Heavy Industrial Mechanical Punch Switch */}
              <div className="pt-1">
                {currentAssignment && punchState.canIn && (
                  <button
                    type="button"
                    disabled={checkInMutation.isPending}
                    onClick={() => checkInMutation.mutate(currentAssignment.id)}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-tight flex items-center justify-center gap-2.5 shadow-[0_5px_0_#047857,0_8px_16px_rgba(4,120,87,0.3),inset_0_1.5px_0_rgba(255,255,255,0.4)] active:translate-y-1 active:shadow-[0_1px_0_#047857] cursor-pointer select-none"
                  >
                    <IconClock size={16} />
                    <span>{checkInMutation.isPending ? 'Stamping Attendance...' : 'Punch In (Start Shift)'}</span>
                  </button>
                )}

                {currentAssignment && punchState.canOut && (
                  <button
                    type="button"
                    disabled={checkOutMutation.isPending}
                    onClick={() => checkOutMutation.mutate(currentAssignment.id)}
                    className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm tracking-tight flex items-center justify-center gap-2.5 shadow-[0_5px_0_#92400e,0_8px_16px_rgba(180,83,9,0.3),inset_0_1.5px_0_rgba(255,255,255,0.4)] active:translate-y-1 active:shadow-[0_1px_0_#92400e] cursor-pointer select-none"
                  >
                    <IconClock size={16} />
                    <span>{checkOutMutation.isPending ? 'Recording Check-Out...' : 'Punch Out (End Shift)'}</span>
                  </button>
                )}

                {(!currentAssignment || (!punchState.canIn && !punchState.canOut)) && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-0.5">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      {punchState.isCompleted ? 'Shift Concluded' : 'Punch Switch Standby'}
                    </span>
                    <span className="text-[13px] text-slate-600 block leading-relaxed">
                      {punchState.isCompleted
                        ? 'Attendance record finalized for today.'
                        : currentStaffShift
                        ? 'Clock-in mechanism unlocks 15m before shift start.'
                        : 'Awaiting shift roster assignment.'}
                    </span>
                  </div>
                )}
              </div>

              </div>

              <div className="flex justify-between items-center text-xs text-[#64748B] pt-3 border-t border-[#E2E8F0] mt-4">
                <Link to="/attendance" className="hover:text-[#0F172A] font-semibold flex items-center gap-1">
                  <span>View Attendance Ledger</span>
                  <IconArrowUpRight size={11} />
                </Link>
                <Link to="/handovers" className="hover:text-[#0F172A] font-semibold flex items-center gap-1">
                  <span>Shift Turnover</span>
                  <IconArrowUpRight size={11} />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: My Shift Assigned Tasks & Routines */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] h-full flex flex-col justify-between relative">
              {/* Clipboard Clamp Anchor */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-2.5 rounded-b bg-slate-300 border border-slate-400 shadow-xs flex items-center justify-center">
                <div className="w-8 h-0.5 rounded-full bg-slate-400" />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]/70">
                  <div>
                    <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <IconCheckList size={17} className="text-[#0F172A]" />
                      <span>My Assigned Checklist & Tasks</span>
                    </h2>
                    <p className="text-[13px] text-[#64748B] mt-0.5">
                      Operational routines assigned to you for execution today
                    </p>
                  </div>

                  <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
                    <span className="tabular-nums">
                      {myTasks ? myTasks.filter((t) => t.status === 'COMPLETED').length : 0} / {myTasks?.length || 0}
                    </span>
                    <span className="text-slate-600 font-medium">done</span>
                  </div>
                </div>

                {isLoadingTasks ? (
                  <div className="flex-1 flex items-center justify-center py-12 text-center text-xs text-[#64748B]">
                    Loading your shift tasks...
                  </div>
                ) : !myTasks || myTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#FFFDF7]/70 p-6 my-4 text-center shadow-[inset_0_1px_3px_rgba(15,23,42,0.02)]">
                    <IconCheckList size={28} className="text-slate-400 mb-2.5" />
                    <p className="text-sm font-semibold text-slate-800">No Checklist Assigned</p>
                    <p className="text-[13px] text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                      Routine operational checklist items will populate here when the shift floor opens.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 my-4 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {myTasks.map((task) => {
                    const isCompleted = task.status === 'COMPLETED';
                    const isInProgress = task.status === 'IN_PROGRESS';

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isCompleted
                            ? 'bg-white/40 border-[#E2E8F0] opacity-75'
                            : isInProgress
                            ? 'bg-white border-[#38BDF8]/80 shadow-[0_2px_8px_rgba(56,189,248,0.1),inset_0_1px_0_#FFFFFF]'
                            : 'bg-white border-[#CBD5E1]/70 shadow-2xs hover:border-[#94A3B8]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Tactile Status Advance Button */}
                          <button
                            type="button"
                            disabled={isCompleted || advanceTaskMutation.isPending}
                            onClick={() => {
                              const next = task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED';
                              advanceTaskMutation.mutate({ taskId: task.id, nextStatus: next });
                            }}
                            className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isInProgress
                                ? 'border-2 border-sky-500 bg-sky-50 text-sky-600'
                                : 'border-2 border-[#94A3B8] hover:border-[#0F172A] bg-white'
                            }`}
                            title={`Advance: ${task.status} -> ${task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED'}`}
                          >
                            {isCompleted ? <IconCheck size={12} /> : isInProgress ? <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> : null}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>
                                {task.title}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-xs font-semibold uppercase ${
                                  task.priority === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-[#64748B] mt-0.5 truncate">{task.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-tight ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs mt-4">
              <span className="text-[#64748B] text-xs">Click checkbox to advance: Todo → In Progress → Done</span>
              <Link to="/tasks" className="text-[#0F172A] font-semibold text-sm flex items-center gap-1 hover:underline">
                <span>Open Full Task Board</span>
                <IconArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Upcoming Shifts This Week */}
      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <IconClock size={16} className="text-[#0F172A]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Upcoming Shifts This Week</h3>
          </div>
          <Link to="/shifts" className="text-sm font-semibold text-[#0F172A] hover:underline flex items-center gap-1">
            <span>View Full Roster</span>
            <IconArrowUpRight size={11} />
          </Link>
        </div>

        <div className="mt-4">
          {!myShifts || myShifts.length <= 1 ? (
            <div className="py-5 text-center text-[13px] text-slate-600 leading-relaxed">
              No other shifts scheduled for this week. Check the roster for upcoming assignments.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {myShifts.slice(1, 4).map((shift) => (
                <div key={shift.id} className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0F172A]">{shift.name || 'Shift'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {new Date(shift.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-[13px] text-slate-700 flex items-center gap-1">
                    <IconClock size={13} className="text-slate-400" />
                    <span className="tabular-nums">
                      {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* ============================================================= */}
      {/* VIEW: MANAGER & OWNER DASHBOARD EXPERIENCE                    */}
      {/* ============================================================= */}
      {!isStaff && (
        <div className="space-y-5">
          {/* TOP METRIC TELEMETRY TILES (Floor Coverage & Operational Radios) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Tile 1: Present Staff */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04),inset_0_1.5px_0_0_#FFFFFF] flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                On Floor Now
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                {branchAttendance ? branchAttendance.filter((a) => (a.status === 'PRESENT' || a.status === 'LATE') && !a.checkOutAt).length : 0}
              </div>
              <span className="text-[11px] text-[#64748B] mt-1">Clocked in staff</span>
            </div>

            {/* Tile 2: Punctuality / Tardy Count */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04),inset_0_1.5px_0_0_#FFFFFF] flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Late Punches
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums mt-2">
                {branchAttendance ? branchAttendance.filter((a) => a.late).length : 0}
              </div>
              <span className="text-[11px] text-[#64748B] mt-1">Past scheduled start</span>
            </div>

            {/* Tile 3: Routine Tasks Completion */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04),inset_0_1.5px_0_0_#FFFFFF] flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <IconCheckList size={14} className="text-[#0F172A]" />
                Checklist Progress
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums mt-2">
                {branchTasks && branchTasks.length > 0
                  ? `${Math.round((branchTasks.filter((t) => t.status === 'COMPLETED').length / branchTasks.length) * 100)}%`
                  : '0%'}
              </div>
              <span className="text-[11px] text-[#64748B] mt-1">
                {branchTasks ? `${branchTasks.filter((t) => t.status === 'COMPLETED').length}/${branchTasks.length} tasks` : '0/0 tasks'}
              </span>
            </div>

            {/* Tile 4: Incident Radar */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.04),inset_0_1.5px_0_0_#FFFFFF] flex flex-col justify-between">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
                <IconAlertTriangle size={14} className="text-rose-600" />
                Active Incidents
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums mt-2">
                {branchIssuesPage
                  ? branchIssuesPage.content.filter((i) => i.status !== 'CLOSED' && i.status !== 'CANCELLED').length
                  : 0}
              </div>
              <span className="text-[11px] text-[#64748B] mt-1">Require resolution</span>
            </div>
          </div>

          {/* MAIN MANAGER SPLIT: Left (Floor Roster & Tasks) / Right (Turnover Debrief & Live Wire) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT 7-COL: Current Floor Roster & Tasks Backlog */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Live Floor Roster */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <IconUsers size={16} />
                    <span>Active Floor Coverage Roster</span>
                  </h3>
                  <Link to="/attendance" className="text-xs text-[#0F172A] font-semibold flex items-center gap-1 hover:underline">
                    <span>Attendance Log</span>
                    <IconArrowUpRight size={11} />
                  </Link>
                </div>

                {!branchAttendance || branchAttendance.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">No attendance punches recorded yet today.</div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {branchAttendance.slice(0, 6).map((att) => (
                      <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#0F172A] block">{att.userName}</span>
                          <span className="text-[11px] text-[#64748B]">
                            {att.shiftName || 'Floor Shift'} · In: {att.checkInAt ? new Date(att.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            att.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700'
                              : att.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Shift Checklist & Task Progress */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <IconCheckList size={16} />
                    <span>Store Routine Tasks</span>
                  </h3>
                  <Link to="/tasks" className="text-xs text-[#0F172A] font-semibold flex items-center gap-1 hover:underline">
                    <span>Manage Tasks</span>
                    <IconArrowUpRight size={11} />
                  </Link>
                </div>

                {!branchTasks || branchTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">No tasks active. Generate from template in Tasks tab.</div>
                ) : (
                  <div className="space-y-2">
                    {branchTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-white border border-[#CBD5E1]/60 flex items-center justify-between text-xs shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <span className={`font-medium block truncate ${t.status === 'COMPLETED' ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>
                            {t.title}
                          </span>
                          <span className="text-[11px] text-[#64748B]">Assigned to: {t.userName}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 uppercase ${
                            t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 5-COL: Turnover Debrief Sign-off & Live Operations Wire */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: Shift Turnover Status */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),inset_0_1.5px_0_0_#FFFFFF] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <IconHandshake size={16} />
                    <span>Shift Turnover & Handover</span>
                  </h3>
                  <Link to="/handovers" className="text-xs text-[#0F172A] font-semibold flex items-center gap-1 hover:underline">
                    <span>Full Log</span>
                    <IconArrowUpRight size={11} />
                  </Link>
                </div>

                {latestHandover ? (
                  <div className="p-3.5 rounded-xl bg-white border border-[#CBD5E1]/70 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">
                        {latestHandover.shiftName || 'Outgoing Shift Debrief'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          latestHandover.status === 'ACKNOWLEDGED'
                            ? 'bg-slate-100 text-slate-700'
                            : latestHandover.status === 'SUBMITTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {latestHandover.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] italic bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                      "{latestHandover.notes || 'No handover notes provided.'}"
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[#64748B] pt-1">
                      <div className="p-1.5 rounded-md bg-[#F1F5F9]">
                        <span className="font-bold text-[#0F172A] block text-xs tabular-nums">{latestHandover.summary?.completedTasks || 0}</span>
                        Tasks done
                      </div>
                      <div className="p-1.5 rounded-md bg-[#F1F5F9]">
                        <span className="font-bold text-[#0F172A] block text-xs tabular-nums">{latestHandover.summary?.pendingTasks || 0}</span>
                        Pending
                      </div>
                      <div className="p-1.5 rounded-md bg-[#F1F5F9]">
                        <span className="font-bold text-[#0F172A] block text-xs tabular-nums">{latestHandover.summary?.openBranchIssues || 0}</span>
                        Issues
                      </div>
                    </div>

                    {latestHandover.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => setAcknowledgingHandover(latestHandover)}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                      >
                        Sign & Acknowledge Handover
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[#64748B]">No shift handover recorded yet.</div>
                )}
              </div>

              {/* Card 2: Real-time STOMP Operations Wire */}
              <div className="p-5 rounded-2xl bg-[#0F172A] text-white border border-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        wsStatus === 'CONNECTED' ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <span className="text-xs font-bold tracking-tight uppercase">Live Operations Wire</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {wsStatus === 'CONNECTED' ? 'STOMP 1.2 Connected' : 'Syncing'}
                  </span>
                </div>

                <div className="space-y-2 min-h-[140px] max-h-[180px] overflow-y-auto text-xs font-mono">
                  {liveEventFeed.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-[11px]">
                      Awaiting live telemetry (check-ins, task progress, incident updates)...
                    </div>
                  ) : (
                    liveEventFeed.map((e) => (
                      <div key={e.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
                        <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">{e.time}</span>
                        <span className="text-slate-300 text-[11px] leading-snug">{e.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Broadcast Notice (Phase 8 Announcements)                */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Broadcast Store Operations Notice"
        description="Publish an immediate announcement bulletin to on-duty and upcoming staff"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            broadcastMutation.mutate();
          }}
          className="space-y-4"
        >
          {broadcastError && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {broadcastError}
            </div>
          )}

          <Input
            label="Notice Headline *"
            required
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Health Inspection at 14:00, Floor Coverage Alert"
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Audience</label>
              <select
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
              >
                <option value="BRANCH">Current Branch Only</option>
                <option value="ORGANIZATION">Organization-Wide (All Stores)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Notice Content *</label>
            <textarea
              required
              rows={4}
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter operational briefing, requirements, or staff safety notices..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="dark" size="sm" disabled={broadcastMutation.isPending}>
              {broadcastMutation.isPending ? 'Broadcasting...' : 'Publish Bulletin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Acknowledge Handover Sign-off                           */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={!!acknowledgingHandover}
        onClose={() => setAcknowledgingHandover(null)}
        title="Sign Shift Turnover Debrief"
        description="Formally acknowledge operational handover and assume floor responsibility"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-slate-900 block">
              Outgoing Shift: {acknowledgingHandover?.shiftName || 'Shift Turnover'}
            </span>
            <span className="text-slate-600">Submitted by: {acknowledgingHandover?.submittedByName || 'Staff lead'}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Manager Sign-off Remarks</label>
            <textarea
              rows={3}
              value={ackNotes}
              onChange={(e) => setAckNotes(e.target.value)}
              placeholder="e.g. Reviewed shift accomplishments, proceeding with pending tasks..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAcknowledgingHandover(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="dark"
              size="sm"
              disabled={acknowledgeMutation.isPending}
              onClick={() => {
                if (acknowledgingHandover) {
                  acknowledgeMutation.mutate({ handoverId: acknowledgingHandover.id, notes: ackNotes });
                }
              }}
            >
              {acknowledgeMutation.isPending ? 'Signing...' : 'Confirm Sign-off'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
