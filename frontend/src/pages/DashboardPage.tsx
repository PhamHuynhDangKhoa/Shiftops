import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { ApiResponse, Branch, Announcement, AnnouncementTargetType, RealtimeEvent } from '../lib/types';
import { Card, Badge, Button, Modal, Input } from '../components/ui';

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
        return `Shift handover submitted for shift: ${String(payload.shiftName || '')}`;
      case 'HANDOVER_ACKNOWLEDGED':
        return `Shift handover acknowledged`;
      case 'ANNOUNCEMENT_PUBLISHED':
        return `New announcement published: ${String(payload.title || '')}`;
      case 'NOTIFICATION_CREATED': {
        const notif = payload.notification as { title?: string } | undefined;
        return `New notification: ${notif?.title || ''}`;
      }
      default:
        return `Operational update received: ${evt.eventType}`;
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
      const targetBranch = broadcastTargetType === 'ORGANIZATION'
        ? (broadcastBranchId || branches?.[0]?.id || user?.primaryBranchId)
        : (broadcastBranchId || user?.primaryBranchId || branches?.[0]?.id);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Live Operational Activity Banner */}
      {lastEvent && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs shadow-xs transition-all">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded">
              Live Event
            </span>
            <span className="font-medium text-emerald-950">{formatEventSummary(lastEvent)}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono">
            {new Date(lastEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Welcome Hero Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-r from-white via-white to-blue-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back, {user?.fullName}! 👋
            </h1>
            <p className="text-sm md:text-base text-gray-600 flex items-center gap-2 flex-wrap">
              <span>Logged in as</span>
              <Badge variant="brand">{user?.role}</Badge>
              {user?.primaryBranchName && (
                <span>
                  at <strong className="text-gray-900 font-semibold">{user.primaryBranchName}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
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
              >
                📢 Broadcast
              </Button>
            )}
            {(isOwner || isManager) && (
              <Link
                to="/staff"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Manage Staff
              </Link>
            )}
            {(isOwner || isManager) && (
              <Link
                to="/branches"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Branches
              </Link>
            )}
            <Link
              to="/attendance"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              ⏱️ Attendance
            </Link>
            <Link
              to="/tasks"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              📋 Tasks
            </Link>
            <Link
              to="/issues"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              ⚠️ Issues
            </Link>
            <Link
              to="/handovers"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              🤝 Handover
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </Card>

      {/* Active Operational Announcements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📢 Active Announcements
            </h2>
            {announcements && announcements.length > 0 && (
              <Badge variant="brand">{announcements.length}</Badge>
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              + Post New Announcement
            </button>
          )}
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <Card key={ann.id} className="p-5 border-l-4 border-l-blue-600 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-base truncate">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>By {ann.createdByName}</span>
                      <span>•</span>
                      <span>{new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={ann.targetType === 'ORGANIZATION' ? 'urgent' : 'normal'}>
                    {ann.targetType === 'ORGANIZATION'
                      ? 'Org-Wide'
                      : ann.branchName || 'Branch'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {ann.content}
                </p>
                {ann.targetShiftName && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md inline-block font-medium">
                    Target Shift: {ann.targetShiftName}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-gray-500 text-sm">
            <span className="text-2xl block mb-1">📣</span>
            No active announcements. Operations are running normally.
          </Card>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card accent="blue">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Operating Branches
          </span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1">
            {branches ? branches.length : '—'}
          </div>
          <span className="text-xs font-medium text-emerald-600 mt-1 block">
            {branches?.filter((b) => b.active).length || 0} active locations
          </span>
        </Card>

        <Card accent={health?.status === 'UP' ? 'green' : 'orange'}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System Status
          </span>
          <div
            className={`text-3xl font-extrabold mt-1 ${
              health?.status === 'UP' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {health?.status || 'Connecting...'}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            DB: {health?.database || 'PostgreSQL'} • API: v{health?.version || '1.0'}
          </span>
        </Card>

        <Card accent={user?.mustChangePassword ? 'orange' : 'green'}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Security Status
          </span>
          <div
            className={`text-3xl font-extrabold mt-1 ${
              user?.mustChangePassword ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {user?.mustChangePassword ? 'Action Required' : 'Healthy'}
          </div>
          <span
            className={`text-xs mt-1 block ${
              user?.mustChangePassword ? 'text-amber-600' : 'text-gray-500'
            }`}
          >
            {user?.mustChangePassword ? 'Temporary password active' : 'Credentials up-to-date'}
          </span>
        </Card>
      </div>

      {/* Modules Roadmap Notice */}
      <Card className="bg-slate-50 border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-2">ShiftOps Modules Status</h3>
        <p className="text-xs md:text-sm text-slate-600 space-y-1 leading-relaxed">
          • <strong>Phase 1:</strong> Authentication & Core Entities (Complete ✅)<br />
          • <strong>Phase 2:</strong> Branch & Staff Management (Complete ✅)<br />
          • <strong>Phase 3:</strong> Shift Scheduling & Concurrency Engine (Complete ✅)<br />
          • <strong>Phase 4:</strong> Attendance & Punctuality Engine (Complete ✅)<br />
          • <strong>Phase 5:</strong> Task Assignment & Templates (Complete ✅)<br />
          • <strong>Phase 5.5:</strong> Technical Cleanup & Architecture Hardening (Complete ✅)<br />
          • <strong>Phase 6:</strong> Issue Management & Resolution (Complete ✅)<br />
          • <strong>Phase 7:</strong> Shift Handover & Operations Continuity (Complete ✅)<br />
          • <strong>Phase 8:</strong> Announcements & Notifications (Complete ✅)<br />
          • <strong>Phase 9:</strong> Realtime / WebSocket Live Engine (Complete ✅)
        </p>
      </Card>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast Announcement"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          {broadcastError && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {broadcastError}
            </div>
          )}

          <Input
            label="Title"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="e.g. Health Inspection Tomorrow Morning"
            maxLength={150}
            required
          />

          {isOwner && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">Target Audience</label>
              <select
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={broadcastTargetType}
                onChange={(e) => setBroadcastTargetType(e.target.value as AnnouncementTargetType)}
              >
                <option value="BRANCH">Specific Branch</option>
                <option value="ORGANIZATION">Organization-Wide (All Branches)</option>
              </select>
            </div>
          )}

          {broadcastTargetType === 'BRANCH' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">Branch</label>
              <select
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Content</label>
            <textarea
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
              value={broadcastContent}
              onChange={(e) => setBroadcastContent(e.target.value)}
              placeholder="Write announcement details..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBroadcastModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={broadcastMutation.isPending}
            >
              Publish Now
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
