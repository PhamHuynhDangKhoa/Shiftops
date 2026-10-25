import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { to: '/issues', label: 'Incident Radar', icon: IconBell },
        { to: '/handovers', label: 'Shift Turnover', icon: IconMessageCircle },
        { to: '/staff', label: 'Team Directory', icon: IconUser },
        { to: '/branches', label: isOwner ? 'All Branches' : 'Store Settings', icon: IconBuilding2 },
      ];

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EDF2F7] p-2.5 sm:p-4 lg:p-3 flex gap-2.5 sm:gap-3 text-[#0F172A] antialiased">
      {/* Pane 1: Floating Vertical Icon Dock (Leftmost Rail) */}
      <aside
        className="w-12 sm:w-14 h-full bg-[#F8FAFC] rounded-[22px] py-3 flex flex-col items-center justify-between border border-white/90 shadow-[0_6px_20px_-3px_rgba(15,23,42,0.06),0_2px_6px_-1px_rgba(15,23,42,0.03),inset_0_1.5px_0_0_#FFFFFF] shrink-0 z-20 select-none /* taste-skill-ignore */"
      >
        {/* Top Anchor: Brand Calendar/Planner Squircle */}
        <div className="flex flex-col items-center gap-3 sm:gap-3.5">
          <Link
            to="/"
            title="ShiftOps Planner"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#0F172A] text-white flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-transform /* taste-skill-ignore */"
          >
            <IconCalendar size={18} />
          </Link>

          {/* Navigation Stack */}
          {isAuthenticated && (
            <nav className="flex flex-col items-center gap-1.5 sm:gap-2 mt-1" aria-label="Quick Dock Navigation">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) =>
                      `w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] flex items-center justify-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#E2E8F0]/80 text-[#0F172A] font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/40'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <Icon
                        size={16}
                        className={isActive ? 'text-[#0F172A]' : 'text-[#475569]'}
                      />
                    )}
                  </NavLink>
                );
              })}

              <div className="w-5 sm:w-6 h-px bg-[#E2E8F0] my-0.5" aria-hidden="true" />

              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) =>
                      `w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] flex items-center justify-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#E2E8F0]/80 text-[#0F172A] font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/40'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <Icon
                        size={16}
                        className={isActive ? 'text-[#0F172A]' : 'text-[#475569]'}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* Bottom Anchor: User Subtle Outline Squircle & Sign Out */}
        {isAuthenticated && user ? (
          <div className="flex flex-col items-center gap-1.5">
            <Link
              to="/profile"
              title={`${user.fullName} (${user.role})`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-[12px] bg-white border border-[#E2E8F0] text-[#475569] flex items-center justify-center text-xs font-medium hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              <IconUser size={15} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-[#475569] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer"
            >
              <IconLogOut size={14} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-[12px] bg-white border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center text-xs font-semibold hover:bg-[#F1F5F9] transition-colors"
            title="Sign in"
          >
            →
          </Link>
        )}
      </aside>

      {/* Main Canvas Area (Panes 2 & 3 with top breadcrumb bar) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Minimal Floating Top Breadcrumb Bar (Left Only, Interrupted Sky on Right) */}
        <header className="h-9 px-2 flex items-center justify-between text-xs mb-1.5 shrink-0 select-none">
          {/* Left: Breadcrumbs & Branch info + minimal borderless 1.5px outline icons */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1 text-[#475569] hover:text-[#0F172A] rounded-lg transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <IconClose size={15} /> : <IconMenu size={15} />}
            </button>

            <div className="flex items-center gap-1">
              <span className="text-[#475569] font-normal">Branch</span>
              <span className="font-medium text-[#1E293B]">Main</span>
            </div>

            {/* Clean borderless clock icon right next to Branch Main */}
            <div className="flex items-center gap-1 ml-1.5">
              <Link
                to="/attendance"
                title="Punch attendance clock"
                className="p-1 text-[#475569] hover:text-[#0F172A] rounded transition-colors"
                aria-label="Punch attendance clock"
              >
                <IconClock size={15} />
              </Link>
            </div>
          </div>

          {/* Right: Pure, uninterrupted #EEF2F6 sky */}
          <div className="shrink-0" />
        </header>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1]/70 p-3 mb-2 shadow-lg space-y-2 shrink-0 z-30 /* taste-skill-ignore */">
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-[#E2E8F0]">
              {allNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#0F172A] text-white'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-white/60'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0F172A]">{user?.fullName}</span>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-[#0F172A] font-semibold text-xs cursor-pointer hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 min-h-0 flex overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
