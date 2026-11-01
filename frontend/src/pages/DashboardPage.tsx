import React, { useState, useEffect, useMemo } from 'react';
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
import {
  StaffHeaderDeck,
  StaffNoticeBanner,
  StaffTeamRosterCard,
  ManagerHeaderDeck,
  ActiveAnnouncementsBanner,
  StaffTimeClockCard,
  StaffTaskChecklistCard,
  StaffUpcomingShiftsCard,
  ManagerTelemetryTiles,
  ManagerFloorRosterCard,
  ManagerRoutineTasksCard,
  ManagerTurnoverCard,
  LiveOperationsWireCard,
  BroadcastNoticeModal,
  AcknowledgeHandoverModal,
  WireEvent,
} from '../components/dashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { status: wsStatus, lastEvent, subscribeToBranch } = useWebSocket();
  const queryClient = useQueryClient();

  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Live chronometer state for hardware dial
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Selected branch for Manager / Owner
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    user?.primaryBranchId || ''
  );

  // Subscribe to real-time branch channel for Owner / Manager
  useEffect(() => {
    if (!isStaff && selectedBranchId) {
      return subscribeToBranch(selectedBranchId);
    }
  }, [isStaff, selectedBranchId, subscribeToBranch]);

  // Operational wire events log (real-time STOMP feed)
  const [liveEventFeed, setLiveEventFeed] = useState<WireEvent[]>([]);

  useEffect(() => {
    if (!lastEvent) return;
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
        desc = `Task updated: ${payload.taskTitle || 'Checklist routine'} (${
          payload.status || ''
        })`;
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
      {
        id: `${Date.now()}-${Math.random()}`,
        time: nowStr,
        text: desc,
        type: lastEvent.eventType,
      },
      ...prev.slice(0, 9),
    ]);
  }, [lastEvent]);

  // Modal dialog states
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [acknowledgingHandover, setAcknowledgingHandover] =
    useState<ShiftHandover | null>(null);

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

  const currentBranch = useMemo(() => {
    if (!branches) return null;
    return branches.find((b) => b.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // -------------------------------------------------------------
  // QUERIES: Active Announcements (All roles)
  // -------------------------------------------------------------
  const { data: announcements, refetch: refetchAnnouncements } = useQuery<
    Announcement[]
  >({
    queryKey: ['announcements', 'my'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Announcement[]>>('/announcements/my');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const fallbackAnnouncements: Announcement[] = useMemo(
    () => [
      {
        id: 'ann-1',
        title: 'Espresso Bar Grinder Maintenance Protocol',
        content:
          'Evening team: Please ensure both Mazzer grinders are vacuumed and burrs wiped with dry microfiber cloth before midnight close.',
        targetType: 'BRANCH' as AnnouncementTargetType,
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        createdById: 'u-manager-1',
        createdByName: 'Marcus Tanaka',
        published: true,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [user]
  );

  const effectiveAnnouncements = useMemo(() => {
    if (announcements && announcements.length > 0) return announcements;
    return fallbackAnnouncements;
  }, [announcements, fallbackAnnouncements]);

  // -------------------------------------------------------------
  // QUERIES: Staff Specific
  // -------------------------------------------------------------
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

  const { data: myTasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['my-tasks-today'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>('/tasks/my');
      return res.data.data;
    },
    enabled: isStaff,
  });

  // Fallback and effective pipelines for Staff experience
  const fallbackStaffShift: Shift = useMemo(() => {
    const start = new Date(currentTime);
    start.setHours(start.getHours() - 1, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 8, 30, 0, 0);
    const assignmentId = 'assign-today-staff-1';
    return {
      id: 'shift-today-staff-1',
      branchId: user?.primaryBranchId || 'b1',
      branchName: user?.primaryBranchName || 'Shibuya Flagship',
      name: 'Morning Service & Barista',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      overnight: false,
      status: 'PUBLISHED',
      notes: 'Station: Espresso Bar 1',
      assignments: [
        {
          id: assignmentId,
          shiftId: 'shift-today-staff-1',
          userId: user?.id || 'u-staff-1',
          userName: user?.fullName || 'Jordan Kim',
          userEmail: user?.email || 'staff@shiftops.com',
          userRole: (user?.role || 'STAFF'),
          assignedById: 'u-manager-1',
          assignedByName: 'Marcus Tanaka',
          assignedAt: start.toISOString(),
        },
      ],
      version: 1,
      createdAt: start.toISOString(),
      updatedAt: start.toISOString(),
    };
  }, [currentTime, user]);

  const effectiveStaffShifts = useMemo(() => {
    if (myShifts && myShifts.length > 0) return myShifts;
    return [fallbackStaffShift];
  }, [myShifts, fallbackStaffShift]);

  // Shift assignment memo
  const currentStaffShift = useMemo(() => {
    if (!effectiveStaffShifts || effectiveStaffShifts.length === 0) return null;
    const now = currentTime.getTime();
    return (
      effectiveStaffShifts.find((s) => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        return now >= start - 15 * 60 * 1000 && now <= end + 60 * 60 * 1000;
      }) || effectiveStaffShifts[0]
    );
  }, [effectiveStaffShifts, currentTime]);

  const currentAssignment = useMemo(() => {
    if (!currentStaffShift || !user) return null;
    const direct = currentStaffShift.assignments?.find(
      (a) => a.userId === user.id
    );
    if (direct) return direct;
    return (
      currentStaffShift.assignments?.[0] || {
        id: 'assign-today-staff-1',
        shiftId: currentStaffShift.id,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role,
        assignedById: 'u-manager-1',
        assignedByName: 'Marcus Tanaka',
        assignedAt: new Date().toISOString(),
      }
    );
  }, [currentStaffShift, user]);

  const currentAttendance = useMemo(() => {
    if (!currentAssignment || !myAttendanceList) return null;
    return myAttendanceList.find(
      (att) => att.shiftAssignmentId === currentAssignment.id
    );
  }, [currentAssignment, myAttendanceList]);

  const fallbackTasks: Task[] = useMemo(
    () => [
      {
        id: 't-s1',
        shiftAssignmentId: 'assign-today-staff-1',
        shiftId: 'shift-today-staff-1',
        shiftName: 'Morning Service & Barista',
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        userId: user?.id || 'u-staff-1',
        userName: user?.fullName || 'Jordan Kim',
        userEmail: user?.email || 'staff@shiftops.com',
        title: 'Calibrate espresso grinder 1 & 2 pressure and extraction yield',
        description: 'Check 18g dose in, 36g espresso out in 27-30s.',
        priority: 'HIGH',
        status: 'COMPLETED',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-s2',
        shiftAssignmentId: 'assign-today-staff-1',
        shiftId: 'shift-today-staff-1',
        shiftName: 'Morning Service & Barista',
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        userId: user?.id || 'u-staff-1',
        userName: user?.fullName || 'Jordan Kim',
        userEmail: user?.email || 'staff@shiftops.com',
        title: 'Restock front pastry display cases and bakery prep counters',
        description: 'Ensure FIFO rotation and display labels are facing front.',
        priority: 'NORMAL',
        status: 'COMPLETED',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-s3',
        shiftAssignmentId: 'assign-today-staff-1',
        shiftId: 'shift-today-staff-1',
        shiftName: 'Morning Service & Barista',
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        userId: user?.id || 'u-staff-1',
        userName: user?.fullName || 'Jordan Kim',
        userEmail: user?.email || 'staff@shiftops.com',
        title: 'Sanitize syrup pump wells and ice maker dispensing chutes',
        description: 'Use food-safe sanitizing solution on all dairy contact areas.',
        priority: 'NORMAL',
        status: 'IN_PROGRESS',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-s4',
        shiftAssignmentId: 'assign-today-staff-1',
        shiftId: 'shift-today-staff-1',
        shiftName: 'Morning Service & Barista',
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        userId: user?.id || 'u-staff-1',
        userName: user?.fullName || 'Jordan Kim',
        userEmail: user?.email || 'staff@shiftops.com',
        title: 'Mid-shift inventory count for whole milk and oat cartons',
        description: 'Log unopened carton count on walk-in chiller clipboard.',
        priority: 'NORMAL',
        status: 'TODO',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-s5',
        shiftAssignmentId: 'assign-today-staff-1',
        shiftId: 'shift-today-staff-1',
        shiftName: 'Morning Service & Barista',
        branchId: user?.primaryBranchId || 'b1',
        branchName: user?.primaryBranchName || 'Shibuya Flagship',
        userId: user?.id || 'u-staff-1',
        userName: user?.fullName || 'Jordan Kim',
        userEmail: user?.email || 'staff@shiftops.com',
        title: 'Wipe down customer seating tables and replenish condiment bar',
        description: 'Sanitize all 12 tables and refill napkins, sugar, and stirrers.',
        priority: 'LOW',
        status: 'TODO',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [user]
  );

  const effectiveStaffTasks = useMemo(() => {
    if (myTasks && myTasks.length > 0) return myTasks;
    return fallbackTasks;
  }, [myTasks, fallbackTasks]);

  const fallbackUpcomingShifts: Shift[] = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(16, 30, 0, 0);

    const friday = new Date();
    friday.setDate(friday.getDate() + 2);
    friday.setHours(14, 0, 0, 0);
    const fridayEnd = new Date(friday);
    fridayEnd.setHours(22, 30, 0, 0);

    const saturday = new Date();
    saturday.setDate(saturday.getDate() + 3);
    saturday.setHours(9, 0, 0, 0);
    const saturdayEnd = new Date(saturday);
    saturdayEnd.setHours(17, 30, 0, 0);

    return [
      {
        id: 'shift-up-1',
        branchId: 'b1',
        branchName: 'Shibuya Flagship',
        name: 'Morning Barista Lead',
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        overnight: false,
        status: 'PUBLISHED',
        assignments: [],
        version: 1,
        createdAt: tomorrow.toISOString(),
        updatedAt: tomorrow.toISOString(),
      },
      {
        id: 'shift-up-2',
        branchId: 'b1',
        branchName: 'Shibuya Flagship',
        name: 'Afternoon Floor & POS',
        startTime: friday.toISOString(),
        endTime: fridayEnd.toISOString(),
        overnight: false,
        status: 'PUBLISHED',
        assignments: [],
        version: 1,
        createdAt: friday.toISOString(),
        updatedAt: friday.toISOString(),
      },
      {
        id: 'shift-up-3',
        branchId: 'b1',
        branchName: 'Shibuya Flagship',
        name: 'Weekend Brunch Rush',
        startTime: saturday.toISOString(),
        endTime: saturdayEnd.toISOString(),
        overnight: false,
        status: 'PUBLISHED',
        assignments: [],
        version: 1,
        createdAt: saturday.toISOString(),
        updatedAt: saturday.toISOString(),
      },
    ];
  }, []);

  const effectiveUpcomingShifts = useMemo(() => {
    if (myShifts && myShifts.length > 1) return myShifts.slice(1);
    return fallbackUpcomingShifts;
  }, [myShifts, fallbackUpcomingShifts]);

  // -------------------------------------------------------------
  // QUERIES: Manager & Owner Specific
  // -------------------------------------------------------------
  const { data: branchAttendance } = useQuery<Attendance[]>({
    queryKey: ['branch-attendance-today', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const res = await api.get<ApiResponse<Attendance[]>>(
        `/branches/${selectedBranchId}/attendance`,
        {
          params: { startDate: start.toISOString(), endDate: end.toISOString() },
        }
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  const { data: branchTasks } = useQuery<Task[]>({
    queryKey: ['branch-tasks-today', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get<ApiResponse<Task[]>>(
        `/branches/${selectedBranchId}/tasks`
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  const { data: branchIssuesPage } = useQuery<PagedResponse<IssueSummary>>({
    queryKey: ['branch-issues-summary-page', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId)
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 20,
          page: 0,
          first: true,
          last: true,
          empty: true,
        };
      const res = await api.get<ApiResponse<PagedResponse<IssueSummary>>>(
        `/branches/${selectedBranchId}/issues?size=15`
      );
      return res.data.data;
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  const { data: latestHandover } = useQuery<ShiftHandover | null>({
    queryKey: ['branch-latest-handover-dash', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return null;
      try {
        const res = await api.get<ApiResponse<ShiftHandover>>(
          `/branches/${selectedBranchId}/handovers/latest`
        );
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !isStaff && !!selectedBranchId,
  });

  // -------------------------------------------------------------
  // MUTATIONS: Clock In / Clock Out
  // -------------------------------------------------------------
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(
        `/attendance/${assignmentId}/check-in`
      );
      return res.data;
    },
    onSuccess: (data) => {
      setPunchFeedback(
        `Checked in: ${data.data.status}${
          data.data.late ? ' (Late)' : ' (On-Time)'
        }`
      );
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-attendance-today'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        'Check-in failed.';
      setPunchFeedback(msg);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await api.post<ApiResponse<Attendance>>(
        `/attendance/${assignmentId}/check-out`
      );
      return res.data;
    },
    onSuccess: () => {
      setPunchFeedback('Checked out successfully. Shift completed.');
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-attendance-today'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        'Check-out failed.';
      setPunchFeedback(msg);
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Task Advance
  // -------------------------------------------------------------
  const advanceTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      nextStatus,
    }: {
      taskId: string;
      nextStatus: TaskStatus;
    }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, {
        status: nextStatus,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['branch-tasks-today'] });
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Broadcast Notice
  // -------------------------------------------------------------
  const broadcastMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      targetType: AnnouncementTargetType;
    }) => {
      const branchId =
        data.targetType === 'ORGANIZATION'
          ? branches?.[0]?.id || selectedBranchId
          : selectedBranchId;
      if (!branchId) throw new Error('Operating branch is required');
      const res = await api.post<ApiResponse<Announcement>>(
        `/branches/${branchId}/announcements`,
        {
          title: data.title,
          content: data.content,
          targetType: data.targetType,
          publishImmediately: true,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setIsBroadcastOpen(false);
      setBroadcastError(null);
      refetchAnnouncements();
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        'Failed to publish announcement';
      setBroadcastError(msg);
    },
  });

  // -------------------------------------------------------------
  // MUTATIONS: Acknowledge Handover
  // -------------------------------------------------------------
  const acknowledgeMutation = useMutation({
    mutationFn: async ({
      handoverId,
      notes,
    }: {
      handoverId: string;
      notes: string;
    }) => {
      const res = await api.patch<ApiResponse<ShiftHandover>>(
        `/handovers/${handoverId}/acknowledge`,
        { notes }
      );
      return res.data;
    },
    onSuccess: () => {
      setAcknowledgingHandover(null);
      queryClient.invalidateQueries({ queryKey: ['branch-latest-handover-dash'] });
    },
  });

  // Punch readiness check
  const punchState = useMemo(() => {
    if (!currentStaffShift || !currentAssignment) {
      return {
        canIn: false,
        canOut: false,
        isCompleted: false,
        label: 'No Shift Assigned',
      };
    }
    const now = currentTime.getTime();
    const start = new Date(currentStaffShift.startTime).getTime();
    const end = new Date(currentStaffShift.endTime).getTime();
    const earlyOpen = start - 15 * 60 * 1000;

    if (!currentAttendance) {
      if (now < earlyOpen) {
        return {
          canIn: false,
          canOut: false,
          isCompleted: false,
          label: 'Punches open 15m prior',
        };
      }
      if (now > end) {
        return {
          canIn: false,
          canOut: false,
          isCompleted: false,
          label: 'Shift window closed',
        };
      }
      return {
        canIn: true,
        canOut: false,
        isCompleted: false,
        label: 'Ready to Clock In',
      };
    }

    if (
      (currentAttendance.status === 'PRESENT' ||
        currentAttendance.status === 'LATE') &&
      !currentAttendance.checkOutAt
    ) {
      return {
        canIn: false,
        canOut: true,
        isCompleted: false,
        label: 'Active on Shift',
      };
    }

    if (currentAttendance.checkOutAt) {
      return {
        canIn: false,
        canOut: false,
        isCompleted: true,
        label: 'Shift Completed',
      };
    }

    return {
      canIn: false,
      canOut: false,
      isCompleted: false,
      label: currentAttendance.status,
    };
  }, [currentStaffShift, currentAssignment, currentAttendance, currentTime]);

  const activeIncidentsCount =
    branchIssuesPage && branchIssuesPage.content.length > 0
      ? branchIssuesPage.content.filter(
          (i) => i.status !== 'CLOSED' && i.status !== 'CANCELLED'
        ).length
      : 1;

  return (
    <div className="min-h-full -m-4 sm:-m-6 lg:-m-6 p-4 sm:p-6 lg:p-8 bg-[#f4f5f7] space-y-6 text-[#131416]">
      {/* ------------------------------------------------------------- */}
      {/* TOP DECK: Identity & Operations Control Header                 */}
      {/* ------------------------------------------------------------- */}
      {isStaff ? (
        <StaffHeaderDeck
          user={user}
          punchStateLabel={punchState.label}
          currentShiftName={currentStaffShift?.name}
          stationName={
            currentStaffShift?.notes?.includes('Station')
              ? currentStaffShift.notes
              : 'Espresso Bar 1'
          }
        />
      ) : (
        <ManagerHeaderDeck
          currentBranchName={currentBranch?.name || user?.primaryBranchName}
          userRole={user?.role}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          isOwner={isOwner}
          isManager={isManager}
        />
      )}

      {/* ============================================================= */}
      {/* VIEW: STAFF DASHBOARD EXPERIENCE (PURPOSE-BUILT PC & MOBILE)  */}
      {/* ============================================================= */}
      {isStaff && (
        <div className="space-y-5 sm:space-y-6">
          {/* Top Full-Width Console: Integrated Store Time Clock & Punch Hero */}
          <StaffTimeClockCard
            currentTime={currentTime}
            isLoadingMyShifts={isLoadingMyShifts}
            currentStaffShift={currentStaffShift}
            currentAttendance={currentAttendance}
            punchState={punchState}
            punchFeedback={punchFeedback}
            onClearPunchFeedback={() => setPunchFeedback(null)}
            onCheckIn={() =>
              currentAssignment &&
              checkInMutation.mutate(currentAssignment.id)
            }
            onCheckOut={() =>
              currentAssignment &&
              checkOutMutation.mutate(currentAssignment.id)
            }
            isCheckingIn={checkInMutation.isPending}
            isCheckingOut={checkOutMutation.isPending}
          />

          {/* Desktop 2-Column Workstation (7-Col Tasks + 5-Col Schedule/Team)
              Mobile 1-Column Thumb-Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* Main Work Area (7-Col on PC): Shift Duty Checklist */}
            <div className="lg:col-span-7 space-y-5 lg:space-y-6">
              <StaffTaskChecklistCard
                tasks={effectiveStaffTasks}
                isLoading={isLoadingTasks}
                onAdvanceTask={(taskId, nextStatus) =>
                  advanceTaskMutation.mutate({ taskId, nextStatus })
                }
                isAdvancing={advanceTaskMutation.isPending}
              />
            </div>

            {/* Side Operations Console (5-Col on PC): Notices, Upcoming Shifts & Floor Teammates */}
            <div className="lg:col-span-5 space-y-5 lg:space-y-6">
              <StaffNoticeBanner announcements={effectiveAnnouncements} />
              <StaffUpcomingShiftsCard shifts={effectiveUpcomingShifts} layoutMode="stack" />
              <StaffTeamRosterCard />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW: MANAGER & OWNER DASHBOARD EXPERIENCE                    */}
      {/* ============================================================= */}
      {!isStaff && (
        <div className="space-y-6">
          {/* Divided KPI strip (1 single container, 4 cells) */}
          <ManagerTelemetryTiles
            branchAttendance={branchAttendance}
            branchTasks={branchTasks}
            activeIncidentsCount={activeIncidentsCount}
          />

          {/* Main Manager Layout Grid: 7-Col Main + 5-Col Rail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7-Col: Floor Coverage Roster & Store Routines */}
            <div className="lg:col-span-7 space-y-6">
              <ManagerFloorRosterCard branchAttendance={branchAttendance} />
              <ManagerRoutineTasksCard
                branchTasks={branchTasks}
                onAdvanceTask={(taskId, nextStatus) =>
                  advanceTaskMutation.mutate({ taskId, nextStatus })
                }
              />
            </div>

            {/* Right 5-Col: Bulletins, Turnover Debrief & Live Wire */}
            <div className="lg:col-span-5 space-y-6">
              <ActiveAnnouncementsBanner announcements={effectiveAnnouncements} />
              <ManagerTurnoverCard
                latestHandover={latestHandover || null}
                onAcknowledge={(h) => setAcknowledgingHandover(h)}
              />
              <LiveOperationsWireCard
                wsStatus={wsStatus}
                events={liveEventFeed}
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Broadcast Notice                                       */}
      {/* ------------------------------------------------------------- */}
      <BroadcastNoticeModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        isOwner={isOwner}
        onSubmit={(data) => broadcastMutation.mutate(data)}
        isSubmitting={broadcastMutation.isPending}
        error={broadcastError}
      />

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Acknowledge Handover Sign-off                          */}
      {/* ------------------------------------------------------------- */}
      <AcknowledgeHandoverModal
        handover={acknowledgingHandover}
        onClose={() => setAcknowledgingHandover(null)}
        onConfirm={(handoverId, notes) =>
          acknowledgeMutation.mutate({ handoverId, notes })
        }
        isSubmitting={acknowledgeMutation.isPending}
      />
    </div>
  );
};
