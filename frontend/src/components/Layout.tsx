import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { NotificationBell } from './NotificationBell';
import {
  IconLogOut,
  IconMenu,
  IconClose,
  IconCalendar,
  IconClock,
  IconBell,
  IconBuilding2,
  IconUser,
  IconMessageCircle,
  IconListTodo,
  IconFileText,
} from './ui/Icons';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { status: wsStatus } = useWebSocket();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('shiftops:focus-search'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStaff = user?.role === 'STAFF';
  const isOwner = user?.role === 'OWNER';

  interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    end?: boolean;
    badge?: string | number;
  }

  const primaryNav: NavItem[] = isStaff
    ? [
        { to: '/', label: 'Overview', end: true, icon: IconListTodo },
        { to: '/shifts', label: 'My Schedule', icon: IconCalendar },
        { to: '/attendance', label: 'Time Clock', icon: IconClock },
        { to: '/tasks', label: 'Checklist & Tasks', icon: IconFileText },
      ]
    : [
        { to: '/', label: 'Overview', end: true, icon: IconListTodo },
        { to: '/shifts', label: 'Shift Roster', icon: IconCalendar },
        { to: '/attendance', label: 'Attendance', icon: IconClock },
        { to: '/tasks', label: 'Checklist & Tasks', icon: IconFileText },
      ];

  const secondaryNav: NavItem[] = isStaff
    ? [
        { to: '/issues', label: 'Report Incident', icon: IconBell },
        { to: '/handovers', label: 'Shift Turnover', icon: IconMessageCircle },
      ]
    : [
        { to: '/issues', label: 'Incident Radar', icon: IconBell, badge: 1 },
        { to: '/handovers', label: 'Shift Turnover', icon: IconMessageCircle },
        { to: '/staff', label: 'Team Directory', icon: IconUser },
        {
          to: '/branches',
          label: isOwner ? 'All Branches' : 'Store Settings',
          icon: IconBuilding2,
        },
      ];

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#f9fbfc] flex flex-col text-[#131416] antialiased select-none">
      {/* 48px Top Chrome Bar on #f9fbfc Ground (No separating rule into sidebar) */}
      <header className="h-12 w-full px-3 sm:px-4 flex items-center justify-between shrink-0 bg-[#f9fbfc] z-30">
        {/* Left: Brand Monogram + Title + Branch Scope */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-[#5d5f60] hover:text-[#131416] rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <IconClose size={16} /> : <IconMenu size={16} />}
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="w-7 h-7 rounded-md bg-[#131416] text-white flex items-center justify-center font-bold text-xs tracking-tight">
              SO
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#131416]">
              ShiftOps
            </span>
          </Link>

          <span className="text-[#cdced1] hidden sm:inline" aria-hidden="true">
            /
          </span>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#5d5f60]">
            <span className="font-medium text-[#131416]">
              {user?.primaryBranchName || 'Shibuya Flagship'}
            </span>
            <span className="text-[11px] text-[#5d5f60]">(Store #04)</span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="hidden md:flex items-center">
          <div className="w-64 lg:w-80 h-8 px-2.5 rounded-md bg-white border border-[#cdced1] flex items-center gap-2 text-xs text-[#5d5f60]">
            <svg
              className="w-3.5 h-3.5 text-[#5d5f60] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="truncate">Search staff, shifts, tasks...</span>
            <kbd className="ml-auto px-1.5 py-0.5 rounded text-[11px] font-mono text-[#5d5f60] bg-[#f4f6f8] border border-[#cdced1]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Operational Status + Live Time + Bell */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#cdced1] text-xs font-medium text-[#131416]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsStatus === 'CONNECTED'
                  ? 'bg-[#1e7b4f]'
                  : wsStatus === 'RECONNECTING'
                  ? 'bg-[#92400e]'
                  : 'bg-[#1e7b4f]'
              }`}
            />
            <span className="tabular-nums font-mono text-[11px]">
              {wsStatus === 'CONNECTED' ? 'Live STOMP' : 'Live Sync'}
            </span>
          </div>

          <div className="hidden lg:block text-xs font-mono tabular-nums text-[#5d5f60] px-1">
            {currentTimeStr} JST
          </div>

          <NotificationBell />
        </div>
      </header>

      {/* Main Framework Body: Sidebar (Left) + Framed Sheet (Right) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Sidebar (224px width on #f9fbfc ground, no border to top bar) */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col justify-between px-3 pb-3 bg-[#f9fbfc]">
          <div className="space-y-4 pt-1">
            {/* Group 1: Operations */}
            <div>
              <div className="text-xs font-semibold text-[#5d5f60] px-2 pb-1.5">
                Operations
              </div>
              <nav className="space-y-0.5" aria-label="Operations Navigation">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `w-full h-8 px-2.5 rounded-md flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#ebedee] text-[#131416] font-semibold'
                            : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#ebedee]/60'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className="shrink-0 text-[#5d5f60]" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold bg-[#fffbeb] text-[#92400e] border border-[#92400e]/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Group 2: Store Dispatch & Management */}
            <div>
              <div className="text-xs font-semibold text-[#5d5f60] px-2 pb-1.5">
                Management
              </div>
              <nav className="space-y-0.5" aria-label="Management Navigation">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `w-full h-8 px-2.5 rounded-md flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#ebedee] text-[#131416] font-semibold'
                            : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#ebedee]/60'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className="shrink-0 text-[#5d5f60]" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[11px] font-mono font-semibold bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Account Row at Bottom */}
          {isAuthenticated && user && (
            <div className="pt-2 border-t border-[#f0f1f2]">
              <div className="p-2 rounded-lg bg-white border border-[#e8eaec] flex items-center justify-between gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity"
                  title={`${user.fullName} (${user.role})`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#f4f6f8] border border-[#cdced1] flex items-center justify-center text-[11px] font-semibold text-[#131416] shrink-0">
                    {user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#131416] truncate leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[11px] text-[#5d5f60] uppercase tracking-tight">
                      {user.role}
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-1 text-[#5d5f60] hover:text-[#131416] rounded transition-colors cursor-pointer"
                >
                  <IconLogOut size={14} />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="fixed inset-x-0 top-12 bottom-0 z-40 bg-[#f9fbfc] p-4 flex flex-col justify-between overflow-y-auto md:hidden">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-[#5d5f60] uppercase px-1">
                Navigation
              </div>
              <div className="space-y-1">
                {allNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium ${
                        isActive
                          ? 'bg-[#ebedee] text-[#131416] font-semibold'
                          : 'text-[#5d5f60] hover:bg-[#ebedee]/60'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ffedea] text-[#831c1e]">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#f0f1f2] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#131416]">
                  {user?.fullName}
                </div>
                <div className="text-[11px] text-[#5d5f60]">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-xs font-semibold text-[#c4242a] px-3 py-1.5 rounded-md border border-[#c4242a]/30"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Framed Sheet: Inset 8px, 16px radius, 1px #e8eaec hairline border */}
        <main className="flex-1 min-w-0 mr-0 sm:mr-3 mb-0 sm:mb-3 bg-white rounded-none sm:rounded-2xl border-t sm:border border-[#e8eaec] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 text-[#131416]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
