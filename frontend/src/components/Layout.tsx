import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { NotificationBell } from './NotificationBell';
import {
  IconLogo,
  IconMapPin,
  IconLogOut,
  IconAlertTriangle,
} from './ui/Icons';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { status } = useWebSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleVariant = (role?: string): 'brand' | 'neutral' | 'urgent' => {
    switch (role) {
      case 'OWNER':
        return 'brand';
      case 'MANAGER':
        return 'brand';
      case 'STAFF':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand + Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-950 font-semibold tracking-tight text-sm hover:opacity-85 transition-opacity flex-shrink-0"
            >
              <span className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center">
                <IconLogo size={14} />
              </span>
              <span className="font-semibold text-sm tracking-tight text-zinc-950">ShiftOps</span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-600 bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded font-normal">
                PORTAL
              </span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Dashboard
                </NavLink>

                {user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                  <NavLink
                    to="/branches"
                    className={({ isActive }) =>
                      `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                      }`
                    }
                  >
                    Branches
                  </NavLink>
                )}

                {user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                  <NavLink
                    to="/staff"
                    className={({ isActive }) =>
                      `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                      }`
                    }
                  >
                    Staff
                  </NavLink>
                )}

                <NavLink
                  to="/shifts"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Shifts
                </NavLink>

                <NavLink
                  to="/attendance"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Attendance
                </NavLink>

                <NavLink
                  to="/tasks"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Tasks
                </NavLink>

                <NavLink
                  to="/issues"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Issues
                </NavLink>

                <NavLink
                  to="/handovers"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Handover
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-xs rounded-md transition-colors font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  Profile
                </NavLink>
              </nav>
            )}
          </div>

          {/* Right: Status + User + Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* WebSocket Status Indicator */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                    status === 'CONNECTED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : status === 'RECONNECTING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}
                  title={
                    status === 'CONNECTED'
                      ? 'Realtime WebSocket Active'
                      : status === 'RECONNECTING'
                      ? 'Reconnecting to realtime broker...'
                      : 'Realtime updates offline'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'CONNECTED'
                        ? 'bg-emerald-500 animate-pulse'
                        : status === 'RECONNECTING'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <span>
                    {status === 'CONNECTED' ? 'Live' : status === 'RECONNECTING' ? 'Reconnecting' : 'Offline'}
                  </span>
                </div>

                <NotificationBell />

                {/* User Identity */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900 leading-none">
                      {user.fullName}
                    </span>
                    <Badge variant={getRoleVariant(user.role)} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                  {user.primaryBranchName && (
                    <span className="text-[11px] text-zinc-500 flex items-center gap-0.5 mt-0.5 font-mono leading-none">
                      <IconMapPin size={11} className="text-zinc-400" />
                      {user.primaryBranchName}
                    </span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  title="Sign out of ShiftOps"
                  className="gap-1.5"
                >
                  <IconLogOut size={13} className="text-zinc-500" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
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

        {/* Temporary Password Alert Banner */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="bg-amber-50 border-t border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
            <IconAlertTriangle size={14} className="text-amber-700 flex-shrink-0" />
            <span>
              <strong>Action Required:</strong> You are logged in with a temporary password.
            </span>
            <Link
              to="/profile"
              className="text-amber-800 font-semibold underline underline-offset-2 hover:text-amber-950"
            >
              Update your password now →
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-500 font-mono">
        ShiftOps © 2026 — Operations & Shift Management Platform
      </footer>
    </div>
  );
};
