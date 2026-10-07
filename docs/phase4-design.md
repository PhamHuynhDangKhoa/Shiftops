# ShiftOps — Phase 4 Design Document: Attendance

> **Module:** Attendance Management  
> **Status:** Approved for Implementation  
> **Date:** 2026-10-07  
> **Author:** Antigravity (AI Systems Architect)

---

## 1. Overview & Business Objectives

Phase 4 introduces real-time operational attendance tracking for ShiftOps. Built on top of the Phase 3 `ShiftAssignment` domain model, it enables:
1. **Staff self check-in & check-out:** Staff members check in and out of their assigned shifts using verified server-generated UTC timestamps.
2. **Punctuality & Status Classification:** Automatic categorization of attendance records as `PRESENT` (on-time), `LATE` (after start time), `COMPLETED` (checked out), or `ABSENT` (no check-in after shift conclusion).
3. **Manager & Owner Visibility:** Real-time monitoring of present, late, completed, and absent personnel with strict branch-level isolation.
4. **Automated Absence Detection:** An idempotent, backend-controlled scheduled process that marks missed shifts as `ABSENT`.

---

## 2. Domain Model & Relationships

Attendance strictly anchors to an existing `ShiftAssignment`. There is **at most one** attendance record per shift assignment ($1:0..1$).

```
Branch (1) 
  └── Shift (N) 
        └── ShiftAssignment (N) 
              └── Attendance (0..1)
```

### Entity Definition: `Attendance`
- `id` (UUID, Primary Key)
- `shiftAssignment` (`ShiftAssignment`, NOT NULL, UNIQUE, FK)
- `checkInAt` (`Instant`, NULLABLE for ABSENT records)
- `checkOutAt` (`Instant`, NULLABLE until check-out)
- `status` (`AttendanceStatus`: `PRESENT`, `LATE`, `COMPLETED`, `ABSENT`)
- `isLate` (`boolean`, NOT NULL, default `false`)
- `notes` (`String`, optional notes)
- `createdAt` (`Instant`, NOT NULL)
- `updatedAt` (`Instant`, NOT NULL)
- `version` (`Long`, NOT NULL, Optimistic Locking)

---

## 3. Attendance Lifecycle & State Machine

```
              ┌────────────────────────────────────────────────────────┐
              │                   Shift Scheduled                      │
              └──────────────────────────┬─────────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
          Staff checks in                             Shift ends with no check-in
                   │                                           │
         ┌─────────┴─────────┐                                 │
         │                   │                                 │
checkIn <= start      checkIn > start                          ▼
         │                   │                           ┌───────────┐
         ▼                   ▼                           │  ABSENT   │
   ┌───────────┐       ┌───────────┐                     └───────────┘
   │  PRESENT  │       │   LATE    │                     (Terminal)
   └─────┬─────┘       └─────┬─────┘
         │                   │
         └─────────┬─────────┘
                   │
            Staff checks out
                   │
                   ▼
            ┌─────────────┐
            │  COMPLETED  │
            └─────────────┘
              (Terminal)
```

### State Transitions
1. **None $\rightarrow$ `PRESENT`**: Check-in occurs within allowed window $[S_{start} - 15\text{m}, S_{end}]$ and $checkInAt \le S_{start}$.
2. **None $\rightarrow$ `LATE`**: Check-in occurs within allowed window $[S_{start} - 15\text{m}, S_{end}]$ and $checkInAt > S_{start}$. `isLate = true`.
3. **`PRESENT` $\rightarrow$ `COMPLETED`**: Check-out occurs with server timestamp $checkOutAt \ge checkInAt$.
4. **`LATE` $\rightarrow$ `COMPLETED`**: Check-out occurs with server timestamp $checkOutAt \ge checkInAt$. `isLate` remains `true` for historical auditing.
5. **None $\rightarrow$ `ABSENT`**: Evaluated by the absence scheduler when $now \ge S_{end}$ and no check-in exists.

---

## 4. Business Rules & Check-in Time Policy

### 4.1 Check-in Window
- **Early Arrival Grace Window:** Check-in is permitted starting **15 minutes** before shift start ($S_{start} - 15\text{ minutes}$).
- **Too Early Rejection:** If $now < S_{start} - 15\text{ minutes}$, reject with HTTP 422 `EARLY_CHECKIN_PROHIBITED`.
- **Shift Concluded Rejection:** If $now > S_{end}$, check-in is closed; reject with HTTP 422 `SHIFT_ALREADY_ENDED`.

### 4.2 Check-in Constraints
- **Self-Service Only:** Only users with role `STAFF` can call check-in/out endpoints for their own assignments (`principal.id == assignment.user.id`).
- **Shift Status Requirement:** The shift must be in `PUBLISHED` status. Check-in is rejected if the shift is `DRAFT`, `COMPLETED`, or `CANCELLED`.
- **Branch Active Requirement:** The branch must be active.
- **Staff Active Requirement:** The staff member must be active.
- **One Check-in Per Assignment:** Duplicate check-in is rejected with HTTP 409 `ALREADY_CHECKED_IN`.

### 4.3 Check-out Constraints
- **Prerequisite:** Check-out requires an existing attendance in `PRESENT` or `LATE` state.
- **No Early / Redundant Check-out:** Calling check-out on an assignment with no check-in returns HTTP 422 `CHECKOUT_WITHOUT_CHECKIN`.
- **Terminal State:** Calling check-out on `COMPLETED` returns HTTP 422 `ATTENDANCE_ALREADY_COMPLETED`.
- **Server-Generated Timestamps:** Clients NEVER provide timestamps; the backend sets `checkInAt = Instant.now()` and `checkOutAt = Instant.now()`.

### 4.4 Overnight Shift Handling
- Shifts crossing midnight (e.g., `22:00 -> 06:00` next day) are evaluated using monotonic UTC `Instant` values.
- Check-in window: `21:45 UTC` to `06:00 UTC` next day.
- Midnight transitions cause zero date confusion because all calculations rely directly on absolute UTC timeline points.

---

## 5. Automated Absence Detection Strategy

### 5.1 Decision: Persistent Scheduled Absence Records
We use a **Spring `@Scheduled` job** that queries for missed shifts and inserts `ABSENT` records into the database.

**Rationale:**
1. **Query & Filter Performance:** Searching for absent staff or building attendance reports becomes a standard SQL indexed query (`status = 'ABSENT'`) without dynamic joins or synthesized data.
2. **Auditability:** Absence creation is logged with exact UTC creation timestamps.
3. **Idempotence:** The unique constraint on `shift_assignment_id` and the query predicate (`NOT EXISTS (SELECT 1 FROM attendance WHERE shift_assignment_id = sa.id)`) guarantee safe execution without duplicates or race conditions.

### 5.2 Scheduler Mechanics
- Runs every 5 minutes (`@Scheduled(cron = "0 */5 * * * *")`).
- Batch window: Finds `ShiftAssignment`s where `shift.status = 'PUBLISHED'`, `shift.endTime <= now`, and no attendance record exists.
- Inserts `Attendance` with `status = ABSENT`, `isLate = false`, `checkInAt = null`, `checkOutAt = null`.
- Transactional and wrapped in a retry/error-safe block.

---

## 6. Concurrency & Race Condition Analysis

### 6.1 Concurrent Check-in Attempts
- **Scenario:** Rapid double-clicking or malicious parallel requests attempting to check in twice.
- **Mitigation:**
  1. Unique database constraint `uk_attendance_shift_assignment(shift_assignment_id)`.
  2. Transactional validation: `attendanceRepository.existsByShiftAssignmentId(assignmentId)`.
  3. Spring Data `DataIntegrityViolationException` mapping to `ConflictException` (HTTP 409).

### 6.2 Concurrent Check-out Attempts
- **Mitigation:** JPA `@Version` optimistic locking on the `Attendance` entity. The first check-out updates the status to `COMPLETED`; the concurrent request either detects `status == COMPLETED` or encounters an optimistic locking failure.

---

## 7. Database Schema & Indexes

### Table: `attendance`
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_assignment_id UUID NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL,
    is_late BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_attendance_shift_assignment FOREIGN KEY (shift_assignment_id) REFERENCES shift_assignments (id) ON DELETE CASCADE,
    CONSTRAINT uk_attendance_shift_assignment UNIQUE (shift_assignment_id),
    CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT', 'LATE', 'COMPLETED', 'ABSENT')),
    CONSTRAINT chk_attendance_timestamps CHECK (
        (check_out_at IS NULL) OR 
        (check_in_at IS NULL) OR 
        (check_out_at >= check_in_at)
    )
);

CREATE INDEX idx_attendance_shift_assignment ON attendance (shift_assignment_id);
CREATE INDEX idx_attendance_status ON attendance (status);
CREATE INDEX idx_attendance_check_in_at ON attendance (check_in_at);
```

---

## 8. Authorization Matrix

| Operation | Endpoint | STAFF | MANAGER | OWNER |
|---|---|---|---|---|
| Self Check-In | `POST /v1/attendance/{assignmentId}/check-in` | ✅ Own assignment | ❌ | ❌ |
| Self Check-Out | `POST /v1/attendance/{assignmentId}/check-out` | ✅ Own assignment | ❌ | ❌ |
| View Own Attendance | `GET /v1/attendance/my` | ✅ Own records | ✅ Own records | ✅ Own records |
| View Branch Attendance | `GET /v1/branches/{branchId}/attendance` | ❌ | ✅ Own branch only | ✅ All branches |
| View Attendance Detail | `GET /v1/attendance/{id}` | ✅ If self | ✅ If same branch | ✅ Global |

---

## 9. REST API Contract

### 9.1 Check-In
- **Endpoint:** `POST /api/v1/attendance/{assignmentId}/check-in`
- **Headers:** `Authorization: Bearer <staff_jwt>`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "shiftAssignmentId": "uuid",
    "shiftId": "uuid",
    "shiftName": "Morning Shift",
    "branchId": "uuid",
    "branchName": "Alpha Branch",
    "userId": "uuid",
    "userName": "Staff Alice",
    "shiftStartTime": "2026-10-10T08:00:00Z",
    "shiftEndTime": "2026-10-10T16:00:00Z",
    "checkInAt": "2026-10-10T08:02:15Z",
    "checkOutAt": null,
    "status": "LATE",
    "late": true,
    "overnight": false,
    "createdAt": "2026-10-10T08:02:15Z",
    "updatedAt": "2026-10-10T08:02:15Z"
  },
  "message": "Checked in successfully"
}
```

### 9.2 Check-Out
- **Endpoint:** `POST /api/v1/attendance/{assignmentId}/check-out`
- **Headers:** `Authorization: Bearer <staff_jwt>`
- **Response (200 OK):** Status becomes `COMPLETED`, `checkOutAt` populated.

### 9.3 Staff Attendance History
- **Endpoint:** `GET /api/v1/attendance/my?startDate=2026-10-01T00:00:00Z&endDate=2026-10-31T23:59:59Z`
- **Response (200 OK):** List of attendance records for authenticated staff member.

### 9.4 Branch Attendance Overview
- **Endpoint:** `GET /api/v1/branches/{branchId}/attendance?startDate=...&endDate=...&status=...`
- **Headers:** `Authorization: Bearer <manager_or_owner_jwt>`
- **Response (200 OK):** List of attendance records for the branch.

---

## 10. Test Coverage Matrix

1. `testCheckIn_NormalOnTime_MarkedPresent`
2. `testCheckIn_EarlyWithin15Minutes_MarkedPresent`
3. `testCheckIn_TooEarly_Rejected422`
4. `testCheckIn_LateAfterStart_MarkedLate`
5. `testCheckIn_AfterShiftEnded_Rejected422`
6. `testCheckIn_Duplicate_Rejected409`
7. `testCheckIn_AnotherStaffAssignment_Rejected403`
8. `testCheckIn_CancelledShift_Rejected422`
9. `testCheckIn_DraftShift_Rejected422`
10. `testCheckIn_OvernightShift_Success`
11. `testCheckOut_AfterCheckIn_MarkedCompleted`
12. `testCheckOut_WithoutCheckIn_Rejected422`
13. `testCheckOut_Duplicate_Rejected422`
14. `testStaffCannotAccessOtherStaffAttendance_Rejected403`
15. `testManagerBranchAccess_OwnBranchSuccess`
16. `testManagerBranchAccess_OtherBranchForbidden`
17. `testOwnerBranchAccess_CrossBranchSuccess`
18. `testAbsenceScheduler_DetectsUncheckedShifts_MarksAbsent`
19. `testAbsenceScheduler_IdempotentOnRepeatedRuns`
20. `testConcurrentCheckIn_DatabaseConstraintEnforced`
