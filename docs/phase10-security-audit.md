# ShiftOps — Phase 10 Security Audit & Hardening Report

> **Document Version:** 1.0  
> **Date:** 2026-10-08  
> **Status:** APPROVED  
> **Classification:** Security Verification & Defensive Hardening

---

## 1. Scope & Objectives

This audit inspects the ShiftOps backend for vulnerabilities in authentication, role-based authorization (RBAC), multi-tenant branch isolation, insecure direct object reference (IDOR), cross-origin resource sharing (CORS), token handling, file upload security, and information leakage.

---

## 2. Security Boundary Review & Verification

### 2.1 JWT Configuration & Authentication
- **Algorithm:** HMAC-SHA256 (`Keys.hmacShaKeyFor`).
- **Secret Key Handling:** Configurable via `JWT_SECRET` environment variable with dynamic 256-bit byte padding if length < 32 bytes (`JwtTokenProvider.java`).
- **Token Validation:** Rejects expired, malformed, unsupported, or tampered tokens, logging warnings without leaking internal stack traces.
- **Stateless Sessions:** Stateless Spring Security session policy (`SessionCreationPolicy.STATELESS`) preventing session hijacking.
- **Account State Verification:** Inactive staff accounts (`isActive == false`) are immediately blocked by `JwtAuthenticationFilter` (`userDetails.isEnabled() == false`).

### 2.2 Role-Based Authorization & Branch Isolation
- **Role Hierarchy:**
  - `OWNER`: Global cross-branch authority; can create branches, assign roles, transfer staff, broadcast org-wide announcements.
  - `MANAGER`: Branch-scoped authority; can manage shifts, staff, tasks, issues, and handovers for their own primary branch only. Cross-branch access attempts are rejected with `403 Forbidden` (`BranchAccessService.java`).
  - `STAFF`: Self-service authority; can only clock in/out for assigned shifts, view assigned tasks, report issues, and submit assigned shift debriefs.
- **IDOR Protection:**
  - Staff members cannot access or modify tasks assigned to other staff (`TaskService.java:172`).
  - Staff members cannot acknowledge or close handovers (`ShiftHandoverService.java:264`).
  - Staff members cannot view notifications belonging to other users (`NotificationService.java:96`).
  - Managers cannot update staff or shifts belonging to other branches (`BranchAccessService.java`).

### 2.3 Cross-Origin Resource Sharing (CORS)
- **Hardened Configuration:** `SecurityConfig` defines explicit `CorsConfigurationSource` using `app.cors.allowed-origins` (defaults to `http://localhost:5173,http://localhost:3000`, configurable via `CORS_ALLOWED_ORIGINS`).
- **Credentials & Headers:** `allowCredentials(true)`, strict allowed methods (`GET, POST, PUT, PATCH, DELETE, OPTIONS`), exposed headers limited to `X-Request-Id` and `Content-Disposition`. Unsafe wildcard (`*`) origins with credentials are expressly prohibited.

### 2.4 File Upload & Storage Defense
- **Size Limit:** Max 5MB per attachment enforced in `IssueService.java` (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
- **MIME & Extension Whitelisting:**
  - Content types restricted to `image/jpeg`, `image/png`, `image/webp`.
  - Extension whitelist enforced in `LocalStorageService.java` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).
- **Path Traversal Protection:**
  - File paths normalized via `Path.normalize()`.
  - Storage roots strictly enforced with `destinationFile.startsWith(rootLocation)` check, aborting with `SECURITY_ERROR` if traversal is attempted.
  - Download endpoint sets `X-Content-Type-Options: nosniff` and sanitizes double quotes and CRLF characters in `Content-Disposition`.

### 2.5 Actuator & Operational Security
- **Endpoints Exposed:** Restricted to `/actuator/health`, `/actuator/info`, and `/actuator/metrics`.
- **Public Visibility:** Only `/actuator/health` and `/actuator/info` are public. Detailed system info is exposed only when authorized (`when_authorized`).
- **Secret Separation:** Production secrets configured strictly through environment variables (`SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, etc.).

---

## 3. Security Verification Checklist

| Security Control | Implementation Location | Verified Status |
|------------------|-------------------------|-----------------|
| Password Hashing | `BCryptPasswordEncoder` in `SecurityConfig.java` | ✅ Verified |
| JWT Validation | `JwtTokenProvider.java` / `JwtAuthenticationFilter.java` | ✅ Verified |
| Branch Access Check | `BranchAccessService.validateBranchAccess()` | ✅ Verified |
| Self-Deactivation Block | `UserService.updateUserStatus()` | ✅ Verified |
| Attachment Path Traversal Defense | `LocalStorageService.java` | ✅ Verified |
| MIME Confusion Defense | `X-Content-Type-Options: nosniff` in `IssueController.java` | ✅ Verified |
| Header Injection Defense | Regex sanitization in `Content-Disposition` | ✅ Verified |
| Request Correlation Tracing | `CorrelationIdFilter.java` (MDC `requestId`) | ✅ Verified |
| Actuator Endpoint Protection | `SecurityConfig.java` | ✅ Verified |
| CORS Origin Lockdown | `SecurityConfig.corsConfigurationSource()` | ✅ Verified |
