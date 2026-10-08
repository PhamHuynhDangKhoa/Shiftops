# ShiftOps — Technology and Code-Style Audit

> **Target Codebase:** ShiftOps Monolith (Java 21 / Spring Boot 3.4.1 / PostgreSQL / React 18 + TypeScript)  
> **Date:** October 8, 2026  
> **Document Purpose:** Comprehensive technology stack, architectural boundaries, Lombok usage, DTO style, frontend styling, and testing database audit.  
> **Status:** Completed Assessment & Migration Roadmap

---

## Executive Summary

ShiftOps has reached functional maturity across core domains (Authentication, Branches, Staff, Shifts, Attendance, Tasks, and Issues). The modular monolithic architecture adheres to domain boundaries, authoritative UTC timekeeping, and role-based access control.

However, as the platform scales toward shift handovers, announcements, and production readiness, several code-style, maintainability, and testing infrastructure risks must be addressed:
1. **Lombok `@Data` over-reliance on DTOs:** 43 DTOs currently utilize `@Data`, exposing mutable setters on values that should be strictly immutable. Java 21 native records offer a cleaner, type-safe alternative without Lombok baggage.
2. **H2 In-Memory Divergence in Integration Tests:** Integration tests execute against H2 in-memory mode with `flyway.enabled: false` and `ddl-auto: create-drop`. This introduces false confidence: Flyway migrations are never verified in automated builds, PostgreSQL constraint semantics (such as `TIMESTAMPTZ` and `EXCLUDE USING gist`) are bypassed, and foreign-key drops trigger artificial cascade failures.
3. **Frontend Styling Fragmentation:** The React frontend currently relies almost exclusively on inline styles (`style={{ ... }}`), resulting in bloated component files (e.g., `TasksPage.tsx` at >1,400 lines), zero design token reuse, no responsive breakpoint utilities, and no theme system.
4. **Optimistic Locking Exception Handling:** Entities utilize `@Version`, but `ObjectOptimisticLockingFailureException` is unhandled in `GlobalExceptionHandler`, causing concurrent update collisions to return HTTP 500 instead of HTTP 409 Conflict.

---

## 1. Current Technology Stack

| Layer / Concern | Current Technology | Version | Implementation Details |
|---|---|---|---|
| **Backend Runtime** | Java OpenJDK | 21 | Toolchain managed via Gradle `languageVersion = 21` |
| **Backend Framework** | Spring Boot | 3.4.1 | Spring MVC, Spring Data JPA, Spring Security, Validation |
| **Build System** | Gradle (Kotlin DSL) | 8.12 | `build.gradle.kts`, wrapper included |
| **Relational Database** | PostgreSQL | 16 (Alpine) | Runs in Docker Compose, port 5433 host mapping |
| **Database Migrations** | Flyway | 10.x | `flyway-core`, `flyway-database-postgresql` (V1–V6 SQL scripts) |
| **Security & Auth** | Spring Security + JJWT | 6.4 / 0.12.6 | Stateless JWT bearer tokens, HMAC-SHA256, method security |
| **API Documentation** | Springdoc OpenAPI | 2.8.5 | Swagger UI at `/api/swagger-ui.html`, spec at `/api-docs` |
| **Boilerplate Reduction**| Project Lombok | 1.18.36 | `@Data`, `@Builder`, `@Getter`, `@Setter`, `@Slf4j` |
| **File Storage** | Custom `LocalStorageService`| Custom | Local filesystem storage (`uploads/`), pluggable interface |
| **Unit Testing** | JUnit 5 + Mockito + AssertJ | Latest Spring | Isolated service tests with Mockito mocks |
| **Integration Testing**| Spring Boot Test + H2 | 2.3.232 | In-memory H2 with PostgreSQL emulation mode |
| **Frontend Framework** | React (SPA) | 18.3.1 | Single-page application with TypeScript |
| **Frontend Language** | TypeScript | 5.7.2 | Strict mode enabled (`tsconfig.json`) |
| **Build Tool & Bundler**| Vite | 6.0.5 | Fast HMR, Rollup production bundler |
| **Routing** | React Router | 7.1.1 | Declarative client-side routing with `ProtectedRoute` |
| **Server State** | TanStack React Query | 5.62.0 | Query caching, optimistic mutations, refetch intervals |
| **HTTP Client** | Axios | 1.7.9 | Centralized instance with auth request interceptors |
| **Frontend Styling** | Raw Inline CSS + minimal CSS| N/A | 79-line `index.css` + inline JavaScript style objects |

---

## 2. Recommended Technology Stack

| Component | Recommendation | Rationale |
|---|---|---|
| **DTO Representation** | **Java 21 Records** | Native language feature, immutability by default, zero Lombok dependency, supported by Spring MVC and Jackson. |
| **Entity Boilerplate** | **Targeted Lombok only** | Retain `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` on JPA entities. Prohibit `@Data`. |
| **Integration Testing** | **Testcontainers PostgreSQL 16** | Replaces H2. Tests execute real Flyway migrations against the exact database engine used in production. |
| **Frontend Styling** | **Tailwind CSS v3/v4 + Lightweight UI Primitives** | Replaces cumbersome inline styles with standardized utility classes and reusable design tokens. |
| **Component Library** | **Lightweight in-house primitives** (Optional shadcn/ui later) | Avoid importing heavy component libraries prematurely. Build simple `Button`, `Badge`, `Card`, `Modal` primitives with Tailwind. |
| **Concurrency Errors** | **Spring `ObjectOptimisticLockingFailureException` handler** | Map optimistic lock collisions to HTTP 409 Conflict with code `CONCURRENT_MODIFICATION`. |

---

## 3. DTO Record Migration List

### 3.1 Decision Framework

- **Convert to Java Record:** All request payloads and response DTOs that serve strictly as immutable carriers of data between controller and client. Jakarta Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, etc.) placed on record components work natively in Spring Boot 3 / Hibernate Validator 8.
- **Keep as Standard Class:**
  - Classes requiring mutability or progressive assembly.
  - Complex polymorphic hierarchies or generic response wrappers where builder-based fluid construction is heavily ingrained across existing consumers (e.g., `ApiResponse<T>`).
  - Multipart file form binding wrappers that require JavaBean conventions or mutable binding states.

### 3.2 Full DTO Audit & Classification (42 DTOs)

| Module | DTO Name | Current Style | Recommended Action | Justification |
|---|---|---|---|---|
| **auth** | `LoginRequest` | Class with `@Data, @Builder` | **Convert to Record** | Simple immutable input. `@NotBlank` and `@Email` validate seamlessly on record components. |
| **auth** | `AuthResponse` | Class with `@Data, @Builder` | **Convert to Record** | Pure immutable data carrier returning JWT token and basic profile. |
| **branch** | `CreateBranchRequest` | Class with `@Data, @Builder` | **Convert to Record** | Immutable command payload. Validation annotations work natively. |
| **branch** | `UpdateBranchRequest` | Class with `@Data, @Builder` | **Convert to Record** | Immutable update command. |
| **branch** | `UpdateBranchStatusRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single boolean field (`isActive`). Overkill for a mutable class. |
| **branch** | `BranchResponse` | Class with `@Data, @Builder` | **Convert to Record** | Pure projection of branch state. |
| **branch** | `BranchSummaryResponse` | Class with `@Data, @Builder` | **Convert to Record** | Minimal projection (`id`, `name`, `active`). Ideal record candidate. |
| **user** | `CreateUserRequest` | Class with `@Data, @Builder` | **Convert to Record** | Immutable registration command with standard validation constraints. |
| **user** | `UpdateUserRequest` | Class with `@Data, @Builder` | **Convert to Record** | Immutable user update payload. |
| **user** | `UpdateProfileRequest` | Class with `@Data, @Builder` | **Convert to Record** | Minimal self-service profile update. |
| **user** | `ChangePasswordRequest` | Class with `@Data, @Builder` | **Convert to Record** | Immutable security credential payload. |
| **user** | `TransferBranchRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single UUID payload (`newBranchId`). |
| **user** | `UpdateUserStatusRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single boolean flag (`isActive`). |
| **user** | `UserResponse` | Class with `@Data, @Builder` | **Convert to Record** | Immutable user detail response. |
| **user** | `ResetPasswordResponse` | Class with `@Data, @Builder` | **Convert to Record** | One-time temporary password carrier. |
| **shift** | `CreateShiftRequest` | Class with `@Data, @Builder` | **Convert to Record** | Scheduling payload with start/end time. |
| **shift** | `UpdateShiftRequest` | Class with `@Data, @Builder` | **Convert to Record** | Update scheduling payload. |
| **shift** | `UpdateShiftStatusRequest` | Class with `@Data, @Builder` | **Convert to Record** | Status transition command (`status`). |
| **shift** | `AssignStaffRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single UUID payload (`userId`). |
| **shift** | `ShiftAssignmentResponse` | Class with `@Data, @Builder` | **Convert to Record** | Assignment detail representation. |
| **shift** | `ShiftResponse` | Class with `@Data, @Builder` | **Convert to Record** | Deep response with nested list of `ShiftAssignmentResponse`. |
| **attendance**| `AttendanceResponse` | Class with `@Data, @Builder` | **Convert to Record** | Flattened attendance projection with punctuality metrics. |
| **task** | `CreateTaskTemplateRequest` | Class with `@Data, @Builder` | **Convert to Record** | Template command containing nested list of `CreateTaskTemplateItemRequest`. |
| **task** | `CreateTaskTemplateItemRequest` | Class with `@Data, @Builder` | **Convert to Record** | Component item within a template. |
| **task** | `UpdateTaskTemplateRequest` | Class with `@Data, @Builder` | **Convert to Record** | Template metadata update. |
| **task** | `UpdateTaskTemplateStatusRequest`| Class with `@Data, @Builder` | **Convert to Record** | Single boolean active flag. |
| **task** | `GenerateTasksRequest` | Class with `@Data, @Builder` | **Convert to Record** | Pair of UUIDs (`shiftId`, `templateId`). |
| **task** | `CreateAdHocTaskRequest` | Class with `@Data, @Builder` | **Convert to Record** | Direct task creation command. |
| **task** | `UpdateTaskStatusRequest` | Class with `@Data, @Builder` | **Convert to Record** | Status transition command. |
| **task** | `TaskTemplateItemResponse` | Class with `@Data, @Builder` | **Convert to Record** | Template item view. |
| **task** | `TaskTemplateResponse` | Class with `@Data, @Builder` | **Convert to Record** | Template aggregate view. |
| **task** | `TaskResponse` | Class with `@Data, @Builder` | **Convert to Record** | Task instance projection. |
| **issue** | `CreateIssueRequest` | Class with `@Data, @Builder` | **Convert to Record** | Issue reporting command payload. |
| **issue** | `AssignIssueRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single UUID payload (`assignedToUserId`). |
| **issue** | `UpdateIssueStatusRequest` | Class with `@Data, @Builder` | **Convert to Record** | Status update with optional comment. |
| **issue** | `CreateIssueCommentRequest` | Class with `@Data, @Builder` | **Convert to Record** | Single message string payload. |
| **issue** | `IssueAttachmentResponse` | Class with `@Data, @Builder` | **Convert to Record** | Attachment metadata projection. |
| **issue** | `IssueCommentResponse` | Class with `@Data, @Builder` | **Convert to Record** | Comment view projection. |
| **issue** | `IssueResponse` | Class with `@Data, @Builder` | **Convert to Record** | Complete issue aggregate view. |
| **issue** | `IssueSummaryResponse` | Class with `@Data, @Builder` | **Convert to Record** | Paginated table row view with counters. |
| **common** | `PagedResponse<T>` | Class with `@Data, @Builder` | **Convert to Record** | Generic pagination wrapper. |
| **common** | `ApiResponse<T>` | Class with `@Data, @Builder` | **Keep as Class / Refactor** | Contains static factory methods (`success()`, `error()`) heavily referenced throughout the codebase. Replacing `@Data` with `@Getter` and private constructor is safer than full record conversion to prevent breaking existing factory chains. |

---

## 4. Lombok Audit

### 4.1 Current Usage Breakdown

- **Total `@Data` Annotations in Project:** 43
- **`@Data` on JPA Entities:** **0** (All JPA entities already avoid `@Data`, which is excellent).
- **`@Data` on DTOs:** **43** (All instances are on DTOs and API response models).

### 4.2 Why `@Data` is Problematic on DTOs

`@Data` is a bundle annotation that generates `@Getter`, `@Setter`, `@EqualsAndHashCode`, `@ToString`, and `@RequiredArgsConstructor`.
1. **Unwanted Mutability:** DTOs represent immutable network payloads. Generating setters allows inadvertent mutation across service boundaries.
2. **Boilerplate Shadowing:** Java records provide canonical constructors, accessors, `equals()`, `hashCode()`, and `toString()` natively without compiler plugin processing.
3. **Serialization Bugs:** Mutable DTOs can introduce subtle bugs when used in collections, maps, or caching layers.

### 4.3 Classification of Current Usages

| Usage Category | Count | Action | Target Architecture |
|---|---|---|---|
| **Request DTOs** | 22 | **Replace** | Convert to Java Records. Retain validation annotations on components. |
| **Response DTOs** | 19 | **Replace** | Convert to Java Records. Use canonical constructor or static factory. |
| **Pagination Wrapper (`PagedResponse`)** | 1 | **Replace** | Convert to generic Java Record: `record PagedResponse<T>(...)`. |
| **Envelope Wrapper (`ApiResponse`)** | 1 | **Refactor** | Retain class structure; remove `@Data`; replace with `@Getter` + private constructors + static factories. |
| **JPA Entities** | 12 | **Keep** | Retain targeted annotations: `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`. Ensure no entity adopts `@EqualsAndHashCode` without business keys. |

---

## 5. Frontend Styling Audit & Tailwind Migration Strategy

### 5.1 Current Frontend Styling Architecture

- **Total CSS Files:** 1 (`frontend/src/index.css`, 79 lines).
- **Styling Method:** 95%+ of all styles across all 10 pages and components are written as inline JavaScript objects:
  ```tsx
  // Example pattern repeated across TasksPage, IssuesPage, ShiftsPage:
  <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
  ```
- **Architectural Flaws:**
  1. **No Design System or Tokens:** Hex colors (`#2563eb`, `#1d4ed8`, `#fee2e2`, `#991b1b`) are hardcoded across hundreds of lines with slight variations (`#e5e7eb` vs `#e2e8f0` vs `#d1d5db`).
  2. **Code Bloat:** Over 40% of the lines in pages like `TasksPage.tsx` (1,428 lines) and `IssuesPage.tsx` (890 lines) consist of repetitive inline style objects.
  3. **No Responsive Breakpoints:** CSS media queries cannot be applied via inline styles without custom JavaScript window listeners.
  4. **No Pseudo-states:** `:hover`, `:focus-visible`, and `:active` styles cannot be cleanly implemented inline without ad-hoc React hover state management.

### 5.2 Recommended Migration: Tailwind CSS

#### Step 1: Install Tailwind CSS & Configure Vite
```bash
cd frontend
npm install -D tailwindcss @tailwindcss/vite
```
In `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

#### Step 2: Establish ShiftOps Design Tokens
Define standard semantics in `frontend/src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;

  --color-status-urgent: #ef4444;
  --color-status-high: #f97316;
  --color-status-normal: #3b82f6;
  --color-status-low: #6b7280;
}
```

#### Step 3: Build Reusable In-House UI Primitives
Create clean primitives in `frontend/src/components/ui/`:
1. `Button.tsx`: Variants (`primary`, `secondary`, `danger`, `outline`, `ghost`), sizes (`sm`, `md`, `lg`), disabled/loading spinner states.
2. `Badge.tsx`: Color variants matching entity statuses (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `URGENT`, `HIGH`).
3. `Card.tsx`: Metric summary cards with colored indicator borders.
4. `Modal.tsx`: Accessible dialog wrapper with backdrop and escape key listener.
5. `Input.tsx` / `Select.tsx`: Standard input fields with focus rings and error states.

#### Step 4: Page Migration Strategy
- **Do NOT rewrite all pages in a single commit.**
- **Phase A:** Install Tailwind, create `components/ui/` primitives, and style layout/header.
- **Phase B:** Migrate new/incoming modules (Handover, Notifications) directly using Tailwind.
- **Phase C:** Progressively refactor existing pages (Issues -> Tasks -> Shifts -> Staff -> Branches).

#### What about `shadcn/ui`?
- **Recommendation:** **Do NOT install full shadcn/ui immediately.**
- **Rationale:** `shadcn/ui` relies on Radix UI headless components and Tailwind. For a focused operational dashboard, standard Tailwind utility classes and 5 lightweight in-house primitives provide 95% of the value without adding 10+ Radix dependencies to `package.json`. If advanced keyboard accessibility for comboboxes or complex date pickers is needed later, shadcn/ui can be adopted incrementally.

---

## 6. Test Database Audit: H2 vs. Testcontainers PostgreSQL

### 6.1 Current H2 Configuration Risks

In `backend/src/test/resources/application-test.yml`:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:shiftops_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

### 6.2 Critical Differences Between H2 and Production PostgreSQL

| Feature / Behavior | Production PostgreSQL | Current H2 Test DB | Impact & Risk |
|---|---|---|---|
| **Flyway Migrations** | Executes V1–V6 SQL migrations on startup | **Completely disabled** (`flyway.enabled: false`) | **HIGH RISK:** Faulty SQL migration scripts will pass all tests in CI and fail only in production. |
| **Concurrency & Locks** | `PESSIMISTIC_WRITE` locks actual rows in MVCC engine | Emulated table/row lock in memory | Concurrent assignment overlap tests may pass in H2 but deadlock or fail in PostgreSQL. |
| **Timestamps & TZ** | `TIMESTAMPTZ` with microsecond resolution in UTC | Emulated timestamp; subtle rounding differences | Edge cases in overnight shift boundary calculations may diverge. |
| **Cascade & FK Cleanup** | Supports standard `CASCADE` constraints | Strict in-memory constraint evaluation | Requires extensive manual `deleteAll()` order in test setup to avoid `ConstraintViolationException`. |
| **PostgreSQL Functions** | `gen_random_uuid()`, `NOW()`, custom extensions | Simulated functions; may reject native SQL syntax | Native SQL queries or triggers cannot be tested. |

### 6.3 Testcontainers PostgreSQL Migration Plan

#### Step 1: Add Dependencies to `build.gradle.kts`
```kotlin
testImplementation("org.testcontainers:junit-jupiter:1.20.4")
testImplementation("org.testcontainers:postgresql:1.20.4")
```

#### Step 2: Implement Singleton Reusable Container
Create `com.shiftops.test.PostgresTestContainer`:
```java
public abstract class BaseIntegrationTest {

    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("shiftops_test")
            .withUsername("shiftops")
            .withPassword("shiftops");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
}
```

#### Step 3: Migration Candidates (Priority Order)

1. **High Value (Immediate):**
   - [`Phase3IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase3IntegrationTest.java): Tests concurrent shift assignments, overnight shift boundaries, and overlap detection.
   - [`Phase6IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase6IntegrationTest.java): Tests issue attachment cascades, audit trail comments, and server UTC timestamps.
2. **Medium Value:**
   - [`Phase4IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase4IntegrationTest.java): Tests attendance check-in/out timestamps and punctuality logic.
   - [`Phase5IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase5IntegrationTest.java): Tests bulk task generation and template item ordering.
3. **Low Value:**
   - [`Phase1IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase1IntegrationTest.java) & [`Phase2IntegrationTest`](file:///d:/Java/Shiftops/backend/src/test/java/com/shiftops/Phase2IntegrationTest.java): Basic CRUD and authentication.

---

## 7. Existing Technologies to Keep

| Technology | Status | Justification |
|---|---|---|
| **Spring Boot 3.4.1** | **KEEP** | Industry standard, robust dependency injection, production monitoring, Java 21 support. |
| **Spring Security 6.4** | **KEEP** | Standard declarative security via `@PreAuthorize`, filter chains, and password encoding. |
| **Spring Data JPA** | **KEEP** | Clean repository abstraction, built-in pagination, JPA Specifications for dynamic filtering. |
| **Flyway** | **KEEP** | Authoritative, version-controlled database migrations. Essential for production database evolution. |
| **JJWT 0.12.6** | **KEEP** | Lightweight, stateless JWT creation and validation. Exactly fits MVP authentication requirements. |
| **Springdoc OpenAPI 2.8.5** | **KEEP** | Automatically generates accurate Swagger/OpenAPI documentation from Spring MVC endpoints. |
| **TanStack React Query 5** | **KEEP** | Exceptional server-state management, cache invalidation, automated background refetching, mutation lifecycle. |
| **Axios 1.7.9** | **KEEP** | Simple, reliable HTTP client with interceptors for JWT token injection and 401 handling. |
| **Docker & Docker Compose** | **KEEP** | Guarantees development and production PostgreSQL parity without local host installation dependencies. |
| **PostgreSQL 16** | **KEEP** | High performance, rich indexing, transactions, and robust constraints. |
| **JUnit 5 / AssertJ / Mockito**| **KEEP** | Standard Java testing toolset. Unit tests run quickly without Spring context; integration tests verify API contracts. |

---

## 8. Technologies NOT to Add Yet

| Technology | Recommendation | Why ShiftOps Does Not Need It Yet |
|---|---|---|
| **Redis** | **DO NOT ADD** | ShiftOps is an MVP for 5–30 staff per business. In-memory caffeine caching or direct PostgreSQL queries are fast (<5ms) and have zero operational overhead. |
| **Kafka / RabbitMQ** | **DO NOT ADD** | Monolithic modular design communicates internally using Spring `ApplicationEventPublisher` and `@TransactionalEventListener`. Message brokers introduce unnecessary network and infrastructure complexity. |
| **Redux / Zustand** | **DO NOT ADD** | TanStack Query manages 95% of application state (server state). Local UI state (modals, active tabs) is cleanly handled with React `useState`. |
| **Microservices Frameworks**| **DO NOT ADD** | Microservices are strictly forbidden. The modular monolith preserves low operational latency, single database transactions, and simple deployment. |
| **GraphQL** | **DO NOT ADD** | REST endpoints with specific DTO projections and Spring Data JPA Specifications provide complete query flexibility without GraphQL schema maintenance. |
| **Heavy UI Frameworks (MUI/AntD)**| **DO NOT ADD** | Bulky bundle sizes, opinionated theme overrides, and CSS-in-JS runtime performance overhead. |

---

## 9. Technical Debt & Code-Style Inconsistencies

1. **Missing Handler for Optimistic Locking Conflicts:**
   - Entities (`Shift`, `Task`, `Issue`, `Attendance`) define `@Version private Long version;`.
   - When concurrent edits collide, Spring throws `ObjectOptimisticLockingFailureException`.
   - Currently, `GlobalExceptionHandler` lacks a specific handler for this exception, causing it to fall through to `handleGeneral` (HTTP 500).
   - **Fix:** Add `@ExceptionHandler(ObjectOptimisticLockingFailureException.class)` returning HTTP 409 Conflict with code `CONCURRENT_MODIFICATION`.
2. **DTO Mutable Setters:**
   - Because all DTOs use Lombok `@Data`, every field has a public setter. Request and response objects can be mutated in transit across services.
   - **Fix:** Migrate to Java 21 records.
3. **In-Memory H2 Disconnect in Integration Tests:**
   - Integration tests bypass Flyway validation and use H2.
   - **Fix:** Migrate integration tests to Testcontainers PostgreSQL.
4. **Massive Inline Styling in React Pages:**
   - Page components are inflated by hundreds of lines of repetitive `style={{ ... }}` objects.
   - **Fix:** Migrate to Tailwind CSS utility classes and extract reusable UI primitives.
5. **Emoji Icons Instead of SVG Icons:**
   - Buttons and badges currently use emoji characters (`⚠️`, `🚨`, `📋`, `⏱️`, `🔒`). While functional, they render inconsistently across operating systems (Windows vs. macOS vs. Android).
   - **Fix:** Introduce `lucide-react` for consistent, crisp SVG icons.

---

## 10. Recommended Changes (Immediate / Pre-Next Phase)

These changes provide high architectural value with minimal disruption:

1. **Refactor DTOs to Java 21 Records:**
   - Convert all 41 request and response DTOs to Java records.
   - Ensure Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Email`) remain on record parameters.
   - Add `@Builder` annotation to records where builder pattern is utilized in existing unit/integration tests.
2. **Add Optimistic Lock Exception Handling:**
   - Update `GlobalExceptionHandler.java` to handle `ObjectOptimisticLockingFailureException` and return HTTP 409 Conflict.
3. **Install Tailwind CSS on Frontend:**
   - Install `@tailwindcss/vite` and configure `index.css`.
   - Create foundational UI primitives: `Button.tsx`, `Badge.tsx`, `Modal.tsx`, `Input.tsx`.
4. **Configure Testcontainers PostgreSQL:**
   - Add Testcontainers dependencies to `build.gradle.kts`.
   - Create `BaseIntegrationTest` to run Flyway migrations against real PostgreSQL in tests.

---

## 11. Recommended Changes That Can Wait Until Later

1. **Full Page-by-Page Tailwind Refactoring:**
   - Progressively convert existing screens (`TasksPage`, `IssuesPage`, `ShiftsPage`) during routine feature updates rather than in a single high-risk rewrite.
2. **Icon Library Migration (`lucide-react`):**
   - Replace emoji icons with `lucide-react` icons during frontend UI polish.
3. **Cloud Object Storage Provider:**
   - Replace `LocalStorageService` with an S3 / Google Cloud Storage implementation when cloud deployment is scheduled.
4. **RFC 7807 `ProblemDetail` Specification:**
   - Transition `ApiResponse.ErrorDetail` to Spring 6's native `ProblemDetail` standard when external API consumers require standard RFC 7807 compliance.
5. **Event-Driven In-Process Notifications (Phase 8):**
   - Connect domain events (`IssueReportedEvent`, `ShiftAssignedEvent`) to user notifications using Spring Application Events.

---

*Audit completed and documented in accordance with ShiftOps engineering standards.*
