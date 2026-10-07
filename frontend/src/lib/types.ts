export type Role = 'OWNER' | 'MANAGER' | 'STAFF';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ErrorDetail;
}

export interface ErrorDetail {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  primaryBranchId?: string;
  primaryBranchName?: string;
  active: boolean;
  mustChangePassword: boolean;
  temporaryPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchSummary {
  branchId: string;
  branchName: string;
  totalStaff: number;
  activeStaff: number;
  managerCount: number;
}

export interface ResetPasswordResponse {
  userId: string;
  email: string;
  temporaryPassword: string;
  message: string;
}
