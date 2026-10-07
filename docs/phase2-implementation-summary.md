# Phase 2: Branch & Staff Management — Implementation & Verification Summary

## 1. Overview
Phase 2 implements the core branch and staff operational workflows for ShiftOps:
- Branch lifecycle management (creation, listing, editing, activation/deactivation, summary metrics).
- Staff directory with pagination, search, role filtering, branch filtering, and active status filtering.
- Staff invitation / creation with auto-generated secure temporary passwords.
- Role-based authorization and strict branch boundaries:
  - `OWNER`: global visibility and modification rights across all branches; branch transfers.
  - `MANAGER`: strictly scoped to their assigned branch; can only manage `STAFF` within that branch.
  - `STAFF`: self-service profile updates and password changes; restricted from listing other users.
- Admin / Manager-initiated password reset per approved Decision Q1 (generates temporary password with `mustChangePassword = true`).
- User self-service: update own profile (`PUT /v1/auth/profile`) and change password (`POST /v1/auth/change-password` clearing `mustChangePassword`).
- Full React + TypeScript UI for authentication, dashboard, branch management, staff directory, and profile settings.

---

## 2. Implemented REST Endpoints

### 2.1 Branch Management (`/api/v1/branches`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/v1/branches` | `OWNER` | Create branch |
| `GET` | `/v1/branches` | `ALL (Scoped)` | List accessible branches (Owner: all; Manager/Staff: assigned branch) |
| `GET` | `/v1/branches/{id}` | `OWNER`, `MANAGER/STAFF (own)` | Get branch details |
| `PUT` | `/v1/branches/{id}` | `OWNER` | Update branch name, address, timezone |
| `PATCH` | `/v1/branches/{id}/status` | `OWNER` | Toggle active/inactive status |
| `GET` | `/v1/branches/{id}/summary` | `OWNER`, `MANAGER (own)` | Branch summary metrics (total staff, active staff, manager count) |

### 2.2 Staff Management (`/api/v1/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/v1/users` | `OWNER`, `MANAGER (own)` | List staff with pagination & filters (`branchId`, `role`, `active`, `search`) |
| `POST` | `/v1/users` | `OWNER`, `MANAGER (own STAFF)` | Invite/create staff (supports custom or auto-generated temp password) |
| `GET` | `/v1/users/{id}` | `OWNER`, `MANAGER (own)`, `STAFF (self)` | Get user details |
| `PUT` | `/v1/users/{id}` | `OWNER`, `MANAGER (own STAFF)` | Update user name, phone, role/branch (Owner only for role/branch) |
| `PATCH` | `/v1/users/{id}/status` | `OWNER`, `MANAGER (own STAFF)` | Activate/deactivate user (cannot deactivate self) |
| `POST` | `/v1/users/{id}/transfer-branch` | `OWNER` | Transfer staff to another active branch |
| `POST` | `/v1/users/{id}/reset-password` | `OWNER`, `MANAGER (own STAFF)` | Reset password, generating temporary password & setting `mustChangePassword=true` |

### 2.3 Authentication & Self-Service (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/v1/auth/login` | Public | Authenticate user → JWT token |
| `GET` | `/v1/auth/me` | Authenticated | Retrieve current user profile & branch info |
| `PUT` | `/v1/auth/profile` | Authenticated | Update own full name & phone |
| `POST` | `/v1/auth/change-password` | Authenticated | Change password with current password verification (clears `mustChangePassword`) |

---

## 3. Frontend Architecture & Pages
- **Auth Provider & Interceptor:**
  - `frontend/src/context/AuthContext.tsx`: Manages token in `localStorage`, user state, login, logout, and refresh.
  - `frontend/src/lib/api.ts`: Axios interceptor injecting `Bearer` token on all authenticated requests.
- **Role Guards & Layout:**
  - `frontend/src/components/ProtectedRoute.tsx`: Guards routes and restricts by role.
  - `frontend/src/components/Layout.tsx`: Responsive navigation header, color-coded role chips, sticky temporary password alert banner when `user.mustChangePassword === true`.
- **Pages:**
  - `LoginPage.tsx`: Form with validation and one-click quick-login demo buttons for Owner, Manager, and Staff.
  - `DashboardPage.tsx`: Operational welcome dashboard with live system health, branch counts, and quick actions.
  - `BranchesPage.tsx`: Branch management card grid with summary metrics, Create Branch modal, Edit modal, and Active toggle.
  - `StaffPage.tsx`: Staff directory with keyword search, branch filter, role filter, active status filter, pagination, invite modal, edit modal, branch transfer modal, and temporary password display modal with one-click copy.
  - `ProfilePage.tsx`: Account overview, personal details form, and change password form.

---

## 4. Verification Results
1. **Unit Tests:**
   - [`UserServiceTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/user/service/UserServiceTest.java): 16 tests covering invitation, temporary password generation, filtering/pagination, role restrictions, password reset, self-deactivation guards, branch transfers, profile updates.
   - [`BranchServiceTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/branch/service/BranchServiceTest.java): 5 tests covering branch creation, duplicate name conflicts, status toggle, summary calculations.
   - [`AuthServiceTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/auth/service/AuthServiceTest.java): 5 tests covering login, deactivated accounts, getMe.
   - [`BranchAccessServiceTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/user/service/BranchAccessServiceTest.java): 6 tests covering branch authorization rules.
   - [`JwtTokenProviderTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/common/security/JwtTokenProviderTest.java): 5 tests covering token generation and validation.
2. **Integration Tests:**
   - [`Phase1IntegrationTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase1IntegrationTest.java): 12 tests verifying Phase 1 requirements.
   - [`Phase2IntegrationTest.java`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase2IntegrationTest.java): 13 tests verifying Phase 2 endpoints, role and branch boundaries, HTTP status codes (200, 201, 401, 403, 422).
   - **Total Backend Tests: 62 passed, 0 failed.**
3. **Frontend Build:**
   - `npm run build`: TypeScript compile and Vite build passed with 0 errors.
4. **Live End-to-End Verification (`test_phase2_live.ps1`):**
   - Verified against Docker PostgreSQL (port 5433) and running Spring Boot backend:
     - Health endpoint returns `UP` (200).
     - Owner logs in, creates branch, deactivates and reactivates branch.
     - Manager logs in, retrieves own branch summary, lists staff in own branch.
     - Manager invites new staff with auto-generated temporary password.
     - Staff logs in with temporary password (`mustChangePassword: true`).
     - Staff updates own profile and changes temporary password to permanent password (`mustChangePassword: false`).
     - Staff logs in with new permanent password.
     - Manager resets staff password.
     - Owner transfers staff to new branch.
     - Staff denied access to list users (403 Forbidden).
     - Unauthenticated request rejected (401 Unauthorized).
     - Manager denied access to toggle branch status (403 Forbidden).
