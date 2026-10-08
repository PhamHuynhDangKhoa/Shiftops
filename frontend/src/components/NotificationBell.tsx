import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ApiResponse, PagedResponse, Notification, UnreadCountResponse } from '../lib/types';

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
        case 'ANNOUNCEMENT':
          navigate('/');
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SHIFT_PUBLISHED':
      case 'SHIFT_CHANGED':
        return '📅';
      case 'TASK_ASSIGNED':
        return '📋';
      case 'ISSUE_ASSIGNED':
      case 'ISSUE_UPDATED':
        return '⚠️';
      case 'HANDOVER_SUBMITTED':
      case 'HANDOVER_ACKNOWLEDGED':
        return '🤝';
      case 'ANNOUNCEMENT_PUBLISHED':
        return '📢';
      case 'SHIFT_REMINDER':
        return '⏰';
      default:
        return '🔔';
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
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="text-xl leading-none select-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white shadow-xs animate-in fade-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/75">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
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
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <span className="text-3xl">✨</span>
                <span className="font-semibold text-gray-700">All caught up!</span>
                <span className="text-xs text-gray-400">No notifications to display.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold truncate ${!notif.read ? 'text-blue-950 font-bold' : 'text-gray-900'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" title="Unread" />
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
