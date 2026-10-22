import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { ApiResponse, Branch, Announcement, AnnouncementTargetType, RealtimeEvent } from '../lib/types';
import { Card, Badge, Button, Modal, Input } from '../components/ui';
import {
  IconMegaphone,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconCheckList,
  IconAlertTriangle,
  IconHandshake,
  IconMapPin,
  IconUsers,
  IconPlus,
} from '../components/ui/Icons';

interface HealthData {
  status: string;
  version: string;
  database: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { lastEvent } = useWebSocket();
  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Format real-time event descriptions for dashboard activity indicator
  const formatEventSummary = (evt: RealtimeEvent | null) => {
    if (!evt) return '';
    const payload = (evt.payload || {}) as Record<string, unknown>;
    switch (evt.eventType) {
      case 'STAFF_CHECKED_IN':
        return `Staff checked in: ${String(payload.staffName || 'Staff Member')}`;
      case 'STAFF_CHECKED_OUT':
        return `Staff checked out: ${String(payload.staffName || 'Staff Member')}`;
      case 'TASK_COMPLETED':
        return `Task completed: ${String(payload.taskTitle || 'Task')}`;
      case 'TASK_STATUS_CHANGED':
        return `Task status updated: ${String(payload.taskTitle || 'Task')}`;
      case 'ISSUE_STATUS_CHANGED':
        return `Issue updated: ${String(payload.title || 'Issue')} (${String(payload.status || '')})`;
      case 'HANDOVER_SUBMITTED':
        return `Shift handover submitted: ${String(payload.shiftName || '')}`;
      case 'HANDOVER_ACKNOWLEDGED':
        return `Shift handover acknowledged`;
      case 'ANNOUNCEMENT_PUBLISHED':
        return `Announcement published: ${String(payload.title || '')}`;
      case 'NOTIFICATION_CREATED': {
        const notif = payload.notification as { title?: string } | undefined;
        return `New notification: ${notif?.title || ''}`;
      }
      default:
        return `Operational update: ${evt.eventType}`;
    }
  };

  // Broadcast modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetType, setBroadcastTargetType] = useState<AnnouncementTargetType>('BRANCH');
  const [broadcastBranchId, setBroadcastBranchId] = useState(user?.primaryBranchId || '');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Health check query
  const { data: health } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HealthData>>('/health');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  // Branches query
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Branch[]>>('/branches');
      return res.data.data;
    },
    enabled: isOwner || isManager,
  });

  // Announcements query
  const { data: announcements, refetch: refetchAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['announcements', 'my'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Announcement[]>>('/announcements/my');
      return res.data.data;
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
      setBroadcastError(null);
      refetchAnnouncements();
    },
    onError: (err: unknown) => {
      let msg = 'Failed to create announcement';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setBroadcastError(msg);
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      setBroadcastError('Title and content are required.');
      return;
    }
    setBroadcastError(null);
    broadcastMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Operations Dashboard</h1>
            <Badge variant="neutral" size="sm">
              {user?.role}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 font-mono">
            {user?.primaryBranchName ? (
              <span className="flex items-center gap-1">
                <IconMapPin size={12} className="text-zinc-400" />
                {user.primaryBranchName}
              </span>
            ) : (
              <span>All Branches</span>
            )}
            <span>·</span>
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isOwner || isManager) && (
            <Button
              variant="primary"
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
              <IconMegaphone size={14} />
              <span>Broadcast Notice</span>
            </Button>
          )}
          <Link to="/attendance">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <IconClock size={14} />
              <span>Clock Punch</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Event Activity Feed Banner */}
      {lastEvent && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 text-zinc-100 rounded-md text-xs font-mono">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">LIVE</span>
            <span className="text-zinc-200 truncate">{formatEventSummary(lastEvent)}</span>
          </div>
          <span className="text-[11px] text-zinc-400 ml-4 flex-shrink-0 tabular-nums">
            {new Date(lastEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card compact className="space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">Operating Branches</span>
            <IconBuilding size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950">
            {branches ? branches.length : '—'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {branches?.filter((b) => b.active).length || 0} active locations
          </div>
        </Card>

        <Card compact className="space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">Active Broadcasts</span>
            <IconMegaphone size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950">
            {announcements ? announcements.length : 0}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Operations notices active
          </div>
        </Card>

        <Card compact className="space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">System State</span>
            <div
              className={`w-2 h-2 rounded-full ${
                health?.status === 'UP' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950">
            {health?.status || 'Online'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            DB: {health?.database || 'PostgreSQL'} · v{health?.version || '1.0'}
          </div>
        </Card>

        <Card compact className="space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">Auth & Policy</span>
            <div
              className={`w-2 h-2 rounded-full ${
                user?.mustChangePassword ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950">
            {user?.mustChangePassword ? 'Action Req' : 'Secure'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {user?.mustChangePassword ? 'Temp password active' : 'Session verified'}
          </div>
        </Card>
      </div>

      {/* Operational Modules Navigation Grid */}
      <div>
        <div className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2.5">
          Operational Modules
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <Link
            to="/shifts"
            className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
          >
            <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
              <IconCalendar size={18} />
              <span className="text-[10px] font-mono text-zinc-400">01</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                Shift Roster
              </div>
              <div className="text-[11px] text-zinc-500">Schedule & assign</div>
            </div>
          </Link>

          <Link
            to="/attendance"
            className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
          >
            <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
              <IconClock size={18} />
              <span className="text-[10px] font-mono text-zinc-400">02</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                Attendance
              </div>
              <div className="text-[11px] text-zinc-500">Clock in/out & punch</div>
            </div>
          </Link>

          <Link
            to="/tasks"
            className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
          >
            <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
              <IconCheckList size={18} />
              <span className="text-[10px] font-mono text-zinc-400">03</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                Shift Tasks
              </div>
              <div className="text-[11px] text-zinc-500">Checklist & verify</div>
            </div>
          </Link>

          <Link
            to="/issues"
            className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
          >
            <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
              <IconAlertTriangle size={18} />
              <span className="text-[10px] font-mono text-zinc-400">04</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                Incidents
              </div>
              <div className="text-[11px] text-zinc-500">Log & triage issues</div>
            </div>
          </Link>

          <Link
            to="/handovers"
            className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
          >
            <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
              <IconHandshake size={18} />
              <span className="text-[10px] font-mono text-zinc-400">05</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                Handovers
              </div>
              <div className="text-[11px] text-zinc-500">Debrief & turnover</div>
            </div>
          </Link>

          {(isOwner || isManager) ? (
            <Link
              to="/staff"
              className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
            >
              <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
                <IconUsers size={18} />
                <span className="text-[10px] font-mono text-zinc-400">06</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                  Staff Roster
                </div>
                <div className="text-[11px] text-zinc-500">Personnel & roles</div>
              </div>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="p-3 bg-white border border-zinc-200 rounded-md hover:border-zinc-400 transition-colors group flex flex-col justify-between min-h-[88px]"
            >
              <div className="flex items-center justify-between text-zinc-500 group-hover:text-zinc-950">
                <IconBuilding size={18} />
                <span className="text-[10px] font-mono text-zinc-400">06</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950">
                  My Profile
                </div>
                <div className="text-[11px] text-zinc-500">Preferences & key</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Active Operational Announcements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-950">Operational Broadcasts</h2>
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
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer flex items-center gap-1"
            >
              <IconPlus size={13} />
              <span>New Announcement</span>
            </button>
          )}
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {announcements.map((ann) => (
              <Card key={ann.id} accent="blue" className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-950 text-sm truncate">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-0.5">
                      <span>By {ann.createdByName}</span>
                      <span>·</span>
                      <span>{new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={ann.targetType === 'ORGANIZATION' ? 'urgent' : 'neutral'} size="sm">
                    {ann.targetType === 'ORGANIZATION' ? 'Org-Wide' : ann.branchName || 'Branch'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-700 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>
                {ann.targetShiftName && (
                  <div className="text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded inline-block">
                    Target Shift: {ann.targetShiftName}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-zinc-500 text-xs">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
              <IconMegaphone size={16} />
            </div>
            <p className="font-medium text-zinc-800">No active broadcasts</p>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              Normal operations are underway across branches.
            </p>
          </Card>
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast Operations Notice"
        description="Publish an immediate notice to shift personnel across branches"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          {broadcastError && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200/90 rounded-md">
              {broadcastError}
            </div>
          )}

          <Input
            label="Title"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Schedule Revision for Weekend Coverage"
            maxLength={150}
            required
          />

          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Target Audience</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">Specific Branch</option>
                <option value="ORGANIZATION">Organization-Wide (All Branches)</option>
              </select>
            </div>
          )}

          {broadcastTargetType === 'BRANCH' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700">Branch</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                value={broadcastBranchId}
                onChange={(e) => setBroadcastBranchId(e.target.value)}
                disabled={!isOwner && !!user?.primaryBranchId}
              >
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700">Notice Details</label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 min-h-[110px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Provide exact operational instructions or updates..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
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
