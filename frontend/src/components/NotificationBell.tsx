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
        case 'ANNOUNCEMENT':
          navigate('/');
          break;
        default:
          break;
      }
    }
  };

  const renderNotificationIcon = (type: string) => {
    const iconClass = 'w-4 h-4 text-[#00f0ff] mt-0.5 flex-shrink-0';
    switch (type) {
      case 'SHIFT_PUBLISHED':
      case 'SHIFT_CHANGED':
        return <IconCalendar className={iconClass} />;
      case 'TASK_ASSIGNED':
        return <IconCheckList className={iconClass} />;
      case 'ISSUE_ASSIGNED':
      case 'ISSUE_UPDATED':
        return <IconAlertTriangle className="w-4 h-4 text-[#ff6b00] mt-0.5 flex-shrink-0" />;
      case 'HANDOVER_SUBMITTED':
      case 'HANDOVER_ACKNOWLEDGED':
        return <IconHandshake className={iconClass} />;
      case 'ANNOUNCEMENT_PUBLISHED':
        return <IconMegaphone className="w-4 h-4 text-[#e5c07b] mt-0.5 flex-shrink-0" />;
      case 'SHIFT_REMINDER':
        return <IconClock className={iconClass} />;
      default:
        return <IconBell className={iconClass} />;
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
      {/* Tactical Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-9 px-2.5 rounded-sm bg-[#13151a] border border-[#2a2f3d] text-[#9da8b9] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all duration-150 cursor-pointer flex items-center justify-center focus:outline-none"
        title="Tactical Comms & Notifications"
        aria-label="Notifications"
      >
        <IconBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ff1744] text-white text-[10px] font-mono font-bold h-4 min-w-[16px] px-1 flex items-center justify-center border border-[#090a0d] shadow-[0_0_8px_rgba(255,23,68,0.6)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Tactical Dossier */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#11141a] border border-[#2a2f3d] shadow-[0_0_30px_rgba(0,0,0,0.9)] z-50 overflow-hidden flex flex-col clip-chamfer-card"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2f3d] bg-[#161922]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#00f0ff] inline-block shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
              <span className="font-mono font-bold text-white text-xs uppercase tracking-wider">
                COMMS // NOTIFICATIONS
              </span>
              {unreadCount > 0 && (
                <span className="bg-[#ff1744]/20 border border-[#ff1744]/40 text-[#ff335c] text-[10px] font-mono font-bold px-1.5 py-0.2">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-[11px] font-mono uppercase text-[#9da8b9] hover:text-[#00f0ff] disabled:opacity-40 transition-colors cursor-pointer"
              >
                [ MARK ALL READ ]
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto divide-y divide-[#1e222c] flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-[#606c80] text-xs font-mono flex flex-col items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#00f0ff]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>SYNCING_DISPATCH...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#9da8b9] text-xs font-mono flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-[#181c24] border border-[#2a2f3d] flex items-center justify-center text-[#00f0ff]">
                  <IconCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-white uppercase tracking-wider">ALL DISPATCHES RESOLVED</span>
                <span className="text-[11px] text-[#606c80]">No pending transmissions</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#181c24] transition-colors cursor-pointer ${
                    !notif.read ? 'bg-[#141820]' : 'bg-transparent'
                  }`}
                >
                  {renderNotificationIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs truncate ${!notif.read ? 'text-[#00f0ff] font-bold' : 'text-[#f1f5f9]'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#606c80] flex-shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#9da8b9] line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.8)] flex-shrink-0 mt-2" title="Unread" />
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
