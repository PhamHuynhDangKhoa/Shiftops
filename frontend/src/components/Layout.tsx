import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import {
  IconLogo,
  IconMapPin,
  IconLogOut,
  IconAlertTriangle,
  IconMenu,
  IconClose,
  IconCalendar,
  IconClock,
  IconCheckList,
  IconHandshake,
  IconUsers,
  IconPanelLeft,
  IconPlus,
  IconSearch,
} from './ui/Icons';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // VS Code / Linear Collapsible Sidebar State (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shiftops_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('shiftops_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Cmd / Ctrl + B keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
  }

  const primaryNav: NavItem[] = isStaff
    ? [
        { to: '/', label: 'Overview', end: true, icon: IconLogo },
        { to: '/shifts', label: 'My Schedule', icon: IconCalendar },
        { to: '/attendance', label: 'Time Clock', icon: IconClock },
        { to: '/tasks', label: 'Checklist & Tasks', icon: IconCheckList },
      ]
    : [
        { to: '/', label: 'Overview', end: true, icon: IconLogo },
        { to: '/shifts', label: 'Shift Roster', icon: IconCalendar },
        { to: '/attendance', label: 'Attendance', icon: IconClock },
        { to: '/tasks', label: 'Checklist & Tasks', icon: IconCheckList },
      ];

  const secondaryNav: NavItem[] = isStaff
    ? [
        { to: '/issues', label: 'Report Incident', icon: IconAlertTriangle },
        { to: '/handovers', label: 'Shift Turnover', icon: IconHandshake },
      ]
    : [
        { to: '/issues', label: 'Incident Radar', icon: IconAlertTriangle },
        { to: '/handovers', label: 'Shift Turnover', icon: IconHandshake },
        { to: '/staff', label: 'Team Directory', icon: IconUsers },
        { to: '/branches', label: isOwner ? 'All Branches' : 'Store Settings', icon: IconMapPin },
      ];

  const allNav = [...primaryNav, ...secondaryNav];
  const currentNav = allNav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/'));
  const currentTitle = currentNav ? (currentNav.to === '/' ? "Today's Operations" : currentNav.label) : location.pathname === '/profile' ? 'Profile' : "Today's Operations";

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-zinc-50 text-zinc-900 antialiased">
      {/* VS Code / Linear Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full shrink-0 justify-between bg-zinc-100/80 border-r border-zinc-200/90 select-none transition-[width] duration-150 ${
          isSidebarCollapsed ? 'w-14 p-2' : 'w-56 p-3.5'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className={`pt-1 pb-3.5 ${isSidebarCollapsed ? 'flex justify-center' : 'px-1.5'}`}>
          <Link
            to="/"
            title="ShiftOps"
            className="flex items-center gap-2.5 text-zinc-900 hover:opacity-85 transition-opacity"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-semibold text-xs shrink-0">
              <IconLogo size={15} />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm leading-tight text-zinc-900">ShiftOps</span>
                <span className="text-[11px] text-zinc-600 leading-tight truncate">
                  {user?.primaryBranchName ? user.primaryBranchName : 'Shibuya Flagship'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Groups */}
        {isAuthenticated && (
          <nav className="flex-1 mt-1 space-y-4 overflow-y-auto" aria-label="Main Navigation">
            <div>
              {!isSidebarCollapsed && (
                <div className="px-2 pb-1 text-[11px] font-semibold text-zinc-600">
                  Operations
                </div>
              )}
              <div className="space-y-0.5">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 h-8 text-[13px] rounded-md transition-colors ${
                          isSidebarCollapsed ? 'justify-center px-0 w-full' : 'px-2.5'
                        } ${
                          isActive
                            ? 'bg-white border border-zinc-200/90 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={14} className={`shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`} />
                          {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <div className="px-2 pb-1 text-[11px] font-semibold text-zinc-600">
                  Management
                </div>
              )}
              <div className="space-y-0.5">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 h-8 text-[13px] rounded-md transition-colors ${
                          isSidebarCollapsed ? 'justify-center px-0 w-full' : 'px-2.5'
                        } ${
                          isActive
                            ? 'bg-white border border-zinc-200/90 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={14} className={`shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`} />
                          {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </nav>
        )}

        {/* Pinned Bottom Manager Profile & Logout */}
        {isAuthenticated && user && (
          <div className="pt-3 border-t border-zinc-200/90 shrink-0 mt-auto">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2 p-1">
                <Link
                  to="/profile"
                  title={`${user.fullName} (${user.role === 'STAFF' ? 'Store Staff' : user.role === 'MANAGER' ? 'Manager' : 'Executive'})`}
                  className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold hover:opacity-85 transition-opacity"
                >
                  {user.fullName.charAt(0)}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-1 text-zinc-600 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                >
                  <IconLogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-zinc-200/90">
                <Link to="/profile" className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-85 transition-opacity">
                  <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-zinc-900 truncate leading-tight">
                      {user.fullName}
                    </span>
                    <span className="text-[11px] text-zinc-600 leading-tight">
                      {user.role === 'STAFF' ? 'Store Staff' : user.role === 'MANAGER' ? 'Manager' : 'Executive'}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-1 text-zinc-600 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                >
                  <IconLogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Unified Single-Row Top Command Bar (h-14) */}
        <header className="h-14 shrink-0 px-3.5 sm:px-4 lg:px-5 border-b border-zinc-200 bg-white flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Group */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <IconClose size={16} /> : <IconMenu size={16} />}
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar (Cmd+B)"
              title="Toggle sidebar (Ctrl+B / Cmd+B)"
              className="hidden md:flex p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <IconPanelLeft size={16} />
            </button>

            {/* Page Title */}
            <h1 className="font-semibold text-sm sm:text-base text-zinc-900 whitespace-nowrap">
              {currentTitle}
            </h1>

            {/* Compact Shift Pill (high contrast zinc-700 on zinc-100) */}
            <span className="text-[13px] text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md whitespace-nowrap hidden lg:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{user?.primaryBranchName ? user.primaryBranchName : 'Main Branch'} · 08:00–16:30</span>
            </span>
          </div>

          {/* Right Group: Telemetry & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0 whitespace-nowrap">
            {/* Center Telemetry & Quick Filter (hidden on mobile, visible on tablet & desktop) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3.5 shrink-0 whitespace-nowrap">
              {/* Quick Filter / Command Input (visible on laptop & desktop) */}
              <div className="relative hidden lg:flex items-center">
                <IconSearch size={13} className="absolute left-2.5 text-zinc-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks, staff..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    window.dispatchEvent(new CustomEvent('shiftops:filter-search', { detail: e.target.value }));
                  }}
                  aria-label="Quick search tasks and staff (Cmd+K)"
                  className="w-36 xl:w-56 h-8 pl-7 pr-8 rounded-md bg-zinc-100/80 border border-zinc-200/80 text-xs text-zinc-800 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-colors"
                />
                <kbd className="absolute right-1.5 px-1 py-0.5 text-[11px] font-mono text-zinc-600 bg-white border border-zinc-200 rounded pointer-events-none">
                  ⌘K
                </kbd>
              </div>

              {/* Inline Telemetry Pills (visible on md/lg/xl) */}
              <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-[13px] border-r border-zinc-200 pr-2 lg:pr-3.5">
                {/* Shift: 68% */}
                <div className="flex items-center gap-1.5 text-zinc-700">
                  <span className="text-zinc-600 font-medium">Shift:</span>
                  <div className="hidden lg:block w-9 lg:w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100} aria-label="Shift progress">
                    <div className="w-[68%] h-full bg-zinc-800 rounded-full" />
                  </div>
                  <span className="font-semibold text-zinc-900 tabular-nums">68%</span>
                </div>

                {/* Float: $350.00 */}
                <div className="flex items-center gap-1.5 text-zinc-700">
                  <span className="text-zinc-600 font-medium">Float:</span>
                  <code className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">$350.00</code>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Action Buttons with Tactile Micro-Surfaces */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('shiftops:open-broadcast-modal'))}
                className="h-8 px-2 lg:px-3 text-[13px] font-medium gap-1 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] transition-colors"
                aria-label="Publish store notice"
                title="Publish store notice"
              >
                <IconPlus size={13} />
                <span className="hidden lg:inline">Notice</span>
              </Button>

              <Link to="/attendance">
                <Button
                  variant="dark"
                  size="sm"
                  className="h-8 px-2.5 lg:px-3 text-[13px] font-medium gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99] transition-colors"
                  aria-label="Punch attendance clock"
                  title="Punch attendance clock"
                >
                  <IconClock size={13} />
                  <span className="hidden lg:inline">Punch Clock</span>
                </Button>
              </Link>

              {isAuthenticated ? (
                <NotificationBell />
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-3 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-zinc-200">
              {allNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-[13px]">
              <span className="font-semibold text-zinc-900">{user?.fullName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-rose-600 font-semibold text-[13px] cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Content (Fixed Viewport Container) */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-zinc-50">
          {children}
        </main>
      </div>
    </div>
  );
};
