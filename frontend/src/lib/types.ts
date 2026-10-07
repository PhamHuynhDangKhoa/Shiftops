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

export type ShiftStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';

export interface ShiftAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: Role;
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
}

export interface Shift {
  id: string;
  branchId: string;
  branchName: string;
  name?: string;
  startTime: string;
  endTime: string;
  overnight: boolean;
  status: ShiftStatus;
  notes?: string;
  assignments: ShiftAssignment[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'COMPLETED' | 'ABSENT';

export interface Attendance {
  id: string;
  shiftAssignmentId: string;
  shiftId: string;
  shiftName?: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  userEmail: string;
  shiftStartTime: string;
  shiftEndTime: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  late: boolean;
  overnight: boolean;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TaskTemplateItem {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplate {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  description?: string;
  active: boolean;
  items: TaskTemplateItem[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  shiftAssignmentId: string;
  shiftId: string;
  shiftName?: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  userEmail: string;
  templateItemId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueTime?: string;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
