# ShiftOps — Transactional Outbox Pattern Architecture & Design

> **Document Version:** 1.0  
> **Date:** 2026-10-08  
> **Status:** APPROVED  
> **Package:** `com.shiftops.common.outbox`

---

## 1. Problem Statement & Reliability Gap

In Phases 8 and 9, operational domain events (e.g., shifts published, tasks assigned, issue updates, handover submissions) were published via Spring's in-memory `ApplicationEventPublisher`. Notification listeners and STOMP broadcasters reacted using `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.

While clean and decoupled, this in-memory architecture has a fundamental **reliability gap**:
```
[Business Operation] ──(1. DB Commit)──> [PostgreSQL Database (Success)]
         │
         ├──(2. In-Memory Queue)──> [JVM Crash / Network Timeout / Kill -9]
                                                │
                                                ▼
                                    [Event Permanently Lost]
                                    - Staff never notified of shift
                                    - Task assignment never delivered
                                    - Operational handover lost
```

Because the event exists only in JVM process memory after the business transaction commits, any JVM crash, out-of-memory error, or redeployment during that split second causes silent, irrecoverable event loss.

---

## 2. Solution: Transactional Outbox Pattern

To achieve **at-least-once delivery** and complete **transactional durability** without external message brokers (Kafka/RabbitMQ) or distributed caches (Redis), ShiftOps adopts the **Transactional Outbox Pattern**:

```
Client Request
      │
      ▼
[Spring Boot Service]
      │
      ├────────────────────── [Same DB Transaction] ──────────────────────┐
      │                                                                  │
      ▼                                                                  ▼
[Business Tables]                                               [outbox_events Table]
(shifts, tasks, issues, etc.)                                   (status = 'PENDING')
      │                                                                  │
      └───────────────────────── COMMIT ─────────────────────────────────┘
                                                                         │
                                                                         ▼
                                                          [Outbox Processor Worker]
                                                          (Every 3s / Async Trigger)
                                                                         │
                                          ┌──────────────────────────────┴──────────────────────────────┐
                                          ▼                                                             ▼
                                 [Notification Engine]                                         [STOMP WebSocket]
                              (Durable, DB-Idempotent)                                      (Ephemeral Best-Effort)
                                          │                                                             │
                                          ▼                                                             ▼
                              [notifications Table]                                            Active Browser UI
```

### Guarantees
1. **Atomic Durability:** The business mutation and the outbox event commit in the exact same PostgreSQL database transaction. If the database transaction rolls back, no outbox event is saved. If it commits, the outbox record is durably stored on disk.
2. **Crash Resilience:** If the application process terminates abruptly, the pending outbox records remain safely stored in PostgreSQL. Upon application restart, the `OutboxProcessor` automatically detects and processes all pending events.
3. **Idempotency Integration:** Outbox processors provide *at-least-once* delivery. Paired with Phase 10's database-level notification idempotency (`uq_notifications_idempotency_key` and `uq_notifications_recipient_type_ref`), retries never produce duplicate notifications.
4. **Decoupled Realtime:** WebSocket broadcasts remain best-effort. Failure to broadcast to a disconnected WebSocket client never aborts or fails the outbox event processing.

---

## 3. Event Classification: Outbox vs In-Process

Not all events warrant the overhead of persistent outbox records. ShiftOps strictly separates durable business events from ephemeral telemetry:

| Event Type | Classification | Persistence | Rationale |
|------------|----------------|-------------|-----------|
| `SHIFT_PUBLISHED` | **Durable Outbox** | Yes (`outbox_events`) | Critical staff scheduling context; missing this leaves staff unaware of their shifts. |
| `SHIFT_CHANGED` | **Durable Outbox** | Yes (`outbox_events`) | Schedule alterations require guaranteed notification. |
| `TASK_ASSIGNED` | **Durable Outbox** | Yes (`outbox_events`) | Direct operational assignment; must be received. |
| `ISSUE_ASSIGNED` | **Durable Outbox** | Yes (`outbox_events`) | Ownership transfer of critical store issues. |
| `ISSUE_UPDATED` | **Durable Outbox** | Yes (`outbox_events`) | Status transitions (e.g. IN_PROGRESS -> RESOLVED). |
| `HANDOVER_SUBMITTED` | **Durable Outbox** | Yes (`outbox_events`) | Inter-shift debrief; must alert incoming management. |
| `HANDOVER_ACKNOWLEDGED` | **Durable Outbox** | Yes (`outbox_events`) | Outgoing team confirmation. |
| `ANNOUNCEMENT_PUBLISHED`| **Durable Outbox** | Yes (`outbox_events`) | Organization/branch-wide operational directives. |
| `STAFF_CHECKED_IN` | **Ephemeral In-Process**| No (DB already saved in `attendance`) | Real-time dashboard ticker only; state is already durable in `attendance` table. |
| `STAFF_CHECKED_OUT` | **Ephemeral In-Process**| No (DB already saved in `attendance`) | Real-time dashboard ticker only. |
| `TASK_COMPLETED` | **Ephemeral In-Process**| No (DB already saved in `tasks`) | Real-time dashboard ticker only. |

---

## 4. Outbox Schema & State Machine

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(60) NOT NULL,
    aggregate_type VARCHAR(40) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    error_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_outbox_status CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'))
);
```

### State Machine
```
[PENDING] ──(Worker Claims)──> [PROCESSING] ──(Handler Success)──> [PROCESSED]
                                    │
                              (Exception)
                                    │
                                    ├──(retry < max_retries)──> [PENDING (with backoff)]
                                    └──(retry >= max_retries)─> [FAILED (terminal)]
```

- **Optimistic State Claiming:** To prevent concurrent worker collisions without aggressive table locks, claiming transitions `PENDING -> PROCESSING` with `@Version` optimistic concurrency control.
- **Exponential Backoff:** Retried events schedule next execution at `now + (2 ^ retryCount * 5) seconds`.
- **Terminal Dead-Letter (`FAILED`):** If max retries (3) are exceeded, event remains `FAILED` with detailed `error_message` for administrative inspection and alerting.

---

## 5. Implementation Components

1. `OutboxEvent.java`: JPA Entity mapping table `outbox_events`.
2. `OutboxRepository.java`: Custom queries with partial index support (`findEligibleEvents`, `countByStatus`).
3. `OutboxService.java`: Transactional helper serializing payloads and saving records.
4. `OutboxEventListener.java`: `@TransactionalEventListener(phase = BEFORE_COMMIT)` automatically capturing domain events and persisting outbox records in the caller's transaction.
5. `OutboxProcessor.java`: Periodic poller (`@Scheduled`) claiming pending events and delegating to handlers.
