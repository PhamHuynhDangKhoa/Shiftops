import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ApiResponse, PagedResponse, Notification, UnreadCountResponse } from '../lib/types';
import {
  IconBell,
  IconCalendar,
  IconCheckList,
  IconAlertTriangle,
  IconHandshake,
  IconMegaphone,
  IconClock,
  IconCheck,
} from './ui/Icons';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Poll unread count every 20 seconds
  const { data: unreadData } = useQuery<UnreadCountResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
      return res.data.data;
    },
    refetchInterval: 20000,
  });

  // Fetch recent notifications when dropdown is open
  const { data: pagedNotifications, isLoading } = useQuery<PagedResponse<Notification>>({
    queryKey: ['notifications', 'my'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PagedResponse<Notification>>>('/notifications/my?size=15');
      return res.data.data;
    },
    enabled: isOpen,
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = unreadData?.count ?? 0;
  const notifications = pagedNotifications?.content ?? [];

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markAsReadMutation.mutate(notif.id);
    }
    setIsOpen(false);

    if (notif.referenceType) {
      switch (notif.referenceType) {
        case 'SHIFT':
          navigate('/shifts');
          break;
        case 'TASK':
          navigate('/tasks');
          break;
        case 'ISSUE':
          navigate('/issues');
          break;
        case 'HANDOVER':
          navigate('/handovers');
          break;
        default:
          break;
      }
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'SHIFT_PUBLISHED':
      case 'SHIFT_CHANGED':
      case 'SHIFT_REMINDER':
      case 'SHIFT_ASSIGNED':
      case 'SHIFT_CANCELLED':
        return <IconCalendar size={16} className="text-[#1b6c80] flex-shrink-0 mt-0.5" />;
      case 'TASK_ASSIGNED':
        return <IconCheckList size={16} className="text-[#1b6c80] flex-shrink-0 mt-0.5" />;
      case 'ISSUE_REPORTED':
      case 'ISSUE_ASSIGNED':
      case 'ISSUE_RESOLVED':
        return <IconAlertTriangle size={16} className="text-[#c4242a] flex-shrink-0 mt-0.5" />;
      case 'HANDOVER_SUBMITTED':
      case 'HANDOVER_ACKNOWLEDGED':
        return <IconHandshake size={16} className="text-[#92400e] flex-shrink-0 mt-0.5" />;
      case 'ANNOUNCEMENT_PUBLISHED':
      case 'ANNOUNCEMENT':
        return <IconMegaphone size={16} className="text-[#1b6c80] flex-shrink-0 mt-0.5" />;
      case 'ATTENDANCE_LATE':
      case 'ATTENDANCE_MISSED':
        return <IconClock size={16} className="text-[#92400e] flex-shrink-0 mt-0.5" />;
      default:
        return <IconBell size={16} className="text-[#5d5f60] flex-shrink-0 mt-0.5" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-md text-[#5d5f60] hover:text-[#131416] hover:bg-[#ebedee] transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <IconBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#c4242a] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e8eaec] rounded-xl shadow-lg z-50 overflow-hidden flex flex-col" // taste-skill-ignore
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f1f2] bg-[#f9fbfc]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#131416] text-xs">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-[#ffedea] border border-[#831c1e]/20 text-[#831c1e] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs font-medium text-[#5d5f60] hover:text-[#131416] disabled:opacity-40 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto divide-y divide-zinc-100 flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                  <IconCheck className="w-4 h-4" />
                </div>
                <span className="font-medium text-zinc-800">All caught up</span>
                <span className="text-[11px] text-zinc-400">No unread notifications right now</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-zinc-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-blue-50/30' : 'bg-transparent'
                  }`}
                >
                  {renderNotificationIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs truncate ${!notif.read ? 'text-zinc-950 font-semibold' : 'text-zinc-700'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
