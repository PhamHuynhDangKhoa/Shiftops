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

export type IssueCategory = 'EQUIPMENT' | 'MAINTENANCE' | 'INVENTORY' | 'SAFETY' | 'FACILITY' | 'OTHER';
export type IssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type IssueStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  systemGenerated: boolean;
  createdAt: string;
}

export interface IssueAttachment {
  id: string;
  issueId: string;
  uploaderId: string;
  uploaderName: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  downloadUrl: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  branchId: string;
  branchName: string;
  reportedById: string;
  reportedByName: string;
  reportedByRole: Role;
  shiftAssignmentId?: string;
  taskId?: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedToId?: string;
  assignedToName?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  closedById?: string;
  closedByName?: string;
  closedAt?: string;
  comments: IssueComment[];
  attachments: IssueAttachment[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueSummary {
  id: string;
  branchId: string;
  branchName: string;
  title: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  reportedByName: string;
  assignedToName?: string;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export type HandoverStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
export type HandoverItemType = 'COMPLETED' | 'PENDING' | 'ISSUE' | 'NOTE';

export interface HandoverDerivedSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  openBranchIssues: number;
  staffAssignedCount: number;
}

export interface HandoverItem {
  id: string;
  handoverId?: string;
  type: HandoverItemType;
  content: string;
  issueId?: string;
  issueTitle?: string;
  issueStatus?: IssueStatus;
  orderIndex: number;
  createdAt: string;
}

export interface ShiftHandover {
  id: string;
  shiftId: string;
  shiftName?: string;
  shiftStartTime: string;
  shiftEndTime: string;
  branchId: string;
  branchName: string;
  status: HandoverStatus;
  notes?: string;
  submittedById?: string;
  submittedByName?: string;
  submittedAt?: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  acknowledgementNotes?: string;
  items: HandoverItem[];
  summary: HandoverDerivedSummary;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHandoverRequest {
  notes?: string;
  items?: {
    type: HandoverItemType;
    content: string;
    issueId?: string;
    orderIndex: number;
  }[];
}

export interface UpdateHandoverRequest {
  notes?: string;
  items?: {
    type: HandoverItemType;
    content: string;
    issueId?: string;
    orderIndex: number;
  }[];
}

export interface AcknowledgeHandoverRequest {
  notes?: string;
}

export type NotificationType =
  | 'SHIFT_PUBLISHED'
  | 'SHIFT_CHANGED'
  | 'TASK_ASSIGNED'
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_UPDATED'
  | 'HANDOVER_SUBMITTED'
  | 'HANDOVER_ACKNOWLEDGED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'SHIFT_REMINDER';

export type ReferenceType = 'SHIFT' | 'TASK' | 'ISSUE' | 'HANDOVER' | 'ANNOUNCEMENT';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  readAt?: string;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export type AnnouncementTargetType = 'BRANCH' | 'SHIFT' | 'ORGANIZATION';

export interface Announcement {
  id: string;
  branchId?: string;
  branchName?: string;
  createdById: string;
  createdByName: string;
  title: string;
  content: string;
  targetType: AnnouncementTargetType;
  targetShiftId?: string;
  targetShiftName?: string;
  publishedAt?: string;
  published: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  targetType?: AnnouncementTargetType;
  targetShiftId?: string;
  expiresAt?: string;
  publishImmediately?: boolean;
}
