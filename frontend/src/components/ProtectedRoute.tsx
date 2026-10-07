import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading ShiftOps session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page with role {user.role}.</p>
      </div>
    );
  }

  return <>{children}</>;
};
