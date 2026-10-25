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

  // Role pill styling per editorial Swiss palette
  const roleBadgeStyle = isOwner
    ? 'bg-[#fef7e0] text-[#b06000] border-[#b06000]/25'
    : isManager
    ? 'bg-[#fae8e5] text-[#e11d48] border-[#e11d48]/25'
    : 'bg-[#e6f4ea] text-[#137333] border-[#137333]/25';

  // Resolve current section name for breadcrumb
  const currentNav = navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/'));
  const currentTitle = currentNav ? currentNav.label : location.pathname === '/profile' ? 'Profile' : 'Operations';

  return (
    <div className="min-h-screen bg-[#f6f5f1] text-[#181a1b] antialiased flex flex-col md:flex-row selection:bg-[#e11d48] selection:text-white">
      {/* Sidebar: 236px on warm stone ground (#f6f5f1) */}
      <aside className="hidden md:flex flex-col w-[236px] flex-shrink-0 bg-[#f6f5f1] border-r border-[#ded7cc] p-4 text-xs select-none">
        {/* Brand Monogram & Workspace Scope */}
        <div className="px-2 pt-2 pb-4">
          <Link to="/" className="flex items-center gap-3 text-[#181a1b] hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SO
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight text-[#181a1b]">ShiftOps</span>
              <span className="text-xs text-[#666159] leading-tight">
                {user?.primaryBranchName ? user.primaryBranchName : 'Fleet Operations'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        {isAuthenticated && (
          <nav className="flex-1 mt-3 space-y-1">
            <div className="px-2 pb-1 text-xs font-semibold text-[#948e84]">
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
                    `flex items-center gap-2.5 h-9 px-3 text-xs rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#faf7f2] border border-[#ded7cc] text-[#181a1b] font-bold shadow-xs'
                        : 'text-[#666159] hover:text-[#181a1b] hover:bg-[#faf7f2]/60 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={`flex-shrink-0 stroke-[1.8] ${isActive ? 'text-[#e11d48]' : 'text-[#666159]'}`} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* User Card & Sign Out at Sidebar Foot */}
        {isAuthenticated && user && (
          <div className="pt-3 border-t border-[#ded7cc] mt-auto space-y-2">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-2 rounded-xl bg-[#faf7f2] border border-[#ded7cc] hover:bg-[#f0eae0] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#e11d48] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#181a1b] truncate leading-tight">
                  {user.fullName}
                </span>
                <span className={`inline-block mt-0.5 px-2 py-0.2 text-xs rounded-full border w-fit leading-tight font-medium ${roleBadgeStyle}`}>
                  {user.role === 'STAFF' ? 'Staff' : user.role === 'MANAGER' ? 'Manager' : 'Owner'}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#666159] hover:text-[#c5221f] hover:bg-[#faf7f2] rounded-xl transition-colors cursor-pointer text-left"
            >
              <IconLogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Canvas Area: 52px Top Bar + Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f5f1]">
        {/* Top Bar: 52px height on warm ground with clean rule */}
        <header className="h-13 px-4 md:px-8 flex items-center justify-between gap-4 bg-[#f6f5f1] border-b border-[#ded7cc] text-xs">
          {/* Left: Mobile Toggle & Scope Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-[#666159] hover:text-[#181a1b] hover:bg-[#faf7f2] rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
            </button>

            <div className="flex items-center gap-2 text-xs text-[#666159]">
              <span className="font-bold text-[#181a1b]">ShiftOps</span>
              <span className="text-[#ded7cc]">/</span>
              <span className="text-[#181a1b] font-medium">{currentTitle}</span>
            </div>
          </div>

          {/* Right: Live Telemetry Indicator & Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#666159] px-2.5 py-1 rounded-full bg-[#faf7f2] border border-[#ded7cc]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'CONNECTED' ? 'bg-[#137333]' : status === 'RECONNECTING' ? 'bg-[#b06000]' : 'bg-[#948e84]'
                  }`}
                />
                <span className="font-medium text-[#181a1b]">
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
          <div className="md:hidden bg-[#faf7f2] border-b border-[#ded7cc] px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-[#ded7cc]">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#e11d48] text-white'
                        : 'text-[#666159] hover:text-[#181a1b] hover:bg-[#f6f5f1]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-[#666159] hover:text-[#181a1b] hover:bg-[#f6f5f1]"
              >
                Profile
              </NavLink>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="font-bold text-[#181a1b]">{user?.fullName}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-[#c5221f] font-semibold text-xs cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Password Reset Warning Ribbon if required */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="mx-4 mt-3 bg-[#fef7e0] border border-[#b06000]/25 rounded-xl px-3.5 py-2 text-xs text-[#b06000] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertTriangle size={15} className="text-[#b06000] flex-shrink-0" />
              <span>Temporary password active. Update password to secure account.</span>
            </div>
            <Link to="/profile" className="font-semibold underline underline-offset-2 hover:text-[#181a1b]">
              Update
            </Link>
          </div>
        )}

        {/* Operational Canvas: Generous breathing room, clean rounded card containers */}
        <main className="flex-1 p-5 sm:p-7 md:p-8 min-h-[calc(100vh-52px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
