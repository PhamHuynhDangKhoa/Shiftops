import { Task, TaskTemplate, TaskStatus } from '../../lib/types';

export interface TaskMetrics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  completionRate: number;
  highPriorityCount: number;
}

/**
 * Computes live operational task telemetry metrics from any collection of tasks
 */
export function computeTaskMetrics(tasks: Task[]): TaskMetrics {
  const total = tasks.length;
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let cancelled = 0;
  let highPriorityCount = 0;

  for (const t of tasks) {
    if (t.status === 'COMPLETED') completed++;
    else if (t.status === 'IN_PROGRESS') inProgress++;
    else if (t.status === 'TODO') pending++;
    else if (t.status === 'CANCELLED') cancelled++;

    if (t.priority === 'HIGH' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') {
      highPriorityCount++;
    }
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    cancelled,
    completionRate,
    highPriorityCount,
  };
}

/**
 * Validates whether a state transition is legal per Spring Boot backend rules
 * (Task.java):
 * - COMPLETED tasks cannot be modified (cannot be reopened)
 * - CANCELLED tasks cannot be modified
 * - Staff cannot cancel tasks
 */
export function isLegalTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus,
  isStaff: boolean
): boolean {
  if (currentStatus === targetStatus) return true;
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') return false;
  if (isStaff && targetStatus === 'CANCELLED') return false;
  return true;
}

/**
 * Formats ISO date time into clean operational tabular timestamp
 */
export function formatTaskTime(iso?: string | null): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '-';
  }
}

/**
 * Realistic operational checklist templates matching real branch SOPs
 */
export function generateFallbackTemplates(branchId = 'branch-1', branchName = 'Shibuya Flagship'): TaskTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tpl-opening-sop',
      branchId,
      branchName,
      name: 'Morning Opening SOP',
      description: 'Critical facility unlock, equipment warm-up, and sanitization protocols prior to customer entry.',
      active: true,
      itemCount: 5,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: 'item-op-1',
          title: 'Unlock main entrance & disable alarm system',
          description: 'Inspect perimeter for overnight alerts and enter manager security code.',
          priority: 'HIGH',
          orderIndex: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-op-2',
          title: 'Power on POS terminals & verify drawer cash float',
          description: 'Ensure exact 30,000 JPY opening float per terminal.',
          priority: 'HIGH',
          orderIndex: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-op-3',
          title: 'Inspect refrigeration & log temperature (< 4°C)',
          description: 'Record cold display and milk fridge temperatures in health log.',
          priority: 'HIGH',
          orderIndex: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-op-4',
          title: 'Brew initial coffee batch & calibrate espresso grinder',
          description: 'Run two seasoning espresso shots and verify 28s extraction time.',
          priority: 'NORMAL',
          orderIndex: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-op-5',
          title: 'Wipe customer tables & arrange floor seating',
          description: 'Verify music playlist and ambient lighting levels for morning service.',
          priority: 'LOW',
          orderIndex: 4,
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      id: 'tpl-turnover-sop',
      branchId,
      branchName,
      name: 'Midday Turnover & Restock',
      description: 'Mid-shift replenishment of consumables, food safety checks, and station rotation.',
      active: true,
      itemCount: 4,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: 'item-turn-1',
          title: 'Restock cups, lids, compostable straws & syrups',
          description: 'Check secondary dry storage and replenish all front prep caddies.',
          priority: 'NORMAL',
          orderIndex: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-turn-2',
          title: 'Sanitize food contact surfaces & cutting boards',
          description: 'Replace sanitizer buckets with fresh 200ppm quat solution.',
          priority: 'HIGH',
          orderIndex: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-turn-3',
          title: 'Audit pastry case expiry dates and rotate stock',
          description: 'Apply markdowns to sandwiches expiring before 15:00.',
          priority: 'NORMAL',
          orderIndex: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-turn-4',
          title: 'Empty dining room trash bins and wipe condibar',
          description: 'Ensure clean paper napkin dispensers and empty liquid discard urn.',
          priority: 'LOW',
          orderIndex: 3,
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
    {
      id: 'tpl-closing-sop',
      branchId,
      branchName,
      name: 'Evening Closing & Security SOP',
      description: 'End-of-day cash reconciliation, commercial deep clean, and facility lock-down.',
      active: true,
      itemCount: 5,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: 'item-close-1',
          title: 'Reconcile POS registers & print daily Z-report',
          description: 'Count physical cash, match card transaction slip totals, and store in drop safe.',
          priority: 'HIGH',
          orderIndex: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-close-2',
          title: 'Backflush espresso machine & soak steam wands',
          description: 'Use approved chemical detergent tablet and rinse thoroughly.',
          priority: 'HIGH',
          orderIndex: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-close-3',
          title: 'Cycle commercial dishwasher & empty drain trap',
          description: 'Turn off boiler switches and prop open door to air dry overnight.',
          priority: 'NORMAL',
          orderIndex: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-close-4',
          title: 'Lock rear delivery bay and latch exterior windows',
          description: 'Inspect all emergency exit crash bars for unobstructed clearance.',
          priority: 'HIGH',
          orderIndex: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-close-5',
          title: 'Arm central burglar alarm & double lock front doors',
          description: 'Verify security panel confirms armed status before leaving perimeter.',
          priority: 'HIGH',
          orderIndex: 4,
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ];
}

/**
 * Realistic operational tasks matching real staff shifts
 */
export function generateFallbackTasks(branchId = 'branch-1', branchName = 'Shibuya Flagship'): Task[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const t10am = new Date(now);
  t10am.setHours(10, 0, 0, 0);

  const t11am = new Date(now);
  t11am.setHours(11, 0, 0, 0);

  const t14pm = new Date(now);
  t14pm.setHours(14, 30, 0, 0);

  const t16pm = new Date(now);
  t16pm.setHours(16, 0, 0, 0);

  return [
    {
      id: 'task-101',
      shiftAssignmentId: 'sa-01',
      shiftId: 'shift-morning-01',
      shiftName: 'Morning Opening Shift (07:30 - 15:30)',
      branchId,
      branchName,
      userId: 'user-kenji',
      userName: 'Kenji Sato',
      userEmail: 'kenji.sato@shiftops.internal',
      templateItemId: 'item-op-1',
      title: 'Unlock main entrance & disable alarm system',
      description: 'Inspect perimeter for overnight alerts and enter manager security code.',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueTime: t10am.toISOString(),
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      completedById: 'user-kenji',
      completedByName: 'Kenji Sato',
      createdAt: `${todayStr}T07:30:00Z`,
      updatedAt: `${todayStr}T07:34:00Z`,
      version: 2,
    },
    {
      id: 'task-102',
      shiftAssignmentId: 'sa-01',
      shiftId: 'shift-morning-01',
      shiftName: 'Morning Opening Shift (07:30 - 15:30)',
      branchId,
      branchName,
      userId: 'user-kenji',
      userName: 'Kenji Sato',
      userEmail: 'kenji.sato@shiftops.internal',
      templateItemId: 'item-op-2',
      title: 'Power on POS terminals & verify drawer cash float',
      description: 'Ensure exact 30,000 JPY opening float per terminal.',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueTime: t10am.toISOString(),
      completedAt: new Date(now.getTime() - 100 * 60 * 1000).toISOString(),
      completedById: 'user-kenji',
      completedByName: 'Kenji Sato',
      createdAt: `${todayStr}T07:30:00Z`,
      updatedAt: `${todayStr}T07:42:00Z`,
      version: 2,
    },
    {
      id: 'task-103',
      shiftAssignmentId: 'sa-01',
      shiftId: 'shift-morning-01',
      shiftName: 'Morning Opening Shift (07:30 - 15:30)',
      branchId,
      branchName,
      userId: 'user-kenji',
      userName: 'Kenji Sato',
      userEmail: 'kenji.sato@shiftops.internal',
      templateItemId: 'item-op-3',
      title: 'Inspect refrigeration & log temperature (< 4°C)',
      description: 'Record cold display and milk fridge temperatures in health log.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueTime: t11am.toISOString(),
      createdAt: `${todayStr}T07:30:00Z`,
      updatedAt: `${todayStr}T08:15:00Z`,
      version: 1,
    },
    {
      id: 'task-104',
      shiftAssignmentId: 'sa-01',
      shiftId: 'shift-morning-01',
      shiftName: 'Morning Opening Shift (07:30 - 15:30)',
      branchId,
      branchName,
      userId: 'user-kenji',
      userName: 'Kenji Sato',
      userEmail: 'kenji.sato@shiftops.internal',
      templateItemId: 'item-op-4',
      title: 'Brew initial coffee batch & calibrate espresso grinder',
      description: 'Run two seasoning espresso shots and verify 28s extraction time.',
      priority: 'NORMAL',
      status: 'TODO',
      dueTime: t11am.toISOString(),
      createdAt: `${todayStr}T07:30:00Z`,
      updatedAt: `${todayStr}T07:30:00Z`,
      version: 1,
    },
    {
      id: 'task-105',
      shiftAssignmentId: 'sa-02',
      shiftId: 'shift-morning-01',
      shiftName: 'Morning Opening Shift (07:30 - 15:30)',
      branchId,
      branchName,
      userId: 'user-yuki',
      userName: 'Yuki Tanaka',
      userEmail: 'yuki.tanaka@shiftops.internal',
      title: 'Restock oat milk from cold room pallet',
      description: 'Ad-hoc request from barista station: low on secondary barista oat milk stock.',
      priority: 'HIGH',
      status: 'TODO',
      dueTime: t14pm.toISOString(),
      createdAt: `${todayStr}T08:20:00Z`,
      updatedAt: `${todayStr}T08:20:00Z`,
      version: 1,
    },
    {
      id: 'task-106',
      shiftAssignmentId: 'sa-03',
      shiftId: 'shift-afternoon-01',
      shiftName: 'Afternoon Service Shift (14:00 - 22:30)',
      branchId,
      branchName,
      userId: 'user-haruto',
      userName: 'Haruto Watanabe',
      userEmail: 'haruto.watanabe@shiftops.internal',
      templateItemId: 'item-turn-2',
      title: 'Sanitize food contact surfaces & cutting boards',
      description: 'Replace sanitizer buckets with fresh 200ppm quat solution.',
      priority: 'HIGH',
      status: 'TODO',
      dueTime: t16pm.toISOString(),
      createdAt: `${todayStr}T08:30:00Z`,
      updatedAt: `${todayStr}T08:30:00Z`,
      version: 1,
    },
  ];
}
