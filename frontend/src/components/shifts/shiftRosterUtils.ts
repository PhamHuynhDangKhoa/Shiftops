import { Shift } from '../../lib/types';

export interface DayColumn {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dayNumber: number; // 26, 27, etc.
  monthLabel: string; // Oct, Nov
  isToday: boolean;
  isWeekend: boolean;
}

export const getWeekDays = (referenceDate: Date): DayColumn[] => {
  const d = new Date(referenceDate);
  const day = d.getDay();
  // Adjust to Monday as start of week (0 is Sunday in JS, so Monday is 1)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayStr = new Date().toISOString().slice(0, 10);

  const days: DayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const isoDate = current.toISOString().slice(0, 10);
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;

    days.push({
      date: current,
      isoDate,
      dayLabel: current.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: current.getDate(),
      monthLabel: current.toLocaleDateString('en-US', { month: 'short' }),
      isToday: isoDate === todayStr,
      isWeekend,
    });
  }
  return days;
};

export const formatShiftDurationHours = (startIso: string, endIso: string): number => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = Math.max(0, end - start);
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
};

export const formatTimeShort = (iso: string): string => {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export interface StaffRosterRow {
  userId: string;
  userName: string;
  roleTitle: string;
  avatarInitials: string;
  totalWeeklyHours: number;
  shiftsByDay: Record<string, Shift[]>; // keyed by YYYY-MM-DD
}

export const generateFallbackWeekShifts = (weekDays: DayColumn[]): Shift[] => {
  const branchId = 'b1';
  const branchName = 'Shibuya Flagship';

  const staffMembers = [
    { id: 'u-1', name: 'Marcus Tanaka', role: 'Shift Supervisor' },
    { id: 'u-2', name: 'Aoi Mori', role: 'Barista Lead' },
    { id: 'u-3', name: 'Daiki Takahashi', role: 'Line Barista' },
    { id: 'u-4', name: 'Hana Endo', role: 'Cashier & Service' },
    { id: 'u-5', name: 'Ren Ito', role: 'Floor Operations' },
    { id: 'u-6', name: 'Yuka Suzuki', role: 'Kitchen Prep' },
    { id: 'u-7', name: 'Kenji Sato', role: 'Cashier (Afternoon)' },
  ];

  const shifts: Shift[] = [];

  weekDays.forEach((day, idx) => {
    const dateStr = day.isoDate;

    // Morning Opening Shift: 08:00 - 16:30 (8.5 hrs)
    const morningStaff = staffMembers[idx % 3]!;
    const morningStatus = idx < 3 ? 'COMPLETED' : 'PUBLISHED';
    shifts.push({
      id: `shift-morn-${idx}`,
      branchId,
      branchName,
      name: 'Morning Opening',
      startTime: `${dateStr}T08:00:00.000Z`,
      endTime: `${dateStr}T16:30:00.000Z`,
      overnight: false,
      status: morningStatus,
      notes: 'Standard morning floor opening, till reconciliation, and espresso dial-in.',
      assignments: [
        {
          id: `asg-m-${idx}`,
          userId: morningStaff.id,
          userName: morningStaff.name,
          userEmail: `${morningStaff.name.toLowerCase().replace(' ', '.')}@shiftops.com`,
          userRole: 'STAFF',
          assignedById: 'u-manager-1',
          assignedByName: 'Store Manager',
          assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Afternoon Closing Shift: 14:00 - 22:30 (8.5 hrs)
    const afternoonStaff = staffMembers[3 + (idx % 4)]!;
    const afternoonStatus = idx < 3 ? 'COMPLETED' : idx === 4 ? 'DRAFT' : 'PUBLISHED';
    shifts.push({
      id: `shift-aft-${idx}`,
      branchId,
      branchName,
      name: 'Afternoon & Closing',
      startTime: `${dateStr}T14:00:00.000Z`,
      endTime: `${dateStr}T22:30:00.000Z`,
      overnight: false,
      status: afternoonStatus,
      notes: 'Customer service peak, closing register cash count, and sanitization walk.',
      assignments: [
        {
          id: `asg-a-${idx}`,
          userId: afternoonStaff.id,
          userName: afternoonStaff.name,
          userEmail: `${afternoonStaff.name.toLowerCase().replace(' ', '.')}@shiftops.com`,
          userRole: 'STAFF',
          assignedById: 'u-manager-1',
          assignedByName: 'Store Manager',
          assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Add 1 Unassigned Draft Shift on Friday (idx 4) for manager to test assignment
  if (weekDays[4]) {
    const friDate = weekDays[4].isoDate;
    shifts.push({
      id: 'shift-draft-unassigned',
      branchId,
      branchName,
      name: 'Weekend Eve Peak Support',
      startTime: `${friDate}T17:00:00.000Z`,
      endTime: `${friDate}T22:00:00.000Z`,
      overnight: false,
      status: 'DRAFT',
      notes: 'High-volume evening peak coverage. Requires barista or cashier assignment.',
      assignments: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return shifts;
};
