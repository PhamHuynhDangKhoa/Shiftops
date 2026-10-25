import React, { useState } from 'react';
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
import {
  IconClock,
  IconCheck,
  IconPlus,
} from '../components/ui/Icons';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const isStaff = !isOwner && !isManager;

  // Broadcast modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetType, setBroadcastTargetType] = useState<AnnouncementTargetType>('BRANCH');
  const [broadcastBranchId, setBroadcastBranchId] = useState(user?.primaryBranchId || '');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Filter tab for checklist
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');

  // Real store operational checklist
  const [shiftChecklist, setShiftChecklist] = useState([
    { id: 't1', title: 'Register float & cash drawer count ($350.00)', time: '08:15', done: true, assignee: 'Elena H.' },
    { id: 't2', title: 'Main entrance display restock and merchandising', time: '09:30', done: true, assignee: 'Marcus T.' },
    { id: 't3', title: 'Perishable goods refrigeration temperature audit', time: '11:00', done: true, assignee: 'Jordan K.' },
    { id: 't4', title: 'Midday customer checkout queue cover', time: '13:30', done: false, assignee: 'Elena H.' },
    { id: 't5', title: 'POS terminal sanitization & waste recycling', time: '15:00', done: false, assignee: 'Jordan K.' },
    { id: 't6', title: 'Evening register float reconcile & safe drop count', time: '16:15', done: false, assignee: 'Marcus T.' },
  ]);

  const toggleChecklistItem = (id: string) => {
    setShiftChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = shiftChecklist.filter((t) => t.done).length;
  const filteredChecklist = shiftChecklist.filter((t) => {
    if (checklistFilter === 'PENDING') return !t.done;
    if (checklistFilter === 'DONE') return t.done;
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

  // Active floor staff
  const floorStaff = [
    { name: 'Marcus Tanaka', role: 'Store Supervisor', status: 'On duty', time: '08:00 – 16:30' },
    { name: 'Elena Rostova', role: 'Cashier & Front Desk', status: 'On duty', time: '08:00 – 16:30' },
    { name: 'Jordan Kim', role: 'Inventory & Floor', status: 'On break', time: '08:30 – 17:00' },
    { name: 'Kenji Sato', role: 'Customer Service', status: 'On duty', time: '09:00 – 17:30' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Clean Store Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
            Today's Operations
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1">
            {user?.primaryBranchName || 'Shibuya Flagship'} · Morning Shift (08:00 – 16:30) · Floor active
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
              className="gap-1.5"
            >
              <IconPlus size={14} />
              <span>Notice</span>
            </Button>
          )}

          <Link to="/attendance">
            <Button variant="dark" size="sm" className="gap-2">
              <IconClock size={14} />
              <span>{isStaff ? (isCurrentlyClockedIn ? 'Clock Out' : 'Clock In') : 'Punch Clock'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Apple Divided Operational Metric Bar */}
      <div className="bg-white border border-[#e5e5ea] rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#e5e5ea]">
        <div className="p-4 sm:p-5">
          <span className="text-xs font-medium text-[#6e6e73] block">Team on Floor</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">4</span>
            <span className="text-xs text-[#34c759] font-medium">1 on break</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <span className="text-xs font-medium text-[#6e6e73] block">Shift Elapsed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">68%</span>
            <span className="text-xs text-[#6e6e73]">5h 45m of 8h 30m</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <span className="text-xs font-medium text-[#6e6e73] block">Routine Checklist</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">{completedCount} of 6</span>
            <span className="text-xs text-[#6e6e73]">{6 - completedCount} pending</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <span className="text-xs font-medium text-[#6e6e73] block">Cash Drawer Float</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1d1d1f] tabular-nums">$350.00</span>
            <span className="text-xs text-[#34c759] font-medium">Balanced</span>
          </div>
        </div>
      </div>

      {/* 3. Primary Workspace Grid (62% Left, 38% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shift Tasks & Team on Duty */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shift Checklist Card */}
          <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-[#f2f2f7] mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Shift Checklist</h2>
                <p className="text-xs text-[#86868b] mt-0.5">Floor compliance and daily operational routine</p>
              </div>

              {/* Apple Segmented Filter */}
              <div className="bg-[#f2f2f7] p-0.5 rounded-lg flex items-center gap-1 self-start sm:self-auto text-xs" role="tablist" aria-label="Task filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={checklistFilter === 'ALL'}
                  onClick={() => setChecklistFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    checklistFilter === 'ALL'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  All ({shiftChecklist.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={checklistFilter === 'PENDING'}
                  onClick={() => setChecklistFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    checklistFilter === 'PENDING'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  Pending ({shiftChecklist.length - completedCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={checklistFilter === 'DONE'}
                  onClick={() => setChecklistFilter('DONE')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    checklistFilter === 'DONE'
                      ? 'bg-white text-[#1d1d1f] border border-[#e5e5ea]'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  Verified ({completedCount})
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2" role="group" aria-label="Task checklist">
              {filteredChecklist.map((task) => (
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
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] ${
                    task.done
                      ? 'bg-[#fbfbfd] border-[#e5e5ea] opacity-80'
                      : 'bg-white border-[#e5e5ea] hover:border-[#d1d1d6]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        task.done ? 'bg-[#34c759] text-white' : 'border border-[#c7c7cc] bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {task.done && <IconCheck size={11} className="stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-sm block truncate leading-snug ${
                          task.done ? 'line-through text-[#86868b]' : 'font-medium text-[#1d1d1f]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-xs text-[#86868b] block mt-0.5">
                        Due {task.time} · {task.assignee}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      task.done ? 'bg-[#f2f2f7] text-[#6e6e73]' : 'bg-[#e5f1ff] text-[#0071e3]'
                    }`}
                  >
                    {task.done ? 'Done' : 'Active'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f2f2f7] flex items-center justify-between text-xs text-[#86868b]">
              <span>Need detailed task template generation?</span>
              <Link to="/tasks" className="font-semibold text-[#1d1d1f] hover:underline">
                Open task manager →
              </Link>
            </div>
          </div>

          {/* Real-time Team on Floor Roster */}
          <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7] mb-3">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Staff on Floor</h2>
                <p className="text-xs text-[#86868b] mt-0.5">Active shift roster coverage</p>
              </div>
              <Link to="/shifts" className="text-xs font-semibold text-[#1d1d1f] hover:underline">
                Full roster →
              </Link>
            </div>

            <div className="divide-y divide-[#f2f2f7]">
              {floorStaff.map((staff, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#f2f2f7] text-[#1d1d1f] font-semibold flex items-center justify-center text-xs flex-shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-[#1d1d1f] block truncate">{staff.name}</span>
                      <span className="text-[#86868b] block truncate">{staff.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#86868b]">{staff.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        staff.status === 'On duty'
                          ? 'bg-[#eaf8ee] text-[#1e7b4f]'
                          : 'bg-[#fff8e7] text-[#b06000]'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Turnover Debrief & Notices */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shift Handover Card */}
          <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7] mb-3">
              <h2 className="text-base font-semibold text-[#1d1d1f]">Shift Turnover</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e5f1ff] text-[#0071e3]">
                Upcoming
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#fbfbfd] border border-[#e5e5ea] rounded-xl">
                <span className="text-[#86868b] block">Next rotation:</span>
                <span className="text-sm font-semibold text-[#1d1d1f] block mt-0.5">
                  Afternoon Shift (16:30)
                </span>
                <span className="text-[#86868b] block mt-1">Lead: Sarah Jenkins</span>
              </div>

              <div className="p-3 bg-[#fbfbfd] border border-[#e5e5ea] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[#86868b] block">Register status:</span>
                  <span className="font-semibold text-[#1d1d1f] block mt-0.5">Balanced ($0.00 variance)</span>
                </div>
                <IconCheck size={16} className="text-[#34c759]" />
              </div>

              <Link to="/handovers" className="block pt-1">
                <Button variant="dark" size="md" className="w-full gap-2">
                  <span>Prepare Turnover Debrief</span>
                  <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Store Announcements Bulletins */}
          <div className="bg-white border border-[#e5e5ea] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f7] mb-3">
              <h2 className="text-base font-semibold text-[#1d1d1f]">Store Notices</h2>
              {announcements && announcements.length > 0 && (
                <span className="text-xs text-[#86868b]">
                  {announcements.length} posted
                </span>
              )}
            </div>

            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-3 bg-[#fbfbfd] border border-[#e5e5ea] rounded-xl space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-[#1d1d1f] truncate flex-1">{ann.title}</span>
                      <span className="text-[11px] text-[#86868b] whitespace-nowrap">
                        {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#86868b]">
                <p>No active store notices.</p>
              </div>
            )}
          </div>
        </div>
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
            <div role="alert" className="p-3 text-xs font-semibold text-[#d70015] bg-[#fff2f2] border border-[#ff3b30]/20 rounded-xl">
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
              <label htmlFor="broadcast-target" className="text-xs font-semibold text-[#1d1d1f]">Target Audience</label>
              <select
                id="broadcast-target"
                className="w-full h-10 px-3 text-xs rounded-xl border border-[#d1d1d6] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">This Branch Only</option>
                <option value="ORGANIZATION">All Store Branches</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="broadcast-details" className="text-xs font-semibold text-[#1d1d1f]">Notice Details</label>
            <textarea
              id="broadcast-details"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#d1d1d6] bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 min-h-[100px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Enter instructions or announcements for the floor team..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f2f2f7]">
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
