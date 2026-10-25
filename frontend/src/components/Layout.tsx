import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
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
} from './ui/Icons';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { status } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Structured operations navigation (Apple macOS sidebar grouping)
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
  const currentTitle = currentNav ? currentNav.label : location.pathname === '/profile' ? 'Profile' : 'Store Operations';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased flex flex-col md:flex-row">
      {/* Apple-styled macOS Sidebar: 240px */}
      <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-[#fbfbfd] border-r border-[#e5e5ea] p-4 text-xs select-none">
        {/* Workspace Brand Pill */}
        <div className="px-1.5 pt-1.5 pb-4">
          <Link to="/" className="flex items-center gap-3 text-[#1d1d1f] hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center font-semibold text-xs">
              <IconLogo size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm leading-tight text-[#1d1d1f]">ShiftOps</span>
              <span className="text-xs text-[#86868b] leading-tight truncate">
                {user?.primaryBranchName ? user.primaryBranchName : 'Shibuya Flagship'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        {isAuthenticated && (
          <nav className="flex-1 mt-2 space-y-5" aria-label="Main Navigation">
            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-[#86868b]">
                Operations
              </div>
              <div className="space-y-0.5">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 h-8.5 px-2.5 text-xs rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white border border-[#e5e5ea] text-[#1d1d1f] font-semibold'
                            : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-[#86868b]">
                Management
              </div>
              <div className="space-y-0.5">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 h-8.5 px-2.5 text-xs rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white border border-[#e5e5ea] text-[#1d1d1f] font-semibold'
                            : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </nav>
        )}

        {/* User Card at Footer */}
        {isAuthenticated && user && (
          <div className="pt-3 border-t border-[#e5e5ea] mt-auto">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5e5ea]">
              <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#1d1d1f] truncate leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[11px] text-[#86868b] leading-tight">
                    {user.role === 'STAFF' ? 'Store Staff' : user.role === 'MANAGER' ? 'Manager' : 'Executive'}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="p-1 text-[#86868b] hover:text-[#d70015] rounded-md transition-colors cursor-pointer"
              >
                <IconLogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f5f7]">
        {/* Apple-style 48px Header */}
        <header className="h-12 px-4 md:px-8 flex items-center justify-between gap-4 bg-white border-b border-[#e5e5ea] text-xs">
          {/* Left: Mobile Toggle & View Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
            </button>

            <span className="text-sm font-semibold text-[#1d1d1f]">
              {currentTitle}
            </span>
          </div>

          {/* Right: Live Telemetry Indicator & Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#6e6e73] px-2.5 py-1 rounded-full bg-[#f5f5f7]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'CONNECTED' ? 'bg-[#34c759]' : status === 'RECONNECTING' ? 'bg-[#ff9500]' : 'bg-[#86868b]'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium text-[#1d1d1f]">
                  {status === 'CONNECTED' ? 'Live sync' : status === 'RECONNECTING' ? 'Reconnecting' : 'Offline'}
                </span>
              </div>
            )}

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
        </header>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#e5e5ea] px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-[#e5e5ea]">
              {allNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#1d1d1f] text-white'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f]">{user?.fullName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-[#d70015] font-semibold text-xs cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-5 sm:p-7 md:p-8 min-h-[calc(100vh-48px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
