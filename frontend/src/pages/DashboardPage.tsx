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
} from '../lib/types';
import { Card, Badge, Button, Modal, Input } from '../components/ui';
import {
  IconMegaphone,
  IconClock,
  IconCheckList,
  IconAlertTriangle,
  IconHandshake,
  IconMapPin,
  IconPlus,
  IconCheck,
} from '../components/ui/Icons';

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
        return `Issue updated: ${String(payload.title || 'Issue')}`;
      case 'HANDOVER_SUBMITTED':
        return `Shift handover submitted: ${String(payload.shiftName || '')}`;
      case 'HANDOVER_ACKNOWLEDGED':
        return `Shift handover signed by manager`;
      case 'ANNOUNCEMENT_PUBLISHED':
        return `New announcement: ${String(payload.title || '')}`;
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

  // Local interactive task checklist state for shift execution
  const [shiftChecklist, setShiftChecklist] = useState([
    { id: 't1', title: 'Morning register float & cash drawer count ($350.00)', time: '08:15', done: true, assignee: 'Elena H.' },
    { id: 't2', title: 'Main entrance promotional merchandising & display restock', time: '09:30', done: true, assignee: 'Marcus T.' },
    { id: 't3', title: 'Perishable goods refrigeration temperature verification', time: '11:00', done: true, assignee: 'Jordan K.' },
    { id: 't4', title: 'Midday customer checkout queue triage & lunch break cover', time: '13:30', done: false, assignee: 'Elena H.' },
    { id: 't5', title: 'Floor recycling disposal & POS payment terminal sanitization', time: '15:00', done: false, assignee: 'Jordan K.' },
    { id: 't6', title: 'Evening handover cash reconcile & safe drop count', time: '16:15', done: false, assignee: 'Marcus T.' },
  ]);

  const toggleChecklistItem = (id: string) => {
    setShiftChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedChecklistCount = shiftChecklist.filter((t) => t.done).length;

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

  const isCurrentlyClockedIn = true;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Top Identity & Context Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#e8eaec]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#131416]">
              Store Operations Deck
            </h1>
            <Badge variant="brand" size="sm">
              {user?.role || 'Manager'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5d5f60] mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-[#131416]">
              <IconMapPin size={14} className="text-[#1b6c80]" />
              <span>{user?.primaryBranchName ? user.primaryBranchName : 'Shibuya Flagship'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Sunday, Oct 25</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1e7b4f] font-medium">Floor active</span>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-3 flex-wrap">
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
              className="gap-2"
            >
              <IconMegaphone size={14} />
              <span>Broadcast Notice</span>
            </Button>
          )}

          <Link to="/attendance">
            <Button variant="primary" size="sm" className="gap-2">
              <IconClock size={14} />
              <span>{isStaff ? (isCurrentlyClockedIn ? 'Clock Out' : 'Clock In') : 'Floor Attendance'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real-time Telemetry Bar */}
      {lastEvent && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#ffffff] border border-[#e8eaec] rounded-lg text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#1e7b4f] flex-shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[#131416]">Live telemetry:</span>
            <span className="text-[#5d5f60] truncate">{formatEventSummary(lastEvent)}</span>
          </div>
          <span className="text-xs text-[#727477] ml-4 tabular-nums">
            {new Date(lastEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* 3. HERO OPERATIONAL SHEET */}
      <div className="bg-[#ffffff] border border-[#e8eaec] rounded-xl p-6 sm:p-7 text-[#131416] relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e9f4f7] border border-[#1b6c80]/20 text-xs font-semibold text-[#1b6c80]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b6c80]" aria-hidden="true" />
                <span>Live shift roster</span>
              </span>
              <span className="text-xs text-[#5d5f60]">08:00 – 16:30 window</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#131416]">
              Morning Retail & Store Operations
            </h2>

            <p className="text-sm text-[#5d5f60] leading-relaxed">
              Supervised by <span className="text-[#131416] font-semibold">{user?.fullName || 'Marcus Tanaka'}</span>. Staggered floor rotations and cashier balance checks active.
            </p>

            {/* Shift Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#5d5f60]">
                <span>Shift progress (5h 45m elapsed)</span>
                <span className="font-semibold text-[#131416]">68%</span>
              </div>
              <div className="w-full h-2 bg-[#f0f1f2] rounded-full overflow-hidden">
                <div className="h-full bg-[#1b6c80] rounded-full w-[68%]" />
              </div>
            </div>
          </div>

          {/* Tabular Operational Counters */}
          <div className="flex flex-col items-stretch xl:items-end justify-between gap-4 pt-1">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full sm:w-auto">
              <div className="bg-[#f4f6f8] border border-[#e8eaec] rounded-lg px-4 py-3 text-center">
                <span className="block text-2xl font-bold text-[#131416] tabular-nums">4</span>
                <span className="block text-xs text-[#5d5f60] mt-0.5 whitespace-nowrap">On Floor</span>
              </div>
              <div className="bg-[#f4f6f8] border border-[#e8eaec] rounded-lg px-4 py-3 text-center">
                <span className="block text-2xl font-bold text-[#92400e] tabular-nums">1</span>
                <span className="block text-xs text-[#5d5f60] mt-0.5 whitespace-nowrap">On Break</span>
              </div>
              <div className="bg-[#f4f6f8] border border-[#e8eaec] rounded-lg px-4 py-3 text-center">
                <span className="block text-2xl font-bold text-[#727477] tabular-nums">0</span>
                <span className="block text-xs text-[#5d5f60] mt-0.5 whitespace-nowrap">Absent</span>
              </div>
            </div>

            <div className="w-full xl:w-auto">
              <Link to="/handovers" className="block w-full">
                <Button variant="primary" size="md" className="w-full xl:w-auto gap-2">
                  <span>Begin Shift Turnover Debrief</span>
                  <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DUAL COLUMN OPERATIONAL EXECUTION: Checklist & Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Shift Checklist */}
        <div className="lg:col-span-7 bg-[#ffffff] border border-[#e8eaec] rounded-xl p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-[#e8eaec] mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#e9f4f7] text-[#1b6c80] flex items-center justify-center font-bold">
                <IconCheckList size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#131416]">Shift Checklist & Tasks</h3>
                <p className="text-xs text-[#5d5f60]">Floor compliance and operational routine</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f4f6f8] text-[#131416] border border-[#e8eaec]">
              {completedChecklistCount} of {shiftChecklist.length} Verified
            </span>
          </div>

          {/* Interactive Keyboard-Accessible Checklist Rows */}
          <div className="space-y-2.5" role="group" aria-label="Shift task checklist">
            {shiftChecklist.map((task) => (
              <div
                key={task.id}
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
                className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b6c80] ${
                  task.done
                    ? 'bg-[#f4f6f8] border-[#e8eaec] opacity-85'
                    : 'bg-[#ffffff] border-[#e8eaec] hover:border-[#1b6c80]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    task.done ? 'bg-[#1e7b4f] text-white' : 'border border-[#cdced1] bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {task.done && <IconCheck size={13} className="stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm block leading-snug ${
                      task.done ? 'line-through text-[#5d5f60]' : 'font-semibold text-[#131416]'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#727477] mt-1">
                    <span>Due: {task.time}</span>
                    <span aria-hidden="true">·</span>
                    <span>Assigned: {task.assignee}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    task.done ? 'bg-[#dcfae5] text-[#04250e]' : 'bg-[#e9f4f7] text-[#1b6c80]'
                  }`}
                >
                  {task.done ? 'Complete' : 'Pending'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#e8eaec] flex items-center justify-between">
            <span className="text-xs text-[#5d5f60]">Need to dispatch ad-hoc tasks?</span>
            <Link to="/tasks" className="text-xs font-semibold text-[#1b6c80] hover:underline">
              View all branch tasks →
            </Link>
          </div>
        </div>

        {/* Right Column: Shift Turnover Debrief & Active Incident Radar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Turnover Status Ledger */}
          <div className="bg-[#ffffff] border border-[#e8eaec] rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8eaec] mb-4">
              <div className="flex items-center gap-2">
                <IconHandshake size={18} className="text-[#1b6c80]" />
                <h3 className="text-base font-bold text-[#131416]">Shift Turnover Ledger</h3>
              </div>
              <Badge variant="brand" size="sm">
                Ready for Review
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#f4f6f8] border border-[#e8eaec] rounded-lg">
                <span className="text-xs font-medium text-[#5d5f60] block">Incoming / Outgoing Rotation</span>
                <span className="text-sm font-semibold text-[#131416] block mt-0.5">
                  Morning Shift → Afternoon Shift
                </span>
              </div>

              <div className="p-3 bg-[#f4f6f8] border border-[#e8eaec] rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5d5f60]">Cash drawer reconcile:</span>
                  <span className="font-semibold text-[#1e7b4f]">Balanced ($0.00 variance)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#727477]">
                  <span>Opening Float: $350.00</span>
                  <span>End of Shift: $1,420.00</span>
                </div>
              </div>

              <div className="p-3 bg-[#f4f6f8] border border-[#e8eaec] rounded-lg text-xs text-[#5d5f60] leading-relaxed">
                <span className="font-semibold text-[#131416] block mb-1">Supervisor Turnover Note:</span>
                "Aisle 2 beverage restock completed. Register 3 receipt paper replaced. POS Terminal 2 network drop reported to IT."
              </div>

              <Link to="/handovers" className="block pt-1">
                <Button variant="primary" size="md" className="w-full gap-2">
                  <span>Sign Handover Debrief</span>
                  <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Incident Radar */}
          <div className="bg-[#ffffff] border border-[#e8eaec] rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8eaec] mb-3">
              <div className="flex items-center gap-2">
                <IconAlertTriangle size={18} className="text-[#c4242a]" />
                <h3 className="text-base font-bold text-[#131416]">Incident Radar</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/20">
                1 Active Flag
              </span>
            </div>

            <div className="p-3.5 bg-[#f4f6f8] border border-[#e8eaec] rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-[#131416]">POS Terminal 2 Network Drop</span>
                <span className="text-xs font-semibold text-[#831c1e] px-2 py-0.5 bg-[#ffedea] rounded border border-[#c4242a]/20">
                  High
                </span>
              </div>
              <p className="text-xs text-[#5d5f60] leading-relaxed">
                Intermittent offline sync on register 2 card reader. Cash transactions operating normally.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-[#e8eaec] text-xs">
                <span className="text-[#727477]">Reported 10:15 by Staff</span>
                <Link to="/issues" className="font-semibold text-[#1b6c80] hover:underline">
                  Triage issue →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE OPERATIONAL BROADCASTS */}
      <div className="space-y-4 pt-4 border-t border-[#e8eaec]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#131416]">
              Branch Operational Notices
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
              className="text-xs font-semibold text-[#1b6c80] hover:underline cursor-pointer flex items-center gap-1"
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
                    <h3 className="font-semibold text-[#131416] text-sm truncate">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#5d5f60] mt-0.5">
                      <span>Posted by {ann.createdByName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={ann.targetType === 'ORGANIZATION' ? 'warning' : 'brand'} size="sm">
                    {ann.targetType === 'ORGANIZATION' ? 'All Branches' : ann.branchName || 'Branch'}
                  </Badge>
                </div>
                <p className="text-xs text-[#5d5f60] whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-[#5d5f60] text-xs">
            <p className="font-semibold text-[#131416] text-sm">No announcements at this time</p>
            <p className="text-[#5d5f60] text-xs mt-1">
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
            <div role="alert" className="p-3 text-xs font-semibold text-[#831c1e] bg-[#ffedea] border border-[#c4242a]/20 rounded-md">
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
              <label htmlFor="broadcast-target" className="text-xs font-semibold text-[#131416]">Target Audience</label>
              <select
                id="broadcast-target"
                className="w-full px-3 py-2 text-xs rounded-md border border-[#cdced1] bg-[#ffffff] text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">Specific Branch</option>
                <option value="ORGANIZATION">Organization-Wide (All Branches)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="broadcast-details" className="text-xs font-semibold text-[#131416]">Notice Details</label>
            <textarea
              id="broadcast-details"
              className="w-full px-3 py-2 text-xs rounded-md border border-[#cdced1] bg-[#ffffff] text-[#131416] placeholder:text-[#727477] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80] min-h-[110px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter announcement details, instructions, or operational updates..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e8eaec]">
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
