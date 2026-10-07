# ShiftOps — Phase 1: Authentication & Core Entities Design Specification

## 1. Domain Model & Entity Relationship Explanation

### Core Entities
1. **Branch**
   - Represents a physical operational site/store.
   - Fields: `id`, `name`, `address`, `timezone`, `isActive`, `createdAt`, `updatedAt`, `version`.
   - Inherits `BaseEntity` (UUID PK, JPA Auditing, Optimistic Locking via `@Version`).

2. **Role (Enum)**
   - `OWNER`: Business owner. Has cross-branch global administrative visibility and permissions.
   - `MANAGER`: Branch-level administrator. Restricted to their assigned branch.
   - `STAFF`: Front-line employee. Restricted to their assigned branch and personal data.

3. **User**
   - Represents an employee/identity account.
   - Fields: `id`, `email`, `passwordHash`, `fullName`, `phone`, `role`, `primaryBranchId` (FK to `Branch`), `isActive`, `mustChangePassword`, `createdAt`, `updatedAt`, `version`.
   - Inherits `BaseEntity`.

### Relationships & Extensibility
- **Branch (1) <--- (0..N) User**:
  - `User` has `primary_branch_id` referencing `branches(id)`.
  - For `OWNER`: `primary_branch_id` is nullable (representing organization-wide scope).
  - For `MANAGER` and `STAFF`: `primary_branch_id` is mandatory (enforced via DB CHECK constraint and application validation).
- **Multi-Branch Extensibility**:
  - To support multi-branch staff membership later, a `branch_memberships` join table (`id`, `user_id`, `branch_id`, `role`, `is_primary`) can be introduced seamlessly.
  - The `primary_branch_id` on `User` remains the default/home branch.
  - All branch authorization logic is centralized in `BranchAccessService` (`hasBranchAccess(User, UUID)`), ensuring that extending the model to multi-branch membership requires zero changes to controller endpoints or security annotations.

---

## 2. Authorization Matrix

| Resource / Action | OWNER | MANAGER | STAFF | Unauthenticated |
|---|---|---|---|---|
| `POST /api/v1/auth/login` | Allowed | Allowed | Allowed | Allowed |
| `GET /api/v1/auth/me` | Read own info | Read own info | Read own info | 401 Unauthorized |
| `POST /api/v1/branches` | Create any branch | 403 Forbidden | 403 Forbidden | 401 Unauthorized |
| `GET /api/v1/branches` | List all branches | List assigned branch only | List assigned branch only | 401 Unauthorized |
| `GET /api/v1/branches/{id}` | Read any branch | Read assigned branch only (403 for other) | Read assigned branch only (403 for other) | 401 Unauthorized |
| `PUT /api/v1/branches/{id}` | Update any branch | 403 Forbidden | 403 Forbidden | 401 Unauthorized |
| `GET /api/v1/users` | List all users across branches | List users in assigned branch | 403 Forbidden | 401 Unauthorized |
| `GET /api/v1/users/{id}` | Read any user | Read user in assigned branch | Read own profile only (403 for other) | 401 Unauthorized |
| `POST /api/v1/users` | Create user (any role, any branch) | Create STAFF in assigned branch | 403 Forbidden | 401 Unauthorized |
| `PATCH /api/v1/users/{id}/status` | Activate/deactivate any user | Deactivate STAFF in assigned branch | 403 Forbidden | 401 Unauthorized |

---

## 3. Authentication Flow

1. **Stateless JWT Architecture**:
   - No HTTP session state stored on the server (`SessionCreationPolicy.STATELESS`).
2. **Login**:
   - `POST /api/v1/auth/login` receives email and password.
   - Email is normalized (trimmed, lowercased).
   - User is verified (active, correct BCrypt password hash).
   - If user does not exist, is inactive, or password does not match, return `401 Unauthorized` with generic message.
3. **Token Issuance**:
   - Access token signed using HMAC-SHA256 with configured secret.
   - Payload claims:
     - `sub`: User UUID
     - `email`: User email
     - `role`: Role enum string (`OWNER`, `MANAGER`, `STAFF`)
     - `branchId`: Primary branch UUID (or null for global OWNER)
     - `iat` (issued at), `exp` (expires in 24 hours).
4. **Token Verification**:
   - `JwtAuthenticationFilter` intercepts incoming HTTP requests.
   - Extracts `Bearer <token>` from `Authorization` header.
   - Validates cryptographic signature and expiration.
   - Populates `SecurityContextHolder` with `UserPrincipal` and granted authorities (`ROLE_OWNER`, `ROLE_MANAGER`, `ROLE_STAFF`).
5. **Security Failures**:
   - Missing or invalid token -> `401 Unauthorized` via `JwtAuthenticationEntryPoint`.
   - Insufficient role or branch access -> `403 Forbidden` via `AccessDeniedHandler`.

---

## 4. Database Constraints & Indexes

### Table: `branches`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` VARCHAR(100) NOT NULL
- `address` VARCHAR(255)
- `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC'
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `version` BIGINT NOT NULL DEFAULT 0
- **Constraints**:
  - `uk_branches_name`: `UNIQUE (name)`
- **Indexes**:
  - `idx_branches_active`: `(is_active)`

### Table: `users`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `email` VARCHAR(255) NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- `full_name` VARCHAR(100) NOT NULL
- `phone` VARCHAR(20)
- `role` VARCHAR(20) NOT NULL
- `primary_branch_id` UUID REFERENCES branches(id) ON DELETE RESTRICT
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `must_change_password` BOOLEAN NOT NULL DEFAULT FALSE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
- `version` BIGINT NOT NULL DEFAULT 0
- **Constraints**:
  - `uk_users_email`: `UNIQUE (email)`
  - `chk_users_role`: `CHECK (role IN ('OWNER', 'MANAGER', 'STAFF'))`
  - `chk_users_branch_by_role`: `CHECK (role = 'OWNER' OR primary_branch_id IS NOT NULL)`
- **Indexes**:
  - `idx_users_email`: `(email)`
  - `idx_users_branch`: `(primary_branch_id)`
  - `idx_users_role`: `(role)`
  - `idx_users_active`: `(is_active)`

---

## 5. Security-Sensitive Fields
- `password_hash`: **Strictly protected**.
  - Never serialized in any response DTO (`UserResponse`, `AuthResponse`).
  - Marked with `@JsonIgnore` on the entity for defense-in-depth.
  - Entities are never exposed directly by controllers.

---

## 6. API List

- `POST /api/v1/auth/login`: Public login endpoint returning JWT and user details.
- `GET /api/v1/auth/me`: Authenticated endpoint returning current user profile.
- `POST /api/v1/branches`: Create new branch (OWNER only).
- `GET /api/v1/branches`: List accessible branches.
- `GET /api/v1/branches/{id}`: Get branch by ID.
- `PUT /api/v1/branches/{id}`: Update branch details (OWNER only).
- `POST /api/v1/users`: Create a new user (OWNER or MANAGER creating STAFF in own branch).
- `GET /api/v1/users`: List users (OWNER or MANAGER in own branch).
- `GET /api/v1/users/{id}`: Get user by ID.
- `PATCH /api/v1/users/{id}/status`: Activate or deactivate user.

---

## 7. Package Structure

```
com.shiftops
├── ShiftOpsApplication.java
├── common/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── WebConfig.java
│   │   └── AuditConfig.java
│   ├── dto/
│   │   ├── ApiResponse.java
│   │   └── PagedResponse.java
│   ├── entity/
│   │   └── BaseEntity.java
│   ├── exception/
│   │   ├── AccessDeniedException.java
│   │   ├── BusinessRuleException.java
│   │   ├── ConflictException.java
│   │   ├── GlobalExceptionHandler.java
│   │   └── ResourceNotFoundException.java
│   └── security/
│       ├── CustomUserDetailsService.java
│       ├── JwtAccessDeniedHandler.java
│       ├── JwtAuthenticationEntryPoint.java
│       ├── JwtAuthenticationFilter.java
│       ├── JwtTokenProvider.java
│       ├── SecurityUtils.java
│       └── UserPrincipal.java
├── auth/
│   ├── controller/AuthController.java
│   ├── dto/
│   │   ├── AuthResponse.java
│   │   └── LoginRequest.java
│   └── service/AuthService.java
├── branch/
│   ├── controller/BranchController.java
│   ├── dto/
│   │   ├── BranchResponse.java
│   │   ├── CreateBranchRequest.java
│   │   └── UpdateBranchRequest.java
│   ├── entity/Branch.java
│   ├── repository/BranchRepository.java
│   └── service/BranchService.java
└── user/
    ├── controller/UserController.java
    ├── dto/
    │   ├── CreateUserRequest.java
    │   ├── UpdateUserStatusRequest.java
    │   └── UserResponse.java
    ├── entity/
    │   ├── Role.java
    │   └── User.java
    ├── repository/UserRepository.java
    └── service/
        ├── BranchAccessService.java
        └── UserService.java
```
