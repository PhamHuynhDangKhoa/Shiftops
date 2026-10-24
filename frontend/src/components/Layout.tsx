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
        { to: '/', label: 'Terminal', end: true },
        { to: '/shifts', label: 'Schedule' },
        { to: '/attendance', label: 'Attendance' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/issues', label: 'Incidents' },
        { to: '/handovers', label: 'Turnover' },
      ]
    : [
        { to: '/', label: isOwner ? 'Fleet Command' : 'Dispatch', end: true },
        { to: '/shifts', label: 'Roster' },
        { to: '/attendance', label: 'Attendance' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/issues', label: 'Incidents' },
        { to: '/handovers', label: 'Turnover' },
        { to: '/staff', label: 'Personnel' },
        { to: '/branches', label: isOwner ? 'Sectors' : 'Sector' },
      ];

  // Role tag styling
  const roleBadgeColor = isOwner
    ? 'text-[#e5c07b] border-[#e5c07b]/30 bg-[#e5c07b]/10'
    : isManager
    ? 'text-[#ff6b00] border-[#ff6b00]/30 bg-[#ff6b00]/10'
    : 'text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/10';

  const roleAccentBorder = isOwner
    ? 'border-b-[#e5c07b]/50'
    : isManager
    ? 'border-b-[#ff6b00]/50'
    : 'border-b-[#00f0ff]/50';

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-[#f1f5f9] antialiased selection:bg-[#00f0ff]/20 selection:text-white">
      {/* Top Sector & Telemetry Bar */}
      <div className={`px-4 sm:px-6 py-1.5 bg-[#0d0f14] border-b border-[#1e222b] text-[11px] font-mono flex items-center justify-between text-[#8a94a6] select-none ${roleAccentBorder}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-none rotate-45 ${
                isOwner ? 'bg-[#e5c07b]' : isManager ? 'bg-[#ff6b00]' : 'bg-[#00f0ff]'
              }`}
            />
            <span className="font-bold tracking-widest text-white text-xs">SHIFTOPS</span>
          </div>
          <span className="text-[#2a2f3d]">/</span>
          <span className="hidden sm:inline text-[#8a94a6] tracking-wider uppercase text-[10px]">
            {user?.primaryBranchName ? `SECTOR: ${user.primaryBranchName}` : 'FLEET WIDE'}
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${roleBadgeColor}`}>
              {user.role}
            </span>
            <span className="text-[#2a2f3d]">/</span>
            <div className="flex items-center gap-1.5 text-[10px] text-[#8a94a6]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'CONNECTED' ? 'bg-[#00e676]' : status === 'RECONNECTING' ? 'bg-[#ff6b00] animate-pulse' : 'bg-[#606c80]'
                }`}
              />
              <span className="hidden md:inline uppercase">
                {status === 'CONNECTED' ? 'TELEMETRY LIVE' : status === 'RECONNECTING' ? 'RE-SYNCING' : 'OFFLINE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#11141a]/95 backdrop-blur-md border-b border-[#262c38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Glyph & Desktop Nav Tabs */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-white font-mono font-bold tracking-tight hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <div className="w-8 h-8 bg-[#181c24] border border-[#2a2f3d] text-[#00f0ff] flex items-center justify-center clip-chamfer-btn">
                <IconLogo size={16} />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-white">SHIFTOPS</span>
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
                      `px-3 py-1.5 text-xs font-mono font-medium tracking-wider uppercase transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-white bg-[#181c24] border-b-2 border-[#00f0ff] font-bold'
                          : 'text-[#8a94a6] hover:text-white hover:bg-[#161922]'
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
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <NotificationBell />

                {/* Operator Identity Capsule */}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#161922] border border-[#262c38] hover:border-[#384255] transition-colors"
                >
                  <div className="w-5 h-5 bg-[#202531] flex items-center justify-center text-[10px] font-mono font-bold text-[#00f0ff]">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-bold text-white leading-none whitespace-nowrap">
                      {user.fullName}
                    </span>
                    {user.primaryBranchName && (
                      <span className="text-[9px] font-mono text-[#8a94a6] leading-none mt-1 flex items-center gap-0.5 whitespace-nowrap">
                        <IconMapPin size={9} className="text-[#00f0ff]" />
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
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono whitespace-nowrap"
                >
                  <IconLogOut size={13} className="text-[#8a94a6]" />
                  <span>Sign Out</span>
                </Button>

                {/* Mobile Menu Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-[#8a94a6] hover:text-white hover:bg-[#181c24] border border-[#262c38] transition-colors"
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
          <div className="lg:hidden bg-[#11141a] border-t border-[#262c38] px-4 py-3 space-y-2 font-mono">
            <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-[#1e222b]">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'text-[#00f0ff] bg-[#181c24] border-l-2 border-[#00f0ff] font-bold'
                        : 'text-[#8a94a6] hover:text-white hover:bg-[#161922]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-[#8a94a6] hover:text-white hover:bg-[#161922]"
              >
                Profile
              </NavLink>
            </div>

            {/* Mobile Operator Details & Logout */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-white">{user?.fullName}</span>
                <span className="text-[10px] text-[#8a94a6]">{user?.primaryBranchName || 'Fleet Operator'}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="gap-1.5 text-xs"
              >
                <IconLogOut size={13} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}

        {/* Password Reset Alert Ribbon */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="bg-[#ff6b00]/10 border-t border-b border-[#ff6b00]/30 px-4 py-2 text-center text-xs font-mono text-[#ff8800] flex items-center justify-center gap-2">
            <IconAlertTriangle size={14} className="text-[#ff6b00] flex-shrink-0" />
            <span>Temporary password in effect. Update your password to secure access.</span>
            <Link
              to="/profile"
              className="text-[#00f0ff] font-bold underline underline-offset-2 hover:text-[#38f3ff] ml-1"
            >
              Update Credentials →
            </Link>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {children}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#1e222b] bg-[#0c0d12] py-4 text-center text-[11px] text-[#606c80] font-mono flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-2 text-[#8a94a6]">
          <span className="w-1.5 h-1.5 bg-[#00f0ff]" />
          <span>SHIFTOPS OPERATIONS PLATFORM</span>
          <span>© 2026</span>
        </div>
        <div className="flex items-center gap-4 text-[#606c80]">
          <span>STATUS: OPERATIONAL</span>
          <span>DISPATCH ENCRYPTED</span>
        </div>
      </footer>
    </div>
  );
};
