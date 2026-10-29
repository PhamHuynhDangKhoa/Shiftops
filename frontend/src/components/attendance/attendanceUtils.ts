import { Attendance, Shift } from '../../lib/types';

export const formatTimeShort = (isoString?: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDateTimeShort = (isoString?: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export interface PunctualityDelta {
  label: string;
  isLate: boolean;
  minutesDiff: number;
}

export const calculatePunctuality = (
  checkInAt?: string,
  shiftStartTime?: string
): PunctualityDelta => {
  if (!checkInAt || !shiftStartTime) {
    return { label: '—', isLate: false, minutesDiff: 0 };
  }

  const checkIn = new Date(checkInAt).getTime();
  const start = new Date(shiftStartTime).getTime();
  const diffMinutes = Math.round((checkIn - start) / (1000 * 60));

  if (diffMinutes > 0) {
    return {
      label: `+${diffMinutes}m late`,
      isLate: true,
      minutesDiff: diffMinutes,
    };
  }

  if (diffMinutes < 0) {
    return {
      label: `${Math.abs(diffMinutes)}m early`,
      isLate: false,
      minutesDiff: diffMinutes,
    };
  }

  return { label: 'On time', isLate: false, minutesDiff: 0 };
};

export const calculateDurationHours = (
  startIso?: string,
  endIso?: string
): string => {
  if (!startIso) return '—';
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffHours = (end - start) / (1000 * 60 * 60);

  if (diffHours < 0) return '—';
  const h = Math.floor(diffHours);
  const m = Math.round((diffHours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

export const generateFallbackAttendance = (
  branchId: string = 'b1',
  branchName: string = 'Shibuya Flagship'
): Attendance[] => {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      id: 'att-101',
      shiftAssignmentId: 'asg-101',
      shiftId: 'shift-101',
      shiftName: 'Morning Opening',
      branchId,
      branchName,
      userId: 'u-1',
      userName: 'Marcus Tanaka',
      userEmail: 'marcus.tanaka@shiftops.dev',
      shiftStartTime: `${today}T08:00:00.000Z`,
      shiftEndTime: `${today}T16:30:00.000Z`,
      checkInAt: `${today}T07:54:12.000Z`,
      checkOutAt: `${today}T16:32:04.000Z`,
      status: 'COMPLETED',
      late: false,
      overnight: false,
      notes: 'Till float verified. Morning delivery checked in.',
      version: 1,
      createdAt: `${today}T07:54:12.000Z`,
      updatedAt: `${today}T16:32:04.000Z`,
    },
    {
      id: 'att-102',
      shiftAssignmentId: 'asg-102',
      shiftId: 'shift-101',
      shiftName: 'Morning Opening',
      branchId,
      branchName,
      userId: 'u-2',
      userName: 'Aoi Mori',
      userEmail: 'aoi.mori@shiftops.dev',
      shiftStartTime: `${today}T08:00:00.000Z`,
      shiftEndTime: `${today}T16:30:00.000Z`,
      checkInAt: `${today}T07:49:30.000Z`,
      checkOutAt: `${today}T16:35:10.000Z`,
      status: 'COMPLETED',
      late: false,
      overnight: false,
      notes: 'Espresso calibration optimal. Equipment sanitized.',
      version: 1,
      createdAt: `${today}T07:49:30.000Z`,
      updatedAt: `${today}T16:35:10.000Z`,
    },
    {
      id: 'att-103',
      shiftAssignmentId: 'asg-103',
      shiftId: 'shift-102',
      shiftName: 'Midday Peak Coverage',
      branchId,
      branchName,
      userId: 'u-3',
      userName: 'Daiki Takahashi',
      userEmail: 'daiki.takahashi@shiftops.dev',
      shiftStartTime: `${today}T11:00:00.000Z`,
      shiftEndTime: `${today}T19:30:00.000Z`,
      checkInAt: `${today}T11:13:45.000Z`,
      status: 'LATE',
      late: true,
      overnight: false,
      notes: 'Train transit delay notified via manager line.',
      version: 1,
      createdAt: `${today}T11:13:45.000Z`,
      updatedAt: `${today}T11:13:45.000Z`,
    },
    {
      id: 'att-104',
      shiftAssignmentId: 'asg-104',
      shiftId: 'shift-102',
      shiftName: 'Midday Peak Coverage',
      branchId,
      branchName,
      userId: 'u-4',
      userName: 'Hana Endo',
      userEmail: 'hana.endo@shiftops.dev',
      shiftStartTime: `${today}T11:00:00.000Z`,
      shiftEndTime: `${today}T19:30:00.000Z`,
      checkInAt: `${today}T10:52:18.000Z`,
      status: 'PRESENT',
      late: false,
      overnight: false,
      notes: 'Assigned to Central Register #01.',
      version: 1,
      createdAt: `${today}T10:52:18.000Z`,
      updatedAt: `${today}T10:52:18.000Z`,
    },
    {
      id: 'att-105',
      shiftAssignmentId: 'asg-105',
      shiftId: 'shift-103',
      shiftName: 'Afternoon & Floor Lead',
      branchId,
      branchName,
      userId: 'u-5',
      userName: 'Elena Rostova',
      userEmail: 'elena.rostova@shiftops.dev',
      shiftStartTime: `${today}T14:00:00.000Z`,
      shiftEndTime: `${today}T22:30:00.000Z`,
      checkInAt: `${today}T13:48:22.000Z`,
      status: 'PRESENT',
      late: false,
      overnight: false,
      notes: 'Floor supervisor handover complete.',
      version: 1,
      createdAt: `${today}T13:48:22.000Z`,
      updatedAt: `${today}T13:48:22.000Z`,
    },
    {
      id: 'att-106',
      shiftAssignmentId: 'asg-106',
      shiftId: 'shift-103',
      shiftName: 'Afternoon & Floor Lead',
      branchId,
      branchName,
      userId: 'u-6',
      userName: 'Kenji Sato',
      userEmail: 'kenji.sato@shiftops.dev',
      shiftStartTime: `${today}T14:00:00.000Z`,
      shiftEndTime: `${today}T22:30:00.000Z`,
      checkInAt: `${today}T14:01:50.000Z`,
      status: 'LATE',
      late: true,
      overnight: false,
      notes: 'Uniform change terminal punch.',
      version: 1,
      createdAt: `${today}T14:01:50.000Z`,
      updatedAt: `${today}T14:01:50.000Z`,
    },
    {
      id: 'att-107',
      shiftAssignmentId: 'asg-107',
      shiftId: 'shift-104',
      shiftName: 'Early Prep Station',
      branchId,
      branchName,
      userId: 'u-7',
      userName: 'Yuka Suzuki',
      userEmail: 'yuka.suzuki@shiftops.dev',
      shiftStartTime: `${today}T07:00:00.000Z`,
      shiftEndTime: `${today}T15:30:00.000Z`,
      status: 'ABSENT',
      late: false,
      overnight: false,
      notes: 'Medical absence logged. Cover shift assigned.',
      version: 1,
      createdAt: `${today}T07:15:00.000Z`,
      updatedAt: `${today}T07:15:00.000Z`,
    },
  ];
};

export const generateFallbackStaffShift = (
  userId: string = 'u-current',
  userName: string = 'Marcus Tanaka'
): Shift => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(start.getHours() - 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 8, 30, 0, 0);

  return {
    id: 'my-shift-active',
    branchId: 'b1',
    branchName: 'Shibuya Flagship',
    name: 'Floor Operations & Lead',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    overnight: false,
    status: 'PUBLISHED',
    notes: 'Floor supervision and inventory audit.',
    version: 1,
    assignments: [
      {
        id: 'asg-current-user',
        userId,
        userName,
        userEmail: 'marcus.tanaka@shiftops.dev',
        userRole: 'STAFF',
        assignedById: 'u-owner',
        assignedByName: 'System Admin',
        assignedAt: start.toISOString(),
      },
    ],
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
  };
};
