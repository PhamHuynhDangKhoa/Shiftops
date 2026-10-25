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
  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'OWNER';

  // Navigation Items per role
  const navItems = isStaff
    ? [
        { to: '/', label: 'Overview', end: true, icon: IconLogo },
        { to: '/shifts', label: 'My Schedule', icon: IconCalendar },
        { to: '/attendance', label: 'Attendance', icon: IconClock },
        { to: '/tasks', label: 'Tasks', icon: IconCheckList },
        { to: '/issues', label: 'Incidents', icon: IconAlertTriangle },
        { to: '/handovers', label: 'Turnover', icon: IconHandshake },
      ]
    : [
        { to: '/', label: isOwner ? 'Command' : 'Overview', end: true, icon: IconLogo },
        { to: '/shifts', label: 'Roster', icon: IconCalendar },
        { to: '/attendance', label: 'Attendance', icon: IconClock },
        { to: '/tasks', label: 'Tasks', icon: IconCheckList },
        { to: '/issues', label: 'Incidents', icon: IconAlertTriangle },
        { to: '/handovers', label: 'Turnover', icon: IconHandshake },
        { to: '/staff', label: 'Personnel', icon: IconUsers },
        { to: '/branches', label: isOwner ? 'Branches' : 'Branch', icon: IconMapPin },
      ];

  // Role pill styling per framed-sheet palette
  const roleBadgeStyle = isOwner
    ? 'bg-[#fffbeb] text-[#92400e] border-[#92400e]/20'
    : isManager
    ? 'bg-[#e9f4f7] text-[#1b6c80] border-[#1b6c80]/20'
    : 'bg-[#dcfae5] text-[#04250e] border-[#1e7b4f]/20';

  // Resolve current section name for breadcrumb
  const currentNav = navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/'));
  const currentTitle = currentNav ? currentNav.label : location.pathname === '/profile' ? 'Profile' : 'Operations';

  return (
    <div className="min-h-screen bg-[#f9fbfc] text-[#131416] antialiased flex flex-col md:flex-row selection:bg-[#1b6c80] selection:text-white">
      {/* Sidebar: 228px on crisp neutral ground (#f9fbfc) */}
      <aside className="hidden md:flex flex-col w-[228px] flex-shrink-0 bg-[#f9fbfc] border-r border-[#e8eaec] p-4 text-xs select-none">
        {/* Brand Monogram & Workspace Scope */}
        <div className="px-2 pt-2 pb-4">
          <Link to="/" className="flex items-center gap-2.5 text-[#131416] hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#1b6c80] text-white flex items-center justify-center font-bold text-xs">
              SO
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-tight text-[#131416]">ShiftOps</span>
              <span className="text-xs text-[#5d5f60] leading-tight truncate">
                {user?.primaryBranchName ? user.primaryBranchName : 'Fleet Operations'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        {isAuthenticated && (
          <nav className="flex-1 mt-3 space-y-1" aria-label="Main Navigation">
            <div className="px-2 pb-1 text-xs font-semibold text-[#727477]">
              Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 h-9 px-3 text-xs rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#ffffff] border border-[#e8eaec] text-[#131416] font-semibold'
                        : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#ffffff]/60 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={`flex-shrink-0 stroke-[1.8] ${isActive ? 'text-[#1b6c80]' : 'text-[#5d5f60]'}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b6c80]" aria-hidden="true" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* User Card & Sign Out at Sidebar Foot */}
        {isAuthenticated && user && (
          <div className="pt-3 border-t border-[#e8eaec] mt-auto space-y-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-2 rounded-lg bg-[#ffffff] border border-[#e8eaec] hover:bg-[#f4f6f8] transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[#1b6c80] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#131416] truncate leading-tight">
                  {user.fullName}
                </span>
                <span className={`inline-block mt-0.5 px-2 py-0.2 text-xs rounded-md border w-fit leading-tight font-medium ${roleBadgeStyle}`}>
                  {user.role === 'STAFF' ? 'Staff' : user.role === 'MANAGER' ? 'Manager' : 'Owner'}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5d5f60] hover:text-[#c4242a] hover:bg-[#ffffff] rounded-lg transition-colors cursor-pointer text-left"
            >
              <IconLogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Canvas Area: 52px Top Bar + Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9fbfc]">
        {/* Top Bar: 52px height on neutral ground with clean rule */}
        <header className="h-13 px-4 md:px-8 flex items-center justify-between gap-4 bg-[#f9fbfc] border-b border-[#e8eaec] text-xs">
          {/* Left: Mobile Toggle & Scope Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-[#5d5f60] hover:text-[#131416] hover:bg-[#ffffff] rounded-md transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
            </button>

            <div className="flex items-center gap-2 text-xs text-[#5d5f60]">
              <span className="font-bold text-[#131416]">ShiftOps</span>
              <span className="text-[#cdced1]" aria-hidden="true">/</span>
              <span className="text-[#131416] font-medium">{currentTitle}</span>
            </div>
          </div>

          {/* Right: Live Telemetry Indicator & Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#5d5f60] px-2.5 py-1 rounded-md bg-[#ffffff] border border-[#e8eaec]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'CONNECTED' ? 'bg-[#1e7b4f]' : status === 'RECONNECTING' ? 'bg-[#92400e]' : 'bg-[#727477]'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium text-[#131416]">
                  {status === 'CONNECTED' ? 'Live sync' : status === 'RECONNECTING' ? 'Re-syncing' : 'Offline'}
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
          <div className="md:hidden bg-[#ffffff] border-b border-[#e8eaec] px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-[#e8eaec]">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#1b6c80] text-white'
                        : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-md text-[#5d5f60] hover:text-[#131416] hover:bg-[#f4f6f8]"
              >
                Profile
              </NavLink>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="font-bold text-[#131416]">{user?.fullName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-[#c4242a] font-semibold text-xs cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Password Reset Warning Ribbon if required */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="mx-4 mt-3 bg-[#fffbeb] border border-[#92400e]/20 rounded-md px-3.5 py-2 text-xs text-[#92400e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertTriangle size={15} className="text-[#92400e] flex-shrink-0" />
              <span>Temporary password active. Update password to secure account.</span>
            </div>
            <Link to="/profile" className="font-semibold underline underline-offset-2 hover:text-[#131416]">
              Update
            </Link>
          </div>
        )}

        {/* Operational Canvas */}
        <main className="flex-1 p-5 sm:p-7 md:p-8 min-h-[calc(100vh-52px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
