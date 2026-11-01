import { ShiftHandover, Shift, HandoverItem } from '../../lib/types';

export const formatHandoverTime = (isoString?: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatHandoverDate = (isoString?: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatHandoverDateTime = (isoString?: string): string => {
  if (!isoString) return '—';
  return `${formatHandoverDate(isoString)} · ${formatHandoverTime(isoString)}`;
};

/**
 * Generate fallback latest handover for demo or offline preview.
 * Simulates a realistic outgoing supervisor submission ready for incoming manager acknowledgment.
 */
export const generateFallbackLatestHandover = (
  branchId: string = 'b1',
  branchName: string = 'Shibuya Flagship'
): ShiftHandover => {
  const now = new Date();
  const shiftStart = new Date(now);
  shiftStart.setHours(shiftStart.getHours() - 8, 0, 0, 0);
  const shiftEnd = new Date(now);
  shiftEnd.setMinutes(shiftEnd.getMinutes() - 15, 0, 0);
  const submittedAt = new Date(now);
  submittedAt.setMinutes(submittedAt.getMinutes() - 10, 0, 0);

  const items: HandoverItem[] = [
    {
      id: 'h-item-1',
      handoverId: 'ho-latest-001',
      type: 'COMPLETED',
      content: 'Morning safe & register cash float verified at ¥45,000. All 3 POS terminals balanced with zero variance.',
      orderIndex: 1,
      createdAt: shiftStart.toISOString(),
    },
    {
      id: 'h-item-2',
      handoverId: 'ho-latest-001',
      type: 'ISSUE',
      content: 'Espresso Bar 2 steam wand pressure fluctuation observed during midday rush. Maintenance ticket dispatched.',
      issueId: 'iss-esp-02',
      issueTitle: 'Espresso Group 2 pressure fluctuation',
      issueStatus: 'OPEN',
      orderIndex: 2,
      createdAt: shiftStart.toISOString(),
    },
    {
      id: 'h-item-3',
      handoverId: 'ho-latest-001',
      type: 'PENDING',
      content: 'Cold-brew concentrate restock batch #4 in walk-in chiller needs dilution and decanting by 16:30.',
      orderIndex: 3,
      createdAt: shiftStart.toISOString(),
    },
    {
      id: 'h-item-4',
      handoverId: 'ho-latest-001',
      type: 'PENDING',
      content: 'Evening pastry vendor delivery expected between 15:00 and 15:30. Invoices must be signed on intake clipboard.',
      orderIndex: 4,
      createdAt: shiftStart.toISOString(),
    },
    {
      id: 'h-item-5',
      handoverId: 'ho-latest-001',
      type: 'NOTE',
      content: 'VIP corporate catering reservation for 18 guests arriving at 17:45 in the mezzanine alcove.',
      orderIndex: 5,
      createdAt: shiftStart.toISOString(),
    },
  ];

  return {
    id: 'ho-latest-001',
    shiftId: 'shift-morning-01',
    shiftName: 'Morning Opening & Midday Rush',
    shiftStartTime: shiftStart.toISOString(),
    shiftEndTime: shiftEnd.toISOString(),
    branchId,
    branchName,
    status: 'SUBMITTED',
    notes: 'Morning operations ran smoothly with high morning commuter volume (+14% vs forecast). All cold holding fridges checked and within HACCP compliance (3.2°C). One minor equipment ticket opened for espresso steam wand.',
    submittedById: 'u-kenji',
    submittedByName: 'Kenji Sato (Day Supervisor)',
    submittedAt: submittedAt.toISOString(),
    items,
    summary: {
      totalTasks: 28,
      completedTasks: 24,
      pendingTasks: 4,
      openBranchIssues: 1,
      staffAssignedCount: 6,
    },
    version: 1,
    createdAt: shiftStart.toISOString(),
    updatedAt: submittedAt.toISOString(),
  };
};

/**
 * Generate fallback historical handovers for branch audit archive.
 */
export const generateFallbackHistoricalHandovers = (
  branchId: string = 'b1',
  branchName: string = 'Shibuya Flagship'
): ShiftHandover[] => {
  const now = new Date();

  // Yesterday Evening
  const yestEveStart = new Date(now);
  yestEveStart.setDate(yestEveStart.getDate() - 1);
  yestEveStart.setHours(15, 30, 0, 0);
  const yestEveEnd = new Date(yestEveStart);
  yestEveEnd.setHours(23, 30, 0, 0);

  // Yesterday Morning
  const yestMornStart = new Date(now);
  yestMornStart.setDate(yestMornStart.getDate() - 1);
  yestMornStart.setHours(7, 0, 0, 0);
  const yestMornEnd = new Date(yestMornStart);
  yestMornEnd.setHours(16, 0, 0, 0);

  // 2 Days Ago Evening
  const twoDaysEveStart = new Date(now);
  twoDaysEveStart.setDate(twoDaysEveStart.getDate() - 2);
  twoDaysEveStart.setHours(15, 30, 0, 0);
  const twoDaysEveEnd = new Date(twoDaysEveStart);
  twoDaysEveEnd.setHours(23, 30, 0, 0);

  return [
    {
      id: 'ho-hist-101',
      shiftId: 'shift-yest-eve',
      shiftName: 'Evening Close & Financial Turnover',
      shiftStartTime: yestEveStart.toISOString(),
      shiftEndTime: yestEveEnd.toISOString(),
      branchId,
      branchName,
      status: 'ACKNOWLEDGED',
      notes: 'Store secured at 23:25. Night safe drop confirmed. Alarm set in perimeter mode.',
      submittedById: 'u-marcus',
      submittedByName: 'Marcus Tanaka',
      submittedAt: yestEveEnd.toISOString(),
      acknowledgedById: 'u-kenji',
      acknowledgedByName: 'Kenji Sato',
      acknowledgedAt: new Date(yestEveEnd.getTime() + 15 * 60000).toISOString(),
      acknowledgementNotes: 'Verified register closing reports and key lockbox. Handover acknowledged with zero discrepancies.',
      items: [
        {
          id: 'item-h1-1',
          type: 'COMPLETED',
          content: 'Register end-of-day z-reports printed and sealed in deposit pouch #8812.',
          orderIndex: 1,
          createdAt: yestEveEnd.toISOString(),
        },
        {
          id: 'item-h1-2',
          type: 'COMPLETED',
          content: 'Sanitizing cycle completed on all milk carafes and steam wands.',
          orderIndex: 2,
          createdAt: yestEveEnd.toISOString(),
        },
      ],
      summary: {
        totalTasks: 32,
        completedTasks: 32,
        pendingTasks: 0,
        openBranchIssues: 0,
        staffAssignedCount: 5,
      },
      version: 2,
      createdAt: yestEveStart.toISOString(),
      updatedAt: yestEveEnd.toISOString(),
    },
    {
      id: 'ho-hist-102',
      shiftId: 'shift-yest-morn',
      shiftName: 'Morning Opening & Midday Peak',
      shiftStartTime: yestMornStart.toISOString(),
      shiftEndTime: yestMornEnd.toISOString(),
      branchId,
      branchName,
      status: 'ACKNOWLEDGED',
      notes: 'Standard morning turnover. Fresh dairy order received and temperature checked (2.8°C).',
      submittedById: 'u-kenji',
      submittedByName: 'Kenji Sato',
      submittedAt: yestMornEnd.toISOString(),
      acknowledgedById: 'u-marcus',
      acknowledgedByName: 'Marcus Tanaka',
      acknowledgedAt: new Date(yestMornEnd.getTime() + 10 * 60000).toISOString(),
      acknowledgementNotes: 'Received prep station in clean condition. Milk inventory counts confirmed.',
      items: [
        {
          id: 'item-h2-1',
          type: 'COMPLETED',
          content: 'Morning cash float verified at ¥45,000.',
          orderIndex: 1,
          createdAt: yestMornEnd.toISOString(),
        },
        {
          id: 'item-h2-2',
          type: 'NOTE',
          content: 'Special reserve beans bean grinder hopper calibrated for Ethiopian single-origin.',
          orderIndex: 2,
          createdAt: yestMornEnd.toISOString(),
        },
      ],
      summary: {
        totalTasks: 26,
        completedTasks: 25,
        pendingTasks: 1,
        openBranchIssues: 0,
        staffAssignedCount: 6,
      },
      version: 2,
      createdAt: yestMornStart.toISOString(),
      updatedAt: yestMornEnd.toISOString(),
    },
    {
      id: 'ho-hist-103',
      shiftId: 'shift-twodays-eve',
      shiftName: 'Evening Floor & Turnover',
      shiftStartTime: twoDaysEveStart.toISOString(),
      shiftEndTime: twoDaysEveEnd.toISOString(),
      branchId,
      branchName,
      status: 'ACKNOWLEDGED',
      notes: 'Rainy evening rush handled smoothly. Safe deposit reconciled.',
      submittedById: 'u-elena',
      submittedByName: 'Elena Rostova',
      submittedAt: twoDaysEveEnd.toISOString(),
      acknowledgedById: 'u-kenji',
      acknowledgedByName: 'Kenji Sato',
      acknowledgedAt: new Date(twoDaysEveEnd.getTime() + 20 * 60000).toISOString(),
      acknowledgementNotes: 'Sign-off complete.',
      items: [
        {
          id: 'item-h3-1',
          type: 'COMPLETED',
          content: 'Floor mopped and bar mats soaked in sanitizer.',
          orderIndex: 1,
          createdAt: twoDaysEveEnd.toISOString(),
        },
      ],
      summary: {
        totalTasks: 30,
        completedTasks: 29,
        pendingTasks: 1,
        openBranchIssues: 0,
        staffAssignedCount: 5,
      },
      version: 2,
      createdAt: twoDaysEveStart.toISOString(),
      updatedAt: twoDaysEveEnd.toISOString(),
    },
  ];
};

/**
 * Generate fallback shifts ready for outgoing handover debrief.
 */
export const generateFallbackOutgoingShifts = (
  branchId: string = 'b1',
  branchName: string = 'Shibuya Flagship'
): Shift[] => {
  const now = new Date();
  const activeStart = new Date(now);
  activeStart.setHours(activeStart.getHours() - 4, 0, 0, 0);
  const activeEnd = new Date(activeStart);
  activeEnd.setHours(activeStart.getHours() + 8, 0, 0, 0);

  return [
    {
      id: 'shift-active-01',
      branchId,
      branchName,
      name: 'Afternoon Floor Supervision & Service',
      startTime: activeStart.toISOString(),
      endTime: activeEnd.toISOString(),
      overnight: false,
      status: 'PUBLISHED',
      notes: 'Current active operational shift awaiting end-of-shift turnover preparation.',
      version: 1,
      assignments: [
        {
          id: 'asg-01',
          userId: 'u-1',
          userName: 'Marcus Tanaka',
          userEmail: 'marcus.tanaka@shiftops.dev',
          userRole: 'MANAGER',
          assignedById: 'u-admin',
          assignedByName: 'Store Owner',
          assignedAt: activeStart.toISOString(),
        },
        {
          id: 'asg-02',
          userId: 'u-2',
          userName: 'Kenji Sato',
          userEmail: 'kenji.sato@shiftops.dev',
          userRole: 'STAFF',
          assignedById: 'u-1',
          assignedByName: 'Marcus Tanaka',
          assignedAt: activeStart.toISOString(),
        },
      ],
      createdAt: activeStart.toISOString(),
      updatedAt: activeStart.toISOString(),
    },
  ];
};
