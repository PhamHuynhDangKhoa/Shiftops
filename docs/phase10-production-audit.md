# ShiftOps — Phase 10 Production & Reliability Audit

> **Document Version:** 1.0  
> **Date:** 2026-10-08  
> **Status:** APPROVED  
> **Target:** Modular Monolith Production Hardening & Reliability Readiness

---

## Executive Summary

ShiftOps is functionally complete across Phases 0 through 9, supporting authentication, multi-branch operations, shift scheduling, attendance, task assignments, issue management, shift handovers, announcements, notifications, and real-time STOMP WebSockets.

The primary objective of **Phase 10** is not adding new business features, but systematically eliminating hidden failure modes. This technical audit evaluates:
1. Event reliability and transactional durability
2. Concurrency safety and database-level idempotency
3. Security posture (JWT, authorization, CORS, file storage)
4. Schedulers and failure recovery
5. Observability (structured logging, correlation IDs, metrics, health checks)
6. Containerization, CI/CD, and deployment readiness

---

## Audit Findings Matrix

| Finding ID | Domain / Module | Description | Severity | Target Resolution |
|------------|-----------------|-------------|----------|-------------------|
| **AUD-01** | Notification Engine | Race condition in notification deduplication (application check-then-insert without DB unique constraint) | **HIGH** | Add database-level unique constraint via Flyway + graceful catch of `DataIntegrityViolationException` |
| **AUD-02** | Domain Events | Reliability gap: In-process events (`@TransactionalEventListener(AFTER_COMMIT)`) lost on JVM restart/crash | **HIGH** | Implement DB-backed Transactional Outbox Pattern with durable state and retry handling |
| **AUD-03** | Scheduler Reliability | `ShiftReminderScheduler` misses shift reminders if server is down during the narrow 25–35 min window | **HIGH** | Widen query to all unnotified upcoming shifts within 35 minutes; enforce DB deduplication |
| **AUD-04** | Security / CORS | `SecurityConfig` has `.cors(cors -> {})` without explicit `CorsConfigurationSource` bean or env-configured origins | **HIGH** | Define explicit `CorsConfigurationSource` with configurable allowed origins (`APP_CORS_ALLOWED_ORIGINS`) |
| **AUD-05** | Security / Secrets | Default JWT secret in `application.yml` fallback could be accidentally used in production | **HIGH** | Enforce environment-variable-driven configuration and document production secrets requirement |
| **AUD-06** | File Storage / Uploads | Content-Disposition header in attachment downloads vulnerable to quote injection; missing extension validation in storage service | **MEDIUM** | Sanitize Content-Disposition filename, add `X-Content-Type-Options: nosniff`, enforce extension whitelist |
| **AUD-07** | Observability | Missing Spring Boot Actuator, correlation/request ID in logs (MDC), and outbox/WebSocket metrics | **MEDIUM** | Add `spring-boot-starter-actuator`, implement `CorrelationIdFilter`, export Micrometer metrics |
| **AUD-08** | Containerization | Missing production multi-stage `Dockerfile` and production-oriented compose file | **MEDIUM** | Create multi-stage `Dockerfile` (Eclipse Temurin JRE 21) + production `docker-compose.prod.yml` |
| **AUD-09** | CI/CD | Missing automated GitHub Actions workflow for backend & frontend verification | **MEDIUM** | Create `.github/workflows/ci.yml` running unit tests, integration tests, lint, and build |
| **AUD-10** | Concurrency / Case-Sensitivity | User email uniqueness in PostgreSQL is case-sensitive without lowercase index | **LOW** | Add functional unique index on `LOWER(email)` via Flyway |

---

## Detailed Technical Analysis

### 1. Notification Deduplication (AUD-01) — HIGH
- **Current State:** `NotificationService.createNotification` executes:
  ```java
  if (referenceId != null && notificationRepository.existsByRecipientIdAndTypeAndReferenceId(recipientId, type, referenceId)) {
      return Optional.empty();
  }
  notificationRepository.save(notification);
  ```
- **Failure Mode:** Under concurrent execution (e.g. concurrent outbox workers, retried network requests, or dual event triggers), thread A and thread B both execute `existsBy...` simultaneously. Both observe `false`, and both issue an `INSERT`. Because `V8` only created a standard non-unique index (`idx_notifications_dedup`), two duplicate notifications are written to the database.
- **Remediation:** 
  1. Add an `idempotency_key VARCHAR(120)` column to `notifications` with a `UNIQUE` partial index:
     `CREATE UNIQUE INDEX uq_notifications_idempotency_key ON notifications (idempotency_key) WHERE idempotency_key IS NOT NULL;`
  2. Also add a unique partial index on `(recipient_id, type, reference_id) WHERE reference_id IS NOT NULL;`.
  3. Update `NotificationService.createNotification` to catch `DataIntegrityViolationException` and return `Optional.empty()` gracefully.

---

### 2. Transactional Durability & Outbox Pattern (AUD-02) — HIGH
- **Current State:** Business methods (e.g., `ShiftService.publishSchedule()`, `TaskService.assignTask()`, `IssueService.updateIssueStatus()`) commit a database transaction and emit a Spring Application Event. Listeners annotate `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
- **Failure Mode:** If the process crashes immediately following transaction commit, or if the notification service experiences a transient failure, the event in the JVM queue is permanently lost. Staff members never receive their shift published or task assignment notices.
- **Remediation:**
  1. Create `outbox_events` table via Flyway (`id`, `event_type`, `aggregate_type`, `aggregate_id`, `payload`, `status`, `retry_count`, `scheduled_at`, `processed_at`, `error_message`, `created_at`, `version`).
  2. Write domain events to `outbox_events` in the same database transaction as the business mutation.
  3. Dedicated polling worker with `SELECT ... FOR UPDATE SKIP LOCKED` (or status locking) to process records idempotently, dispatch notifications, and mark records `PROCESSED`.
  4. Realtime STOMP broadcasts remain best-effort: failure to broadcast to WebSocket does not abort outbox progress.

---

### 3. Shift Reminder Scheduler Reliability (AUD-03) — HIGH
- **Current State:**
  ```java
  Instant windowStart = now.plus(Duration.ofMinutes(25));
  Instant windowEnd = now.plus(Duration.ofMinutes(35));
  List<Shift> upcomingShifts = shiftRepository.findPublishedShiftsStartingBetween(windowStart, windowEnd);
  ```
- **Failure Mode:** If the server is offline or experiencing high garbage collection between 25 and 35 minutes before shift start (a 10-minute window), once the clock passes 35 minutes, the shift is never retrieved. Staff received no reminder.
- **Remediation:**
  1. Query for published shifts starting in `(now, now + 35 minutes]`.
  2. Rely on the database-level notification deduplication key `(user_id, SHIFT_REMINDER, shift_id)` to ensure each reminder is sent exactly once.
  3. If the backend is restarted 10 minutes before shift start, it catches all unreminded upcoming shifts immediately.

---

### 4. Security Hardening (AUD-04, AUD-05, AUD-06) — HIGH / MEDIUM
- **CORS:** Configure explicit origins using `@Value("${app.cors.allowed-origins:http://localhost:5173}")`, permitting credentials, standard methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`), and required headers.
- **JWT:** Ensure documentation clearly requires setting `JWT_SECRET` in production environments, with a minimum key length of 256 bits (32 bytes).
- **File Upload Security:**
  - Sanitize `Content-Disposition` header in `IssueController` using `ContentDisposition.builder("inline").filename(sanitizedFilename, StandardCharsets.UTF_8).build().toString()`.
  - Add `X-Content-Type-Options: nosniff` header to prevent MIME-confusion attacks.
  - Enforce file extension whitelist (`.jpg`, `.jpeg`, `.png`, `.webp`) in `LocalStorageService`.

---

### 5. Observability & Telemetry (AUD-07) — MEDIUM
- **Correlation ID Filter:** Add `CorrelationIdFilter` (`X-Request-Id`) populating SLF4J MDC with `requestId`. Include in outgoing responses for trace continuity.
- **Spring Actuator:** Add `spring-boot-starter-actuator` to `build.gradle.kts`. Expose `/actuator/health` and `/actuator/info` while protecting management endpoints.
- **Operational Metrics:** Expose Micrometer counters for:
  - Outbox processing count & failure count.
  - Notification deduplication hits.
  - Shift reminder execution counts.

---

### 6. Containerization & CI/CD Readiness (AUD-08, AUD-09) — MEDIUM
- **Dockerfile:** Multi-stage build (Eclipse Temurin JDK 21 -> Gradle build -> Eclipse Temurin JRE 21 runtime container). Runs under a non-root application user with health check.
- **Docker Compose:** Maintain development setup while introducing `docker-compose.prod.yml` configuring PostgreSQL, ShiftOps backend with health check dependencies.
- **CI/CD:** Add `.github/workflows/ci.yml` providing automated verification:
  - Backend compile & unit tests (`./gradlew unitTest`).
  - PostgreSQL Testcontainers integration tests (`./gradlew integrationTest`).
  - Frontend lint (`npm run lint`).
  - Frontend production build (`npm run build`).

---

## Implementation Roadmap for Phase 10

1. **Step 2:** Notification Idempotency & DB Deduplication (`V9__...` migration, service hardening, concurrency tests).
2. **Step 3:** Transactional Outbox Pattern (`V10__...` migration, entity, processor, design doc).
3. **Step 4:** Shift Reminder Scheduler reliability & recovery.
4. **Step 5:** Concurrency & Transaction boundaries audit & verification.
5. **Step 6:** Security Hardening (CORS, file uploads, JWT config, security audit doc).
6. **Step 7:** API & Error Handling Hardening.
7. **Step 8:** Observability (Correlation IDs, MDC, Actuator, Micrometer).
8. **Step 9:** Testing strategy execution (`unitTest` & `integrationTest`).
9. **Step 10:** Docker & Environment hardening (`Dockerfile`, `docker-compose.prod.yml`).
10. **Step 11:** CI/CD pipeline (`.github/workflows/ci.yml`).
11. **Step 12:** Load & Performance verification (k6 script & actual measurements report).
12. **Step 13:** Deployment readiness documentation.
13. **Step 14:** Comprehensive portfolio-grade `README.md`.
14. **Step 15:** Final verification & report.
