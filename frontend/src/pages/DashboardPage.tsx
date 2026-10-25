import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ApiResponse,
  Branch,
  Announcement,
  AnnouncementTargetType,
} from '../lib/types';
import { Button, Modal, Input } from '../components/ui';
import { IconCheck } from '../components/ui/Icons';

interface ChecklistItem {
  id: string;
  title: string;
  time: string;
  done: boolean;
  assignee: string;
  meta?: string | null;
  actionLabel?: string | null;
  isImminent?: boolean;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Active top tab in Left Operations Panel: 'CHECKLIST' vs 'COMPLIANCE'
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'COMPLIANCE'>('CHECKLIST');

  // Broadcast modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetType, setBroadcastTargetType] = useState<AnnouncementTargetType>('BRANCH');
  const [broadcastBranchId, setBroadcastBranchId] = useState(user?.primaryBranchId || '');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Filter tab for checklist (defaults to 'PENDING')
  const [checklistFilter, setChecklistFilter] = useState<'PENDING' | 'DONE' | 'ALL'>('PENDING');

  // Search filter query received from the top command bar
  const [searchQuery, setSearchQuery] = useState('');

  // Selected staff filter (clicking staff in Staff on Floor filters the checklist)
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

  // Inline logging micro-form state ({ id: task.id, value: string })
  const [inlineForm, setInlineForm] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    const handleFilterSearch = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setSearchQuery(ce.detail || '');
    };
    window.addEventListener('shiftops:filter-search', handleFilterSearch);
    return () => window.removeEventListener('shiftops:filter-search', handleFilterSearch);
  }, []);

  // Operational checklist items covering the morning and afternoon shift
  const [shiftChecklist, setShiftChecklist] = useState<ChecklistItem[]>([
    {
      id: 't1',
      title: 'Opening perimeter security & entrance key disarm',
      meta: null,
      time: '08:00',
      done: true,
      assignee: 'Marcus T.',
    },
    {
      id: 't2',
      title: 'Register float & cash drawer count',
      meta: '$350.00 logged',
      time: '08:15',
      done: true,
      assignee: 'Elena H.',
    },
    {
      id: 't3',
      title: 'POS terminal & barcode scanner connectivity test',
      meta: null,
      time: '08:30',
      done: true,
      assignee: 'Elena H.',
    },
    {
      id: 't4',
      title: 'Main entrance display restock and merchandising',
      meta: null,
      time: '09:00',
      done: true,
      assignee: 'Marcus T.',
    },
    {
      id: 't5',
      title: 'Perishable goods refrigeration temperature audit',
      meta: '4.2°C logged',
      time: '09:30',
      done: true,
      assignee: 'Jordan K.',
    },
    {
      id: 't6',
      title: 'Aisle hazard check & spill station inspection',
      meta: null,
      time: '10:00',
      done: true,
      assignee: 'Aoi T.',
    },
    {
      id: 't7',
      title: 'Bakery & warm food display sensor confirmation',
      meta: '68.5°C logged',
      time: '10:30',
      done: true,
      assignee: 'Maya L.',
    },
    {
      id: 't8',
      title: 'Customer checkout queue cover & break relief',
      meta: null,
      time: '11:00',
      done: false,
      assignee: 'Elena H.',
      actionLabel: 'Verify',
      isImminent: true,
    },
    {
      id: 't9',
      title: 'Dairy cooler stock level & FIFO rotation review',
      meta: null,
      time: '11:30',
      done: false,
      assignee: 'Carlos G.',
    },
    {
      id: 't10',
      title: 'Curbside pickup order staging & dispatch review',
      meta: null,
      time: '11:45',
      done: false,
      assignee: 'Chloe D.',
    },
    {
      id: 't11',
      title: 'Produce freshness audit & misting nozzle check',
      meta: null,
      time: '12:15',
      done: false,
      assignee: 'Maya L.',
    },
    {
      id: 't12',
      title: 'Midday register drop & cash envelope safe transfer',
      meta: null,
      time: '12:30',
      done: false,
      assignee: 'Marcus T.',
      actionLabel: 'Transfer',
    },
    {
      id: 't13',
      title: 'Restroom sanitation & consumable supplies audit',
      meta: null,
      time: '13:15',
      done: false,
      assignee: 'Carlos G.',
    },
    {
      id: 't14',
      title: 'Returns desk triage & defective item quarantine',
      meta: null,
      time: '13:45',
      done: false,
      assignee: 'Elena H.',
    },
    {
      id: 't15',
      title: 'High-touch surface sanitization & basket restocking',
      meta: null,
      time: '14:00',
      done: false,
      assignee: 'Jordan K.',
    },
    {
      id: 't16',
      title: 'Afternoon bakery replenishment & hot case logging',
      meta: '67.0°C logged',
      time: '14:30',
      done: false,
      assignee: 'Maya L.',
    },
    {
      id: 't17',
      title: 'Inventory delivery dock intake & invoice check',
      meta: null,
      time: '15:00',
      done: false,
      assignee: 'Kenji S.',
    },
    {
      id: 't18',
      title: 'Promotional signage & shelf price tags verification',
      meta: null,
      time: '15:30',
      done: false,
      assignee: 'Aoi T.',
    },
    {
      id: 't19',
      title: 'Aisle recovery & shopping cart return sweep',
      meta: null,
      time: '16:00',
      done: false,
      assignee: 'Jordan K.',
    },
    {
      id: 't20',
      title: 'Evening register float reconcile & safe drop count',
      meta: null,
      time: '16:15',
      done: false,
      assignee: 'Marcus T.',
      actionLabel: 'Count',
    },
    {
      id: 't21',
      title: 'Perimeter security & delivery dock closure audit',
      meta: null,
      time: '16:30',
      done: false,
      assignee: 'Elena H.',
    },
  ]);

  const toggleChecklistItem = (id: string) => {
    setShiftChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = shiftChecklist.filter((t) => t.done).length;
  const pendingCount = shiftChecklist.length - completedCount;
  const overdueCount = shiftChecklist.filter((t) => !t.done && t.time < '13:00').length;

  const filteredChecklist = shiftChecklist.filter((t) => {
    // 1. Status filter
    if (checklistFilter === 'PENDING' && t.done) return false;
    if (checklistFilter === 'DONE' && !t.done) return false;

    // 2. Staff selection filter
    if (selectedStaffFilter) {
      const firstName = selectedStaffFilter.split(' ')[0] || '';
      if (firstName && !t.assignee.startsWith(firstName)) return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assignee.toLowerCase().includes(q);
      const matchTime = t.time.includes(q);
      const matchMeta = t.meta ? t.meta.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchAssignee && !matchTime && !matchMeta) return false;
    }

    return true;
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<Branch[]>>('/branches');
        return res.data.data;
      } catch {
        return [];
      }
    },
    enabled: isOwner || isManager,
  });

  const { data: announcements, refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['announcements', 'my'],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<Announcement[]>>('/announcements/my');
        return res.data.data;
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Listen to open-broadcast-modal custom event from the top command bar
  useEffect(() => {
    const handleOpen = () => {
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastTargetType('BRANCH');
      setBroadcastBranchId(user?.primaryBranchId || branches?.[0]?.id || '');
      setBroadcastError(null);
      setIsBroadcastModalOpen(true);
    };
    window.addEventListener('shiftops:open-broadcast-modal', handleOpen);
    return () => window.removeEventListener('shiftops:open-broadcast-modal', handleOpen);
  }, [user, branches]);

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
      refetchAnnouncements();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to publish notice.';
        setBroadcastError(message);
      } else {
        setBroadcastError('Failed to publish notice. Please try again.');
      }
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastError(null);
    broadcastMutation.mutate();
  };

  interface StaffMember {
    name: string;
    role: string;
    status: 'On duty' | 'On break' | 'Scheduled';
    time: string;
  }

  // Active floor staff state (supports break toggle and dynamic counting)
  const [floorStaff, setFloorStaff] = useState<StaffMember[]>([
    { name: 'Marcus Tanaka', role: 'Store Supervisor', status: 'On duty', time: '08:00–16:30' },
    { name: 'Elena Rostova', role: 'Cashier & Front Desk', status: 'On duty', time: '08:00–16:30' },
    { name: 'Jordan Kim', role: 'Inventory & Floor', status: 'On break', time: '08:30–17:00' },
    { name: 'Kenji Sato', role: 'Customer Service', status: 'On duty', time: '09:00–17:30' },
    { name: 'Aoi Takahashi', role: 'Merchandising Lead', status: 'On duty', time: '08:00–16:30' },
    { name: 'Carlos Gomez', role: 'Stockroom Receiving', status: 'On duty', time: '07:30–16:00' },
    { name: 'Maya Lin', role: 'Bakery & Deli Lead', status: 'On duty', time: '06:30–15:00' },
    { name: 'Devon Brooks', role: 'Cash Office & Safe Audit', status: 'On duty', time: '08:00–16:30' },
    { name: 'Chloe Dubois', role: 'Curbside Fulfillment', status: 'Scheduled', time: '11:00–19:30' },
    { name: 'Sarah Jenkins', role: 'Incoming Shift Lead', status: 'Scheduled', time: '16:30–01:00' },
  ]);

  const onDutyCount = floorStaff.filter((s) => s.status === 'On duty').length;
  const onBreakCount = floorStaff.filter((s) => s.status === 'On break').length;
  const scheduledCount = floorStaff.filter((s) => s.status === 'Scheduled').length;

  const toggleStaffBreak = (index: number) => {
    setFloorStaff((prev) =>
      prev.map((s, idx) => {
        if (idx !== index) return s;
        const nextStatus = s.status === 'On duty' ? 'On break' : s.status === 'On break' ? 'On duty' : s.status;
        return { ...s, status: nextStatus };
      })
    );
  };

  const filteredStaff = floorStaff.filter((staff) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return staff.name.toLowerCase().includes(q) || staff.role.toLowerCase().includes(q);
  });

  // Daily environment & compliance sensor readings
  const complianceTelemetry = [
    { unit: 'Main Chiller Walk-in', id: '#CH-04', reading: '-18.2°C', target: 'Target: -18.0°C', status: 'Balanced' },
    { unit: 'Perishable Deli Display', id: '#DL-02', reading: '3.8°C', target: 'Target: 4.0°C', status: 'Balanced' },
    { unit: 'Ice Cream & Frozen Island', id: '#DF-01', reading: '-21.5°C', target: 'Target: -20.0°C', status: 'Balanced' },
    { unit: 'Bakery Warm Display Unit', id: '#BK-03', reading: '68.5°C', target: 'Target: 65.0°C', status: 'Balanced' },
    { unit: 'Safe Deposit & Vault Float', id: '#VT-01', reading: '$1,250.00', target: 'Secured', status: 'Balanced' },
    { unit: 'Cash Drop Envelope Safe', id: '#DR-02', reading: '$850.00', target: 'Dual Custody', status: 'Balanced' },
    { unit: 'Emergency Egress & Fire Exit', id: '#EX-03', reading: 'Clear', target: 'Unobstructed', status: 'Balanced' },
    { unit: 'POS Gateway & UPS Backup', id: '#NT-01', reading: '100% Opt', target: 'Online Grid', status: 'Balanced' },
    { unit: 'HVAC Airflow & Ambient Sales Floor', id: '#HV-02', reading: '21.5°C', target: 'Target: 22.0°C', status: 'Balanced' },
    { unit: 'Delivery Receiving Dock Bay 1', id: '#DK-01', reading: 'Secured', target: 'Monitored', status: 'Balanced' },
    { unit: 'Waste Baler Safety Interlock', id: '#BL-01', reading: 'Active', target: 'Interlocked', status: 'Balanced' },
    { unit: 'Restroom Water Pressure Line', id: '#PL-04', reading: '48 PSI', target: 'Normal (45-55)', status: 'Balanced' },
  ];

  return (
    <div className="flex-1 overflow-hidden p-3.5 sm:p-5 grid grid-cols-12 gap-4 sm:gap-5 h-full">
      {/* Left Column (col-span-12 lg:col-span-8): Unified Tabbed Operations Panel */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="bg-white border border-zinc-200 rounded-lg flex flex-col h-full overflow-hidden">
          {/* Top Tab Header */}
          <div className="px-3 sm:px-4 pt-2.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            {/* Left Tabs */}
            <div className="flex items-center gap-3 sm:gap-4 -mb-px overflow-x-auto" role="tablist" aria-label="Operations Views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'CHECKLIST'}
                onClick={() => setActiveTab('CHECKLIST')}
                className={`pb-2 flex items-center gap-2 text-[13px] sm:text-sm transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'CHECKLIST'
                    ? 'border-zinc-900 font-semibold text-zinc-900'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                <span>Shift Checklist</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 tabular-nums border border-zinc-200">
                  {pendingCount} Pending
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'COMPLIANCE'}
                onClick={() => setActiveTab('COMPLIANCE')}
                className={`pb-2 flex items-center gap-2 text-[13px] sm:text-sm transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'COMPLIANCE'
                    ? 'border-zinc-900 font-semibold text-zinc-900'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 font-medium'
                }`}
              >
                <span>Compliance & Logbook</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>All Normal</span>
                </span>
              </button>
            </div>

            {/* Right Controls: Staff Filter Chip + Segmented Control */}
            {activeTab === 'CHECKLIST' ? (
              <div className="flex items-center gap-2 mb-1.5 self-start sm:self-auto flex-wrap">
                {selectedStaffFilter && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 text-white text-xs font-medium shrink-0">
                    <span>Staff: {selectedStaffFilter.split(' ')[0]} {selectedStaffFilter.split(' ')[1]?.[0]}.</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStaffFilter(null);
                      }}
                      className="text-zinc-400 hover:text-white cursor-pointer ml-0.5 font-bold"
                      aria-label="Clear staff filter"
                      title="Clear staff filter"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="bg-zinc-100 p-0.5 rounded-md flex items-center gap-0.5 text-[13px]" role="tablist" aria-label="Checklist filter">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={checklistFilter === 'PENDING'}
                    onClick={() => setChecklistFilter('PENDING')}
                    className={`px-2.5 py-0.5 rounded text-[13px] font-medium transition-colors cursor-pointer ${
                      checklistFilter === 'PENDING'
                        ? 'bg-white text-zinc-900 border border-zinc-200 shadow-none'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={checklistFilter === 'DONE'}
                    onClick={() => setChecklistFilter('DONE')}
                    className={`px-2.5 py-0.5 rounded text-[13px] font-medium transition-colors cursor-pointer ${
                      checklistFilter === 'DONE'
                        ? 'bg-white text-zinc-900 border border-zinc-200 shadow-none'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Verified ({completedCount})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={checklistFilter === 'ALL'}
                    onClick={() => setChecklistFilter('ALL')}
                    className={`px-2.5 py-0.5 rounded text-[13px] font-medium transition-colors cursor-pointer ${
                      checklistFilter === 'ALL'
                        ? 'bg-white text-zinc-900 border border-zinc-200 shadow-none'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    All ({shiftChecklist.length})
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-xs text-zinc-600 mb-1.5 hidden sm:inline tabular-nums">
                Audit Cycle: Morning · Live Sensor Feed
              </span>
            )}
          </div>

          {/* Tab 1 Body: Strict Single-Line Shift Checklist Rows */}
          {activeTab === 'CHECKLIST' ? (
            <div data-ui="task-list" className="flex-1 overflow-y-auto divide-y divide-zinc-100" role="group" aria-label="Task items">
              {filteredChecklist.map((task, idx) => {
                const isOverdue = !task.done && task.time < '13:00';
                const showNowHorizon =
                  idx > 0 &&
                  task.time >= '13:00' &&
                  (filteredChecklist[idx - 1]?.time ?? '') < '13:00';

                return (
                  <React.Fragment key={task.id}>
                    {/* Temporal NOW Horizon Divider */}
                    {showNowHorizon && (
                      <div
                        className="py-1.5 px-3.5 sm:px-4 bg-amber-50/70 border-y border-amber-200/90 flex items-center justify-between text-xs select-none"
                        role="separator"
                        aria-label="Current Shift Time Horizon"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                          <code className="text-[11px] font-semibold text-amber-950 tabular-nums">13:00</code>
                          <span className="font-semibold tracking-wider uppercase text-amber-950 text-[11px]">
                            · CURRENT SHIFT TIME
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-900 font-medium hidden sm:inline tabular-nums">
                          {overdueCount} {overdueCount === 1 ? 'routine' : 'routines'} overdue
                        </span>
                      </div>
                    )}

                    <div
                      role="checkbox"
                      aria-checked={task.done}
                      tabIndex={0}
                      onClick={() => toggleChecklistItem(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleChecklistItem(task.id);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 sm:gap-4 px-3.5 sm:px-4 py-2.5 sm:py-3 hover:bg-zinc-50/80 transition-colors cursor-pointer focus:outline-none focus-visible:bg-zinc-50 ${
                        task.done ? 'bg-zinc-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Left Group: Checkbox + Monospace Time + Task Title (Title truncates gracefully without wrapping) */}
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            task.done
                              ? 'border-zinc-300 bg-zinc-100 text-zinc-700'
                              : 'border-zinc-300 bg-white hover:border-zinc-400'
                          }`}
                          aria-hidden="true"
                        >
                          {task.done && <IconCheck size={11} className="stroke-[2.5]" />}
                        </div>

                        <code
                          className={`font-mono text-xs px-1.5 py-0.5 rounded tabular-nums shrink-0 ${
                            task.done
                              ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              : isOverdue
                              ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold'
                              : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                          }`}
                        >
                          {task.time}
                        </code>

                        {isOverdue && (
                          <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-900 rounded border border-amber-300/80 shrink-0 uppercase tracking-tight">
                            Overdue
                          </span>
                        )}

                        <span
                          className={`text-sm truncate min-w-0 block flex-1 ${
                            task.done
                              ? 'line-through text-zinc-500 font-normal decoration-zinc-300'
                              : 'font-medium text-zinc-900'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Right Group: Inline Action Form OR Value Badge + Assignee Pill */}
                      <div className="flex items-center gap-2 shrink-0">
                        {inlineForm?.id === task.id ? (
                          /* Interactive Inline Logging Micro-Form */
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!inlineForm.value.trim()) return;
                              setShiftChecklist((prev) =>
                                prev.map((item) =>
                                  item.id === task.id
                                    ? {
                                        ...item,
                                        done: true,
                                        meta: `${inlineForm.value} logged`,
                                      }
                                    : item
                                )
                              );
                              setInlineForm(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 shrink-0"
                          >
                            <input
                              autoFocus
                              type="text"
                              value={inlineForm.value}
                              onChange={(e) =>
                                setInlineForm({ ...inlineForm, value: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  setInlineForm(null);
                                }
                              }}
                              aria-label="Log value"
                              className="w-24 sm:w-28 h-7 text-xs px-2 border border-zinc-300 rounded bg-white text-zinc-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            <button
                              type="submit"
                              className="h-7 px-2 text-xs font-medium bg-zinc-900 text-white rounded hover:bg-zinc-800 active:scale-[0.98] transition-colors cursor-pointer"
                            >
                              Save ↵
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlineForm(null);
                              }}
                              className="h-7 w-7 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded flex items-center justify-center cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              ×
                            </button>
                          </form>
                        ) : (
                          <>
                            {task.meta && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded border border-zinc-200 shrink-0">
                                {task.meta}
                              </span>
                            )}

                            {!task.done && task.actionLabel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const defaultValue =
                                    task.actionLabel === 'Count'
                                      ? '$200.00'
                                      : task.actionLabel === 'Transfer'
                                      ? 'Drop #02 ($450)'
                                      : 'Verified OK';
                                  setInlineForm({ id: task.id, value: defaultValue });
                                }}
                                className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] cursor-pointer shrink-0 transition-colors"
                              >
                                {task.actionLabel}
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 shrink-0">
                              <code className="font-mono text-xs w-5 h-5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center justify-center font-semibold">
                                {task.assignee.slice(0, 2)}
                              </code>
                              <span className="text-[13px] text-zinc-700 font-medium hidden sm:inline">
                                {task.assignee}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            /* Tab 2 Body: Clean Single-Line Diagnostic Rows for Compliance & Logbook */
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {complianceTelemetry.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 sm:gap-4 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm hover:bg-zinc-50/80 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <code className="font-mono text-xs text-zinc-600 shrink-0">{item.id}</code>
                    <span className="font-medium text-zinc-900 truncate">{item.unit}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                    <span className="text-xs text-zinc-600 hidden sm:inline">{item.target}</span>
                    <code className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">{item.reading}</code>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Panel Footer */}
          <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/50 flex justify-between items-center text-[13px] text-zinc-600 shrink-0">
            <span>{completedCount} of {shiftChecklist.length} routines verified</span>
            <Link to="/tasks" className="font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1">
              <span>Open task manager</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column (col-span-12 lg:col-span-4): Staff Roster & Handoff Stack */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
        {/* 1. Staff on Floor Card (flex-1 scrollable) */}
        <div className="bg-white border border-zinc-200 rounded-lg flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-200 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">Staff on Floor</h2>
              <span className="text-[13px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 tabular-nums">
                {onDutyCount} On Duty
              </span>
            </div>
            <Link to="/shifts" className="text-[13px] font-medium text-zinc-700 hover:text-zinc-950">
              Full roster →
            </Link>
          </div>

          {/* Scrollable Body (Matching scrollbar, pb-3, cross-panel filter & break toggle) */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 pb-3 relative">
            {filteredStaff.map((staff, idx) => {
              const isSelected = selectedStaffFilter === staff.name;
              return (
                <div
                  key={idx}
                  onClick={() =>
                    setSelectedStaffFilter(isSelected ? null : staff.name)
                  }
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-100/90 ring-1 ring-inset ring-zinc-300'
                      : 'hover:bg-zinc-50/80'
                  }`}
                >
                  {/* Left: Avatar + Two-line Text Block */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <code
                      className={`font-mono text-xs w-7 h-7 rounded border flex items-center justify-center font-semibold shrink-0 ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {staff.name.charAt(0)}
                    </code>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-zinc-900 block truncate leading-tight">
                        {staff.name}
                      </span>
                      <span className="text-xs text-zinc-500 block truncate leading-tight mt-0.5">
                        {staff.role} · {staff.time}
                      </span>
                    </div>
                  </div>

                  {/* Right: Clickable Break Status Pill */}
                  <div className="shrink-0 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStaffBreak(idx);
                      }}
                      title="Click to toggle status (On duty / On break)"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-[0.98] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          staff.status === 'On duty'
                            ? 'bg-emerald-500'
                            : staff.status === 'On break'
                            ? 'bg-amber-500'
                            : 'bg-zinc-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-zinc-700">{staff.status}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="h-2" />
          </div>

          {/* Dynamic Staff Roster Card Footer */}
          <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center text-[13px] text-zinc-600 shrink-0">
            <span>
              {onDutyCount} on duty · {onBreakCount} on break · {scheduledCount} scheduled
            </span>
            <Link to="/staff" className="font-medium text-zinc-800 hover:text-zinc-950">
              Directory →
            </Link>
          </div>
        </div>

        {/* 2. Shift Turnover Card (shrink-0 structured ticket) */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shrink-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Shift Turnover</h2>
            <span className="text-[13px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              16:30 Afternoon
            </span>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Incoming Lead:</span>
                <span className="font-semibold text-zinc-900">Sarah Jenkins</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Register Variance:</span>
                <span className="font-semibold text-emerald-700 tabular-nums">$0.00 Balanced</span>
              </div>
            </div>

            <Link to="/handovers" className="block pt-1">
              <Button
                variant="dark"
                size="sm"
                className="w-full h-8 text-[13px] justify-center gap-1.5 font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99] transition-colors"
              >
                <span>Prepare Turnover Debrief</span>
                <span aria-hidden="true">→</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 3. Store Notices: Only rendered if active announcements exist (0 notices empty box omitted) */}
        {announcements && announcements.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900">Store Notices</h2>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {announcements.length}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-2 bg-zinc-50 border border-zinc-200 rounded-md space-y-0.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-zinc-900 truncate flex-1">{ann.title}</span>
                    <code className="font-mono text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </code>
                  </div>
                  <p className="text-zinc-600 line-clamp-1">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="New Store Notice"
        description="Publish an operational notice to staff"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          {broadcastError && (
            <div role="alert" className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {broadcastError}
            </div>
          )}

          <Input
            label="Title"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Schedule adjustments for holiday weekend"
            maxLength={150}
            required
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="broadcast-target" className="text-xs font-semibold text-zinc-900">Target Audience</label>
              <select
                id="broadcast-target"
                className="w-full h-9 px-3 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">This Branch Only</option>
                <option value="ORGANIZATION">All Store Branches</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="broadcast-details" className="text-xs font-semibold text-zinc-900">Notice Details</label>
            <textarea
              id="broadcast-details"
              className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 min-h-[90px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter instructions or announcements for the floor team..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
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
              {broadcastMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
