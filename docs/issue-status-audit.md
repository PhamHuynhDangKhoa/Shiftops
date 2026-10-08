# ShiftOps — Issue Management Status & Reconciliation Audit

## Executive Summary
This document provides an authoritative audit and reconciliation of the Issue Management domain in the ShiftOps codebase as of October 2026. 

Prior to Phase 5.5, commit `33b59d2` (`feat(issue): implement operational issue management and resolution (Phase 6)`) had already been implemented and committed on the `master` branch. This audit inspects the actual codebase, database migrations, backend services, frontend user interface, and test coverage to determine the exact state of Issue Management against the intended Phase 6 domain requirements.

---

## 1. Current Issue Implementation Status
- **Repository Truth:** Issue Management is **already implemented and mature**.
- **Flyway Migrations:** `V6__create_issues.sql` is present and active.
- **Backend Scope:** Fully integrated into Spring Boot with entities, repositories, service layer, REST controller, DTO records, and security authorization.
- **Frontend Scope:** Dedicated `IssuesPage.tsx` exists and is wired into the application router (`/issues`).
- **Test Coverage:** 23 tests (11 unit tests, 12 full Spring Boot integration tests) exist and pass with 100% success.

---

## 2. Existing Issue Entities & Enums
All entity classes are located in `backend/src/main/java/com/shiftops/issue/entity/`:

| Entity / Enum | Type | Description / Key Fields |
|---|---|---|
| `Issue` | JPA Entity (`BaseEntity`) | Core operational issue. Fields: `id`, `branch`, `reportedBy`, `shiftAssignment` (nullable), `task` (nullable), `title`, `description`, `category`, `priority`, `status`, `assignedTo`, `resolvedAt`, `resolvedBy`, `closedAt`, `closedBy`, `comments` (OneToMany), `attachments` (OneToMany), `version` (optimistic locking), `createdAt`, `updatedAt`. |
| `IssueComment` | JPA Entity (`BaseEntity`) | Immutable discussion and audit comment on an issue timeline. Fields: `id`, `issue`, `author`, `message`, `isInternal` (boolean), `version`, `createdAt`, `updatedAt`. |
| `IssueAttachment` | JPA Entity (`BaseEntity`) | File attachment metadata linked to an issue. Fields: `id`, `issue`, `uploadedBy`, `fileName`, `originalFileName`, `contentType`, `fileSize`, `storagePath`, `version`, `createdAt`, `updatedAt`. |
| `IssueCategory` | Enum | `EQUIPMENT`, `MAINTENANCE`, `INVENTORY`, `SAFETY`, `FACILITY`, `OTHER` |
| `IssuePriority` | Enum | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `IssueStatus` | Enum | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED` |

---

## 3. Existing Database Migrations
Defined in `backend/src/main/resources/db/migration/V6__create_issues.sql`:
1. **`issues` table**:
   - Primary key `UUID` default `gen_random_uuid()`.
   - `branch_id` foreign key referencing `branches(id)` with `ON DELETE CASCADE`.
   - `reported_by_id` foreign key referencing `users(id)`.
   - Optional foreign keys to `shift_assignments(id)` and `tasks(id)` with `ON DELETE SET NULL`.
   - `CHECK` constraints on `category`, `priority`, and `status`.
   - Performance indexes on `branch_id`, `status`, `priority`, `reported_by_id`, `assigned_to_id`, and `created_at`.
2. **`issue_comments` table**:
   - Foreign key to `issues(id)` (`ON DELETE CASCADE`) and `users(id)`.
   - `is_internal` boolean flag with default `FALSE`.
   - Index on `issue_id`.
3. **`issue_attachments` table**:
   - Foreign key to `issues(id)` (`ON DELETE CASCADE`) and `users(id)`.
   - Storage path, content type, file size metadata.
   - Index on `issue_id`.

---

## 4. Existing REST APIs
All endpoints are exposed under `/api/v1` via `IssueController.java`:

| HTTP Method | Path | Security / Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/issues` | Any Authenticated User | Staff report issues bound to own branch; Managers/Owners can specify branch. |
| `GET` | `/api/v1/issues/my` | Any Authenticated User | Retrieves issues reported by or assigned to the current user. |
| `GET` | `/api/v1/branches/{branchId}/issues` | `hasAnyRole('OWNER', 'MANAGER')` | Paginated listing with multi-field JPA Specification filters (`status`, `priority`, `category`, `assignedToId`). |
| `GET` | `/api/v1/branches/{branchId}/issues/summary` | `hasAnyRole('OWNER', 'MANAGER')` | Summary metrics (total count, status counts, urgent/high counts). |
| `GET` | `/api/v1/issues/{id}` | Role/Branch Scoped | Fetch issue details with comments and attachments. Staff can view if reporter or assignee; Managers within branch. |
| `PATCH` | `/api/v1/issues/{id}/assign` | `hasAnyRole('OWNER', 'MANAGER')` | Assign/unassign issue to a staff member in the same branch. Automatically generates timeline comment. |
| `PATCH` | `/api/v1/issues/{id}/status` | Role/Branch Scoped | Update issue lifecycle status. Enforces authoritative state machine transitions. |
| `POST` | `/api/v1/issues/{id}/comments` | Role/Branch Scoped | Add comment to issue timeline. Managers can post internal notes hidden from staff. |
| `POST` | `/api/v1/issues/{id}/attachments` | Role/Branch Scoped (Multipart) | Upload image (JPEG/PNG/WebP, max 5MB) stored via `StorageService`. |
| `GET` | `/api/v1/issues/{id}/attachments/{attId}/file` | Role/Branch Scoped | Stream binary image attachment. |

---

## 5. Existing Frontend Functionality
Located at `frontend/src/pages/IssuesPage.tsx` (1,785 lines):
- **Dashboard & Metrics:** Real-time summary metric cards displaying Total, Open, In Progress, Resolved, and Urgent counts.
- **Report Issue Modal:** Accessible dialog with category picker, priority radio group, title, description, and photo upload support.
- **Multi-Filter Toolbar:** Filter by branch, lifecycle status, category, priority, and text search.
- **Split-View / Drawer Detail UI:**
  - Left panel: Paginated table with status and priority badges.
  - Right drawer: Full issue view with reporter info, timestamps, staff assignment dropdown, lifecycle action buttons (`Start Progress`, `Resolve`, `Close`, `Cancel`, `Reopen`), timeline audit stream, comment input with "Internal Note" toggle for managers, and thumbnail photo gallery with full-resolution modal preview.

---

## 6. Existing Tests
A total of **23 tests** exist for Issue Management:

1. **Unit Tests (`IssueServiceTest.java`) — 11 tests:**
   - `createIssue_Success_WhenStaffReports`
   - `createIssue_ThrowsAccessDenied_WhenStaffReportsForDifferentBranch`
   - `createIssue_ThrowsBusinessRule_WhenBranchInactive`
   - `getIssueById_Success_ForReporter`
   - `getIssueById_ThrowsAccessDenied_ForUnrelatedStaff`
   - `assignIssue_Success_WhenManagerAssignsBranchStaff`
   - `assignIssue_ThrowsBusinessRule_WhenTargetStaffFromDifferentBranch`
   - `updateIssueStatus_Success_OpenToInProgress`
   - `updateIssueStatus_ThrowsBusinessRule_OnInvalidTransition`
   - `addComment_Success_WithAuditTrail`
   - `addAttachment_ThrowsBusinessRule_WhenFileTooLarge`

2. **Spring Boot MockMvc Integration Tests (`Phase6IntegrationTest.java`) — 12 tests:**
   - `testStaffCreatesIssue_Success_ReporterBoundToAuthUser`
   - `testStaffCreatesIssue_CrossBranch_Rejected`
   - `testManagerBranchAuthorization`
   - `testOwnerCrossBranchAccess`
   - `testAssignIssueToStaff_Success`
   - `testAssignIssueToCrossBranchStaff_Rejected`
   - `testIssueStatusWorkflow_FullLifecycle`
   - `testInvalidStatusTransition_Rejected`
   - `testAddComment_Success`
   - `testInternalComment_Visibility`
   - `testAddAttachment_Success`
   - `testBranchIssueSummaryMetrics`

---

## 7. Gap Analysis: Existing Implementation vs. Intended Phase 6 Design
Comparison against intended ShiftOps Phase 6 specifications:

| Requirement | Intended Phase 6 Design | Current Implementation | Verdict |
|---|---|---|---|
| Domain Model | `Issue` with branch, reporter, optional shift/task, title, description, category, priority, status, assignee, timestamps, version | Fully implemented in `Issue.java` | **Match (100%)** |
| Lifecycle | `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED` | Fully enforced in `IssueService.java:315-327` | **Match (100%)** |
| State Machine Invariants | Terminal closed/cancelled, staff can only resolve assigned, managers can close/reopen | Implemented with strict checks | **Match (100%)** |
| Cross-branch Isolation | Staff restricted to own branch; Managers to managed branch; Owners global | Fully enforced via `BranchAccessService` | **Match (100%)** |
| Attachment Storage | Pluggable `StorageService` for photos (5MB max, JPEG/PNG/WebP) | Fully implemented via `StorageService` | **Match (100%)** |
| Timeline & Discussion | Immutable comments with internal note support | Fully implemented via `IssueComment` | **Match (100%)** |
| Optimistic Locking | `@Version` prevents lost updates during concurrent edits | Implemented on `Issue`, `IssueComment`, `IssueAttachment` | **Match (100%)** |
| Notifications / Events | Real-time push / notification events | Deferred to Phase 8 per roadmap | **Design Match** |

**Conclusion:** The existing Issue implementation matches 100% of the Phase 6 domain requirements.

---

## 8. Recommended Next Action
1. **Accept Phase 6 as COMPLETE:** No deletion, rewriting, or reimplementation is needed.
2. **Do Not Introduce Regressions:** Maintain the current Issue codebase and test suite intact.
3. **Roadmap Continuation:** Proceed to the next unstarted milestone: **Phase 7 — Shift Handover**.
