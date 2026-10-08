import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return { backgroundColor: '#7c3aed', color: '#fff' };
      case 'MANAGER':
        return { backgroundColor: '#2563eb', color: '#fff' };
      case 'STAFF':
        return { backgroundColor: '#059669', color: '#fff' };
      default:
        return { backgroundColor: '#6b7280', color: '#fff' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link
              to="/"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#111827',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ color: '#2563eb' }}>⚡</span> ShiftOps
            </Link>

            {isAuthenticated && (
              <nav style={{ display: 'flex', gap: '1rem' }}>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Dashboard
                </NavLink>

                {user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                  <NavLink
                    to="/branches"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  >
                    Branches
                  </NavLink>
                )}

                {user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                  <NavLink
                    to="/staff"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  >
                    Staff Management
                  </NavLink>
                )}

                <NavLink
                  to="/shifts"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Shifts
                </NavLink>

                <NavLink
                  to="/attendance"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Attendance
                </NavLink>

                <NavLink
                  to="/tasks"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Tasks
                </NavLink>

                <NavLink
                  to="/issues"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Issues
                </NavLink>

                <NavLink
                  to="/handovers"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Handover
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  My Profile
                </NavLink>
              </nav>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated && user ? (
              <>
                <NotificationBell />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{user.fullName}</span>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        ...getRoleBadgeStyle(user.role),
                      }}
                    >
                      {user.role}
                    </span>
                  </div>
                  {user.primaryBranchName && (
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      📍 {user.primaryBranchName}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.4rem 0.8rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => ((e.target as HTMLElement).style.backgroundColor = '#f3f4f6')}
                  onMouseOut={(e) => ((e.target as HTMLElement).style.backgroundColor = '#fff')}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {isAuthenticated && user?.mustChangePassword && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              borderTop: '1px solid #fef3c7',
              borderBottom: '1px solid #fde68a',
              padding: '0.6rem 1.5rem',
              textAlign: 'center',
              color: '#92400e',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️ Action Required: You are logged in with a temporary password.</span>
            <Link
              to="/profile"
              style={{
                color: '#b45309',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Update your password now
            </Link>
          </div>
        )}
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {children}
      </main>

      <footer
        style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fafafa',
          padding: '1.25rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}
      >
        ShiftOps © 2026 — Operations & Shift Management Platform
      </footer>
    </div>
  );
};
