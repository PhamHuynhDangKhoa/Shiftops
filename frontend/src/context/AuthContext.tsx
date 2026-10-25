import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { isValidCompactJwt, isDemoToken } from '../lib/api';
import { User, AuthResponse, ApiResponse } from '../lib/types';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('accessToken');
    if (stored && (!isValidCompactJwt(stored) || isDemoToken(stored))) {
      localStorage.removeItem('accessToken');
      return null;
    }
    return stored;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const createFallbackUser = (emailHint?: string, roleHint?: string): User => {
    const e = emailHint || 'manager@shiftops.com';
    const role = (roleHint as any) || (e.includes('owner') ? 'OWNER' : e.includes('staff') ? 'STAFF' : 'MANAGER');
    return {
      id: 'demo-operator-1',
      email: e,
      fullName: role === 'OWNER' ? 'Elena Rostova' : role === 'STAFF' ? 'Jordan Kim' : 'Marcus Tanaka',
      role,
      primaryBranchId: 'b1',
      primaryBranchName: 'Shibuya Flagship',
      active: true,
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const fetchCurrentUser = async () => {
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
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (token && isValidCompactJwt(token) && !isDemoToken(token)) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

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
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Authentication failed. Please verify credentials.';
      throw new Error(serverMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
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
