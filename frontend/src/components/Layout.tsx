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

  const isStaff = user?.role === 'STAFF';
  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'OWNER';

  // Role Clearance Theme Specs
  const clearanceData = isOwner
    ? {
        label: 'CLEARANCE :: L3_FLEET_DIRECTOR',
        badgeVariant: 'gold' as const,
        borderAccent: 'border-b-[#e5c07b]/40',
        sectorLabel: 'CENTRAL FLEET COMMAND',
        themeGlow: 'shadow-[0_0_12px_rgba(229,192,123,0.2)]',
        colorHex: '#e5c07b',
      }
    : isManager
    ? {
        label: 'CLEARANCE :: L2_SECTOR_COMMANDER',
        badgeVariant: 'warning' as const,
        borderAccent: 'border-b-[#ff6b00]/40',
        sectorLabel: user?.primaryBranchName ? `SECTOR // ${user.primaryBranchName.toUpperCase()}` : 'SECTOR DISPATCH',
        themeGlow: 'shadow-[0_0_12px_rgba(255,107,0,0.2)]',
        colorHex: '#ff6b00',
      }
    : {
        label: 'CLEARANCE :: L1_FIELD_OPERATOR',
        badgeVariant: 'cyan' as const,
        borderAccent: 'border-b-[#00f0ff]/40',
        sectorLabel: user?.primaryBranchName ? `STATION // ${user.primaryBranchName.toUpperCase()}` : 'FIELD TERMINAL',
        themeGlow: 'shadow-[0_0_12px_rgba(0,240,255,0.2)]',
        colorHex: '#00f0ff',
      };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-[#f1f5f9] antialiased selection:bg-[#00f0ff]/30 selection:text-white">
      {/* Top Telemetry Strip */}
      <div className={`px-4 sm:px-6 py-1 bg-[#0c0d12] border-b border-[#1e222b] text-[10px] font-mono flex items-center justify-between text-[#606c80] select-none ${clearanceData.borderAccent}`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#9da8b9]">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: clearanceData.colorHex }} />
            <span className="font-bold text-white tracking-widest">SHIFTOPS</span>
            <span className="text-[#606c80]">// PRTS_TERMINAL_v4.2</span>
          </span>
          <span className="hidden md:inline text-[#2a2f3d]">|</span>
          <span className="hidden md:inline text-[#9da8b9] tracking-wider uppercase">
            {clearanceData.sectorLabel}
          </span>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-2">
            <span className="tracking-wider uppercase font-semibold" style={{ color: clearanceData.colorHex }}>
              {clearanceData.label}
            </span>
            <span className="text-[#2a2f3d]">|</span>
            <span className="hidden sm:inline text-[#9da8b9]">SEC_STATUS: NORMAL</span>
          </div>
        )}
      </div>

      {/* Main Tactical Header Dock */}
      <header className="sticky top-0 z-40 bg-[#11141a]/95 backdrop-blur-md border-b border-[#262c38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Glyph + Role-Tailored Navigation Tabs */}
          <div className="flex items-center gap-6 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-white font-mono font-bold tracking-tight text-sm hover:opacity-85 transition-opacity flex-shrink-0 group"
            >
              <span className="w-9 h-9 bg-[#181c24] border border-[#2a2f3d] text-white flex items-center justify-center clip-chamfer-btn group-hover:border-[#00f0ff] group-hover:text-[#00f0ff] transition-colors">
                <IconLogo size={18} />
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-widest text-white leading-none">SHIFTOPS</span>
                <span className="text-[9px] font-mono tracking-wider text-[#00f0ff] leading-none mt-1">TACTICAL CORE</span>
              </div>
            </Link>

            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
                {/* 1. Home / Cockpit */}
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  {isStaff ? 'DUTY TERMINAL' : isManager ? 'BRANCH DISPATCH' : 'FLEET COMMAND'}
                </NavLink>

                {/* 2. Branches (Owner / Manager) */}
                {(isOwner || isManager) && (
                  <NavLink
                    to="/branches"
                    className={({ isActive }) =>
                      `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                        isActive
                          ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                      }`
                    }
                  >
                    {isOwner ? 'SECTORS' : 'SECTOR INFO'}
                  </NavLink>
                )}

                {/* 3. Staff Directory (Owner / Manager) */}
                {(isOwner || isManager) && (
                  <NavLink
                    to="/staff"
                    className={({ isActive }) =>
                      `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                        isActive
                          ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                      }`
                    }
                  >
                    PERSONNEL
                  </NavLink>
                )}

                {/* 4. Shifts / Scheduling */}
                <NavLink
                  to="/shifts"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  {isStaff ? 'MY SHIFTS' : 'ROSTER'}
                </NavLink>

                {/* 5. Attendance & Geolocation */}
                <NavLink
                  to="/attendance"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  ATTENDANCE
                </NavLink>

                {/* 6. Tasks & Mission Checklists */}
                <NavLink
                  to="/tasks"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  TASKS
                </NavLink>

                {/* 7. Issues & Incidents */}
                <NavLink
                  to="/issues"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#ff1744] border-[#ff1744] shadow-[0_0_10px_rgba(255,23,68,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-[#ff1744] hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  INCIDENTS
                </NavLink>

                {/* 8. Handover Debriefs */}
                <NavLink
                  to="/handovers"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#ff6b00] border-[#ff6b00] shadow-[0_0_10px_rgba(255,107,0,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-[#ff6b00] hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  HANDOVERS
                </NavLink>

                {/* 9. Profile */}
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `h-9 px-3.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 flex items-center whitespace-nowrap clip-chamfer-btn border ${
                      isActive
                        ? 'bg-[#181c24] text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-transparent text-[#9da8b9] border-transparent hover:text-white hover:bg-[#161922] hover:border-[#262c38]'
                    }`
                  }
                >
                  PROFILE
                </NavLink>
              </nav>
            )}
          </div>

          {/* Right Action Dock */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Real-time STOMP Link Status */}
                <div
                  className={`hidden sm:inline-flex items-center gap-2 h-9 px-3 text-xs font-mono font-bold tracking-wider uppercase border rounded-sm ${
                    status === 'CONNECTED'
                      ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30 shadow-[0_0_8px_rgba(0,230,118,0.15)]'
                      : status === 'RECONNECTING'
                      ? 'bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/30 animate-pulse'
                      : 'bg-[#181c24] text-[#606c80] border-[#262c38]'
                  }`}
                  title={
                    status === 'CONNECTED'
                      ? 'Realtime Telemetry Active'
                      : status === 'RECONNECTING'
                      ? 'Reconnecting to dispatch broker...'
                      : 'Telemetry link offline'
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'CONNECTED'
                        ? 'bg-[#00e676] shadow-[0_0_6px_#00e676]'
                        : status === 'RECONNECTING'
                        ? 'bg-[#ff6b00]'
                        : 'bg-[#606c80]'
                    }`}
                  />
                  <span>
                    {status === 'CONNECTED' ? 'SYS // LINKED' : status === 'RECONNECTING' ? 'RE-SYNCING' : 'OFFLINE'}
                  </span>
                </div>

                <NotificationBell />

                {/* Operator Identity Capsule */}
                <div className="hidden md:flex flex-col items-end text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      {user.fullName}
                    </span>
                    <Badge variant={clearanceData.badgeVariant} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                  {user.primaryBranchName && (
                    <span className="text-[10px] text-[#9da8b9] flex items-center gap-1 mt-0.5 font-mono">
                      <IconMapPin size={10} className="text-[#00f0ff]" />
                      <span>{user.primaryBranchName}</span>
                    </span>
                  )}
                </div>

                {/* Chunky Tactical Logout Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  title="Sever Terminal Session"
                  className="gap-2 text-xs"
                >
                  <IconLogOut size={14} className="text-[#9da8b9]" />
                  <span className="hidden sm:inline">[ LOGOUT ]</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="md">
                  AUTHENTICATE // SIGN IN
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Password Reset Alert Ribbon */}
        {isAuthenticated && user?.mustChangePassword && (
          <div className="bg-[#ff6b00]/15 border-t border-b border-[#ff6b00]/40 px-4 py-2 text-center text-xs font-mono text-[#ff8800] flex items-center justify-center gap-2">
            <IconAlertTriangle size={15} className="text-[#ff6b00] flex-shrink-0" />
            <span>
              <strong>[SECURITY PROTOCOL]:</strong> Temporary password in effect. Update password to confirm clearance.
            </span>
            <Link
              to="/profile"
              className="text-[#00f0ff] font-bold underline underline-offset-2 hover:text-[#38f3ff] ml-1"
            >
              [ UPDATE CREDENTIALS → ]
            </Link>
          </div>
        )}
      </header>

      {/* Main Tactical Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {children}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#1e222b] bg-[#0c0d12] py-4 text-center text-[11px] text-[#606c80] font-mono flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-2 text-[#9da8b9]">
          <span className="w-1.5 h-1.5 bg-[#00f0ff]" />
          <span>SHIFTOPS TACTICAL DISPATCH SYSTEM</span>
          <span>© 2026</span>
        </div>
        <div className="flex items-center gap-4 text-[#606c80]">
          <span>SECTOR_CLEARANCE: VERIFIED</span>
          <span>PROTOCOL: HTTPS/WSS ENCRYPTED</span>
        </div>
      </footer>
    </div>
  );
};
