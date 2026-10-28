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

  // Shift assignment memo
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
    return myAttendanceList.find(
      (att) => att.shiftAssignmentId === currentAssignment.id
    );
  }, [currentAssignment, myAttendanceList]);

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
    <div className="space-y-6 pb-6 text-[#131416]">
      {/* ------------------------------------------------------------- */}
      {/* TOP DECK: Identity & Operations Control Header                 */}
      {/* ------------------------------------------------------------- */}
      {isStaff ? (
        <StaffHeaderDeck
          user={user}
          punchStateLabel={punchState.label}
          currentShiftName={currentStaffShift?.name}
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
      {/* VIEW: STAFF DASHBOARD EXPERIENCE                             */}
      {/* ============================================================= */}
      {isStaff && (
        <div className="space-y-6">
          <ActiveAnnouncementsBanner announcements={announcements} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Time Clock Station */}
            <div className="lg:col-span-5 flex flex-col">
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
            </div>

            {/* RIGHT COLUMN: Assigned Checklist & Tasks */}
            <div className="lg:col-span-7 flex flex-col">
              <StaffTaskChecklistCard
                tasks={myTasks}
                isLoading={isLoadingTasks}
                onAdvanceTask={(taskId, nextStatus) =>
                  advanceTaskMutation.mutate({ taskId, nextStatus })
                }
                isAdvancing={advanceTaskMutation.isPending}
              />
            </div>
          </div>

          {/* BOTTOM SECTION: Upcoming Shifts This Week */}
          <StaffUpcomingShiftsCard shifts={myShifts} />
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
              <ActiveAnnouncementsBanner announcements={announcements} />
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
