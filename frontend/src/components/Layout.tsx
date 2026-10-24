import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
} from './ui/Icons';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { status } = useWebSocket();
  const navigate = useNavigate();
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
        { to: '/', label: 'Overview', end: true },
        { to: '/shifts', label: 'My Schedule' },
        { to: '/attendance', label: 'Attendance' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/issues', label: 'Incidents' },
        { to: '/handovers', label: 'Turnover' },
      ]
    : [
        { to: '/', label: isOwner ? 'Command' : 'Overview', end: true },
        { to: '/shifts', label: 'Roster' },
        { to: '/attendance', label: 'Attendance' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/issues', label: 'Incidents' },
        { to: '/handovers', label: 'Turnover' },
        { to: '/staff', label: 'Personnel' },
        { to: '/branches', label: isOwner ? 'Branches' : 'Branch' },
      ];

  // Role pill styling
  const roleBadgeStyle = isOwner
    ? 'bg-zinc-100 text-zinc-800 border-zinc-200/80'
    : isManager
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200/70';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      {/* Top Telemetry Strip */}
      <div className="px-4 sm:px-6 py-1.5 bg-white border-b border-zinc-200/70 text-xs flex items-center justify-between text-zinc-500 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-800">ShiftOps</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-600">
            {user?.primaryBranchName ? user.primaryBranchName : 'Fleet Operations'}
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${roleBadgeStyle}`}>
              {user.role === 'STAFF' ? 'Staff Operator' : user.role === 'MANAGER' ? 'Shift Manager' : 'Organization Owner'}
            </span>
            <span className="text-zinc-300 hidden sm:inline">/</span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'CONNECTED' ? 'bg-emerald-500' : status === 'RECONNECTING' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400'
                }`}
              />
              <span>
                {status === 'CONNECTED' ? 'Live Sync' : status === 'RECONNECTING' ? 'Re-syncing' : 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
          {/* Left: Brand Icon + Desktop Nav Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-950 font-bold tracking-tight hover:opacity-85 transition-opacity flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                <IconLogo size={16} />
              </div>
              <span className="text-base font-bold text-zinc-950">ShiftOps</span>
            </Link>

            {/* Desktop Nav: Zero side-scroll, perfectly constrained items */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-100 text-zinc-950 font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Operator Dock & Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <>
                <NotificationBell />

                {/* Operator Profile Capsule */}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-zinc-200/80 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-zinc-900 leading-none whitespace-nowrap">
                      {user.fullName}
                    </span>
                    {user.primaryBranchName && (
                      <span className="text-[11px] text-zinc-500 leading-none mt-1 flex items-center gap-0.5 whitespace-nowrap">
                        <IconMapPin size={10} className="text-zinc-400" />
                        <span>{user.primaryBranchName}</span>
                      </span>
                    )}
                  </div>
                </Link>

                {/* Logout Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  title="Sign out"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-600"
                >
                  <IconLogOut size={13} />
                  <span>Sign Out</span>
                </Button>

                {/* Mobile Menu Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
                </button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Menu */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-zinc-200/80 px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-1 pb-3 border-b border-zinc-100">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              >
                Profile
              </NavLink>
            </div>

            {/* Mobile Operator Details & Logout */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-900">{user?.fullName}</span>
                <span className="text-[11px] text-zinc-500">{user?.primaryBranchName || 'Fleet Operator'}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="gap-1.5 text-xs text-zinc-600"
              >
                <IconLogOut size={13} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}

        {/* Temporary Password Reset Alert Ribbon */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="bg-amber-50 border-t border-b border-amber-200/80 px-4 py-2 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
            <IconAlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <span>A temporary password is active on your account. Please update your password to secure access.</span>
            <Link
              to="/profile"
              className="text-amber-800 font-semibold underline underline-offset-2 hover:text-amber-950 ml-1"
            >
              Update Password →
            </Link>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {children}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-5 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-2 text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-zinc-800">ShiftOps Operations Platform</span>
          <span>© 2026</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>System Status: Operational</span>
          <span>Secure TLS Encryption</span>
        </div>
      </footer>
    </div>
  );
};
