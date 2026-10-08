# Phase 8 — Announcements & Notifications Design Document

## 1. Executive Summary & Core Business Purpose
In daily operational businesses, staff and managers do not sit waiting on dashboards; they return to the application when an operational event requires their attention or action.

**Phase 8 introduces:**
1. **Operational Notifications**: An in-process, event-driven notification engine that notifies users about critical shifts, tasks, issues, and handovers.
2. **Operational Announcements**: A simple, branch-scoped broadcasting tool allowing Managers and Owners to publish urgent updates or shift-specific notices without relying on external chat applications.
3. **Automated Shift Reminders**: A background cron scheduler that alerts staff ~30 minutes prior to their scheduled shift start.

---

## 2. Domain Entities & Architecture

```
User (Recipient) ◄──── (0..*) Notification
                           │
                           └── Reference (SHIFT | TASK | ISSUE | HANDOVER | ANNOUNCEMENT)

Branch (0..1) ◄────── (0..*) Announcement ──────► User (CreatedBy)
                                  │
                                  └── Target Shift (0..1)
```

### 2.1 `Notification`
A personalized operational notice for a specific user.

| Field | Type | Nullable | Constraints & Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `recipient` | `User` | No | `ON DELETE CASCADE`. The recipient staff/manager/owner. |
| `type` | `NotificationType` | No | Enum: `SHIFT_PUBLISHED`, `SHIFT_CHANGED`, `TASK_ASSIGNED`, `ISSUE_ASSIGNED`, `ISSUE_UPDATED`, `HANDOVER_SUBMITTED`, `HANDOVER_ACKNOWLEDGED`, `ANNOUNCEMENT_PUBLISHED`, `SHIFT_REMINDER` |
| `title` | `String` | No | `VARCHAR(150)`. Brief summary header. |
| `message` | `String` | No | `VARCHAR(500)`. Clear actionable context. |
| `referenceType`| `ReferenceType` | Yes | Enum: `SHIFT`, `TASK`, `ISSUE`, `HANDOVER`, `ANNOUNCEMENT` |
| `referenceId` | `UUID` | Yes | Foreign identifier of the referenced business entity. |
| `readAt` | `Instant` | Yes | Timestamp when the user read the notification; `NULL` = unread. |
| `createdAt` | `Instant` | No | Audit creation timestamp. |
| `version` | `Long` | Yes | Optimistic locking counter. |

### 2.2 `Announcement`
A branch-wide or organization-wide broadcast notice.

| Field | Type | Nullable | Constraints & Description |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key |
| `branch` | `Branch` | Yes | `ON DELETE CASCADE`. Nullable only if `targetType = ORGANIZATION`. |
| `createdBy` | `User` | No | Authoring manager or owner. |
| `title` | `String` | No | `VARCHAR(150)`. Announcement headline. |
| `content` | `String` | No | `TEXT`. Detailed announcement body. |
| `targetType` | `AnnouncementTargetType` | No | Enum: `BRANCH`, `SHIFT`, `ORGANIZATION`. |
| `targetShift`| `Shift` | Yes | Optional link when targeting a specific shift. |
| `publishedAt`| `Instant` | Yes | UTC publish timestamp; `NULL` = draft. |
| `expiresAt` | `Instant` | Yes | Optional expiration timestamp after which notice disappears. |
| `createdAt` | `Instant` | No | Audit creation timestamp. |
| `updatedAt` | `Instant` | No | Audit update timestamp. |
| `version` | `Long` | Yes | Optimistic locking counter. |

---

## 3. Event-Driven Architecture & Transaction Consistency

To preserve clean modularity, business services (`TaskService`, `IssueService`, `ShiftService`, `ShiftHandoverService`, `AnnouncementService`) **do not directly depend on** `NotificationService` or `NotificationRepository`. Instead, they emit standard Spring `ApplicationEvent`s.

### 3.1 Event Catalog
- `ShiftPublishedEvent(shiftId, branchId, staffUserIds)`
- `ShiftChangedEvent(shiftId, branchId, staffUserIds, changeSummary)`
- `TaskAssignedEvent(taskId, shiftId, assignedUserId, title)`
- `IssueAssignedEvent(issueId, branchId, assignedToUserId, issueTitle)`
- `IssueStatusChangedEvent(issueId, branchId, reporterUserId, assigneeUserId, oldStatus, newStatus, issueTitle)`
- `HandoverSubmittedEvent(handoverId, shiftId, branchId, submittedByUserId, shiftName)`
- `HandoverAcknowledgedEvent(handoverId, shiftId, branchId, acknowledgedByUserId, submitterUserId, shiftName)`
- `AnnouncementPublishedEvent(announcementId, branchId, targetType, targetShiftId, title, content)`

### 3.2 Transaction Boundary & Consistency
If an event is processed synchronously inside a database transaction that subsequently fails and rolls back, direct notification insertion would result in **false/ghost notifications** (e.g. notifying a user of an assigned task that was never committed).

**Solution:**
All notification event listeners use Spring's:
```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
```
- The event listener fires **only after** the originating business transaction has successfully committed.
- The notification listener executes within its own independent transaction (`@Transactional(propagation = Propagation.REQUIRES_NEW)` in `NotificationService`), guaranteeing that:
  1. Failed/rolled-back operations produce **0** notifications.
  2. Notification creation errors never retroactively fail the completed business transaction.

---

## 4. Idempotency & Deduplication

Notifications must be deduplicated to avoid flooding users when events fire multiple times (e.g., retries, duplicate requests, or periodic schedulers).

### Deduplication Rules:
1. `SHIFT_REMINDER`: Only one reminder per `(recipient_id, shift_id)`. Checked via `notificationRepository.existsByRecipientIdAndTypeAndReferenceId(userId, SHIFT_REMINDER, shiftId)`.
2. `TASK_ASSIGNED`: Only one notification per `(recipient_id, task_id)`. Checked via `existsByRecipientIdAndTypeAndReferenceId(userId, TASK_ASSIGNED, taskId)`.
3. `SHIFT_PUBLISHED`: One notification per `(recipient_id, shift_id)`.
4. `HANDOVER_SUBMITTED`: One notification per handover per recipient.
5. `ANNOUNCEMENT_PUBLISHED`: One notification per announcement per recipient.

---

## 5. Automated Shift Reminder Scheduler

### Logic:
- Runs via Spring `@Scheduled(cron = "0 */5 * * * *")` (every 5 minutes).
- Calculates target window: `[now + 25 minutes, now + 35 minutes]`.
- Queries `shiftRepository` for `PUBLISHED` shifts whose `startTime` falls within this 10-minute window.
- For each assigned active staff member:
  - If `existsByRecipientIdAndTypeAndReferenceId(staffId, SHIFT_REMINDER, shiftId)` is false:
    - Generates reminder notification: `"Your shift starts in 30 minutes at " + branchName`.
- Correctly supports overnight shifts because `startTime` is evaluated as absolute UTC `Instant`.

---

## 6. Authorization & Multi-Tenancy

| Role | Scope | Permitted Actions |
|---|---|---|
| **STAFF** | Own account / branch | - View and mark own notifications.<br>- Read published announcements targeted to their branch, shift, or organization.<br>- **Cannot** access another user's notifications (403).<br>- **Cannot** create or publish announcements (403). |
| **MANAGER** | Assigned branch | - View and mark own notifications.<br>- Create and publish announcements targeting their own branch or branch shifts.<br>- View branch announcement history.<br>- **Cannot** create announcements for other branches (403). |
| **OWNER** | All branches | - View and mark own notifications.<br>- Create and publish announcements for any branch or organization-wide (`ORGANIZATION`). |

---

## 7. Database Schema & Indexes (`V8__create_announcements_and_notifications.sql`)

```sql
-- announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(20) NOT NULL DEFAULT 'BRANCH',
    target_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_announcement_target_type CHECK (target_type IN ('BRANCH', 'SHIFT', 'ORGANIZATION'))
);

CREATE INDEX idx_announcements_branch_published ON announcements(branch_id, published_at DESC);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);

-- notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    reference_type VARCHAR(20),
    reference_id UUID,
    read_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_type CHECK (type IN (
        'SHIFT_PUBLISHED', 'SHIFT_CHANGED', 'TASK_ASSIGNED',
        'ISSUE_ASSIGNED', 'ISSUE_UPDATED', 'HANDOVER_SUBMITTED',
        'HANDOVER_ACKNOWLEDGED', 'ANNOUNCEMENT_PUBLISHED', 'SHIFT_REMINDER'
    )),
    CONSTRAINT chk_notification_reference_type CHECK (reference_type IN (
        'SHIFT', 'TASK', 'ISSUE', 'HANDOVER', 'ANNOUNCEMENT'
    ))
);

CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, read_at);
CREATE INDEX idx_notifications_dedup ON notifications(recipient_id, type, reference_id);
```

---

## 8. REST API Specifications

### Announcements:
- `POST /api/v1/branches/{branchId}/announcements`: Create (and optionally publish) announcement.
- `GET /api/v1/branches/{branchId}/announcements`: List branch announcements (Manager/Owner).
- `GET /api/v1/announcements/my`: Active announcements relevant to caller (Staff/Manager/Owner).
- `POST /api/v1/announcements/{id}/publish`: Publish draft announcement.

### Notifications:
- `GET /api/v1/notifications/my`: Paginated list of notifications for authenticated caller (newest first).
- `GET /api/v1/notifications/unread-count`: Number of unread notifications (`{ count: number }`).
- `PATCH /api/v1/notifications/{id}/read`: Mark single notification as read.
- `PATCH /api/v1/notifications/read-all`: Mark all notifications for authenticated caller as read.

---

## 9. Frontend Experience

1. **Header Notification Bell (`Layout.tsx`)**:
   - Compact bell icon `🔔` with badge showing unread count.
   - Refetched periodically (every 30s) via TanStack Query.
   - Clicking bell toggles an accessible overlay panel:
     - Newest notifications list with read status.
     - Single "Mark as Read" action and header "Mark All as Read" button.
     - Click-through navigation based on `referenceType` (`/shifts`, `/tasks`, `/issues`, `/handovers`).
2. **Dashboard Integration (`DashboardPage.tsx`)**:
   - Urgent operational notices / announcements banner at top of dashboard.
   - Manager announcement quick controls.
