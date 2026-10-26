import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AxiosError } from 'axios';
import api, { isValidCompactJwt, isDemoToken } from '../lib/api';
import { User, AuthResponse, ApiResponse, Role } from '../lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createFallbackUser = (emailHint?: string, roleHint?: string): User => {
  const e = emailHint || 'manager@shiftops.com';
  let role: Role = 'MANAGER';
  if (roleHint === 'OWNER' || roleHint === 'STAFF' || roleHint === 'MANAGER') {
    role = roleHint;
  } else if (e.includes('owner')) {
    role = 'OWNER';
  } else if (e.includes('staff')) {
    role = 'STAFF';
  }

  return {
    id: role === 'OWNER' ? 'u-owner-1' : role === 'STAFF' ? 'u-staff-1' : 'u-manager-1',
    email: e,
    fullName: role === 'OWNER' ? 'Elena Rostova' : role === 'STAFF' ? 'Jordan Kim' : 'Marcus Tanaka',
    role,
    primaryBranchId: role === 'OWNER' ? 'b1' : 'b1',
    primaryBranchName: 'Shibuya Flagship',
    active: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isDemoMode = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const demoVal = params.get('demo');
      return demoVal === 'true' || demoVal === 'manager' || demoVal === 'staff' || demoVal === 'owner';
    } catch {
      return false;
    }
  })();

  const demoRoleHint = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const demoVal = params.get('demo');
      if (demoVal === 'staff') return 'STAFF';
      if (demoVal === 'owner') return 'OWNER';
      return 'MANAGER';
    } catch {
      return 'MANAGER';
    }
  })();

  const [user, setUser] = useState<User | null>(() => {
    if (isDemoMode) {
      return createFallbackUser(demoRoleHint === 'STAFF' ? 'staff@shiftops.com' : demoRoleHint === 'OWNER' ? 'owner@shiftops.com' : 'manager@shiftops.com', demoRoleHint);
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (isDemoMode) {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoibWFuYWdlckBzaGlmdG9wcy5jb20iLCJyb2xlIjoiTUFOQUdFUiJ9.c2ln';
    }
    const stored = localStorage.getItem('accessToken');
    if (stored && (!isValidCompactJwt(stored) || isDemoToken(stored))) {
      localStorage.removeItem('accessToken');
      return null;
    }
    return stored;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => !isDemoMode);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken || !isValidCompactJwt(currentToken) || isDemoToken(currentToken)) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get<ApiResponse<User>>('/auth/me');
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
      } else {
        logout();
      }
    } catch {
      // Decode existing JWT token payload or clean up
      if (currentToken && isValidCompactJwt(currentToken) && !isDemoToken(currentToken)) {
        try {
          const parts = currentToken.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            setUser(createFallbackUser(payload.email, payload.role));
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, logout]);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!isDemoMode) {
        logout();
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [isDemoMode, logout]);

  useEffect(() => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    if (token && isValidCompactJwt(token) && !isDemoToken(token)) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token, isDemoMode, fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
        email,
        password,
      });
      if (res.data.success && res.data.data) {
        const authData = res.data.data;
        if (isValidCompactJwt(authData.accessToken)) {
          localStorage.setItem('accessToken', authData.accessToken);
          setToken(authData.accessToken);
          setUser(authData.user);
        } else {
          throw new Error('Received an invalid JWT format from authentication server');
        }
      } else {
        throw new Error(res.data.error?.message || 'Login failed');
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string; error?: { message?: string } }>;
      const serverMessage =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
      throw new Error(serverMessage);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
