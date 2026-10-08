# Phase 7 — Shift Handover Design Document

## 1. Executive Summary & Core Business Purpose
In 24/7 or multi-shift operational businesses (cafes, retail stores, warehouses, healthcare facilities), daily operations transition between distinct teams of staff. Information loss between consecutive shifts leads to dropped tasks, unaddressed customer/equipment issues, duplicated effort, and operational friction.

**Shift Handover** establishes a structured, auditable mechanism to transfer operational context from an outgoing shift to an incoming shift.
- Outgoing staff summarize completed accomplishments, highlight pending work, flag unresolved operational issues, and leave critical notes.
- Incoming staff (and branch management) inspect the outgoing shift's handover, acknowledge receipt, and seamlessly resume unfinished work.

---

## 2. Domain Model & Entity Architecture

```
Shift (1) ── (0..1) ShiftHandover (1) ── (0..*) HandoverItem
                         │
                         └── (0..1) Issue (Optional reference per item)
```

### 2.1 `ShiftHandover`
Represents the operational debrief record for a single work shift.

| Field | Type | Constraints / Nullability | Description |
|---|---|---|---|
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Unique handover identifier. |
| `shift` | `Shift` (ManyToOne) | `NOT NULL`, `UNIQUE` | The shift this handover belongs to. Exactly one handover per shift. |
| `branch` | `Branch` (ManyToOne) | `NOT NULL` | The branch where the shift occurred (denormalized for query performance & indexing). |
| `status` | `HandoverStatus` (Enum) | `NOT NULL`, default `DRAFT` | Lifecycle state: `DRAFT`, `SUBMITTED`, `ACKNOWLEDGED`. |
| `notes` | `String` | Optional, `VARCHAR(2000)` | General operational remarks or instructions from the outgoing team. |
| `submittedBy` | `User` (ManyToOne) | Nullable until submission | The staff member who finalized and submitted the handover. |
| `submittedAt` | `Instant` | Nullable until submission | UTC timestamp when the handover was submitted. |
| `acknowledgedBy`| `User` (ManyToOne) | Nullable until acknowledgement| The staff member or manager who acknowledged the handover. |
| `acknowledgedAt`| `Instant` | Nullable until acknowledgement| UTC timestamp of acknowledgement. |
| `acknowledgementNotes` | `String` | Optional, `VARCHAR(1000)` | Optional response remarks left upon acknowledgement. |
| `items` | `List<HandoverItem>` | OneToMany, cascade ALL | Structured operational points. |
| `version` | `Long` | `NOT NULL`, default `0` | Optimistic locking counter. |
| `createdAt` | `Instant` | `NOT NULL` | Audit creation timestamp. |
| `updatedAt` | `Instant` | `NOT NULL` | Audit update timestamp. |

### 2.2 `HandoverItem`
A granular operational line item within a handover.

| Field | Type | Constraints / Nullability | Description |
|---|---|---|---|
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Unique line item identifier. |
| `handover` | `ShiftHandover` (ManyToOne) | `NOT NULL`, `ON DELETE CASCADE` | Parent handover record. |
| `type` | `HandoverItemType` (Enum) | `NOT NULL` | Category: `COMPLETED`, `PENDING`, `ISSUE`, `NOTE`. |
| `content` | `String` | `NOT NULL`, `VARCHAR(500)` | Operational detail text. |
| `issue` | `Issue` (ManyToOne) | Optional (`NULL` allowed) | Reference to a specific operational issue in the branch. |
| `orderIndex` | `int` | `NOT NULL`, default `0` | Display ordering index. |
| `createdAt` | `Instant` | `NOT NULL` | Audit timestamp. |

### 2.3 Enums
1. **`HandoverStatus`**:
   - `DRAFT`: Initial draft created by shift staff; editable by assigned staff.
   - `SUBMITTED`: Finalized and submitted by shift staff; locked from further editing. Visible to incoming shift and management.
   - `ACKNOWLEDGED`: Formally acknowledged by the incoming shift or manager; permanently immutable historical archive.

2. **`HandoverItemType`**:
   - `COMPLETED`: Work, checklists, or milestones accomplished during the shift (e.g., "Deep cleaned refrigeration unit").
   - `PENDING`: Work started or planned that remains incomplete (e.g., "Mid-day inventory count skipped due to rush").
   - `ISSUE`: Operational impediments or defects requiring attention (e.g., "Espresso grinder #2 jamming"). Can link to an `Issue` entity.
   - `NOTE`: Informational announcements, customer notices, or vendor expectations (e.g., "Pastry vendor delivery delayed to 17:30").

---

## 3. Lifecycle & State Machine

```
              submit()                      acknowledge()
  [ DRAFT ] ────────────> [ SUBMITTED ] ─────────────────────> [ ACKNOWLEDGED ]
     │                         │
     │ edit()                  │ (Read-only for all)
     ▼                         ▼
  (In-Place Updates)      (Immutable Content)
```

### State Machine Rules:
1. **Creation:** A shift starts with no handover. Any staff member assigned to the shift (or manager) can initialize a `DRAFT` handover. If a `DRAFT` already exists for the shift, subsequent creation calls return the existing draft (idempotent initialization).
2. **Editing:** Only handovers in `DRAFT` status may have their `notes` or `items` edited. Once in `SUBMITTED` or `ACKNOWLEDGED` status, edits are strictly rejected with HTTP 400 (`INVALID_HANDOVER_STATE`).
3. **Submission (`DRAFT` → `SUBMITTED`):**
   - Performed by an assigned staff member of the shift (or manager).
   - Transitions state to `SUBMITTED`.
   - Records `submittedBy` and `submittedAt`.
4. **Acknowledgement (`SUBMITTED` → `ACKNOWLEDGED`):**
   - Performed by incoming staff (staff in the branch with shifts starting at or after the handed-over shift), branch Managers, or Owners.
   - Transitions state to `ACKNOWLEDGED`.
   - Records `acknowledgedBy`, `acknowledgedAt`, and optional `acknowledgementNotes`.
5. **Immutability:** Once `ACKNOWLEDGED`, no modifications or state changes are permitted.

---

## 4. Derived Data vs. Persisted Data

To avoid data anomalies, synchronization delays, and redundant database storage, **derived operational statistics are computed at query time** rather than duplicated in the database:

| Category | Information | Storage Strategy | Calculation Method |
|---|---|---|---|
| **Derived** | Total tasks in shift | Dynamic Query | `taskRepository.countByShiftAssignmentShiftId(shiftId)` |
| **Derived** | Completed tasks count | Dynamic Query | `taskRepository.countByShiftAssignmentShiftIdAndStatus(shiftId, COMPLETED)` |
| **Derived** | Pending tasks count | Dynamic Query | `taskRepository.countByShiftAssignmentShiftIdAndStatusNot(shiftId, COMPLETED)` |
| **Derived** | Open branch issues count | Dynamic Query | `issueRepository.countByBranchIdAndStatusIn(branchId, [OPEN, ASSIGNED, IN_PROGRESS])` |
| **Derived** | Staff attendance summary | Dynamic Query | `attendanceRepository.findByShiftAssignmentShiftId(shiftId)` |
| **Persisted**| Human operational notes | Persisted | `shift_handovers.notes` |
| **Persisted**| Granular operational items | Persisted | `handover_items` rows (`type`, `content`, `issue_id`) |
| **Persisted**| Audit trail | Persisted | `submitted_by_id`, `submitted_at`, `acknowledged_by_id`, `acknowledged_at` |

---

## 5. Authorization & Multi-Tenancy Matrix

| Role | Branch Scope | Actions Permitted |
|---|---|---|
| **STAFF** | Assigned Branch | - Can create & edit `DRAFT` handover for shifts they are assigned to.<br>- Can submit handover for their assigned shift.<br>- Can view submitted handovers for their branch (especially the previous shift).<br>- Can acknowledge previous shift's handover if working next/current shift.<br>- **Cannot** edit handovers for shifts they are not assigned to.<br>- **Cannot** access handovers from other branches. |
| **MANAGER** | Assigned Branch | - Can view all handovers within their branch.<br>- Can create/edit/submit draft handovers if covering for staff.<br>- Can acknowledge any submitted handover in their branch.<br>- **Cannot** access handovers of other branches. |
| **OWNER** | Global (All Branches) | - Can view all handovers across all branches.<br>- Can acknowledge any submitted handover across all branches. |

---

## 6. Edge Cases & Invariants

1. **Cancelled Shifts:**
   - A handover cannot be initiated or submitted for a shift with status `CANCELLED`. Returns HTTP 400 `SHIFT_CANCELLED`.
2. **Duplicate Handovers:**
   - Enforced by database unique constraint `UNIQUE (shift_id)`. Concurrent create requests are protected by database constraint violation handling, returning the existing handover.
3. **Staff Removal Post-Handover:**
   - If a staff member who submitted or contributed to a handover is subsequently removed from the shift assignment or deactivated in the company, `submitted_by_id` retains the user ID. The historical handover record remains intact and readable.
4. **Inactive Staff Access:**
   - Deactivated staff cannot authenticate to create or acknowledge handovers. Historical handovers created by inactive staff remain fully readable by managers and owners.
5. **Concurrent Edit/Submit Race:**
   - Both `ShiftHandover` and `HandoverItem` mutations utilize Spring `@Transactional` and `@Version` optimistic locking. If staff A edits while staff B submits, the later transaction detects version mismatch and returns HTTP 409 `CONCURRENT_MODIFICATION`.

---

## 7. Database Schema & Indexes (`V7__create_shift_handovers.sql`)

```sql
-- 1. shift_handovers
CREATE TABLE shift_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes VARCHAR(2000),
    submitted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgement_notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shift_handover_shift UNIQUE (shift_id),
    CONSTRAINT chk_handover_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'))
);

CREATE INDEX idx_shift_handovers_branch_id ON shift_handovers(branch_id);
CREATE INDEX idx_shift_handovers_status ON shift_handovers(status);
CREATE INDEX idx_shift_handovers_created_at ON shift_handovers(created_at);

-- 2. handover_items
CREATE TABLE handover_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handover_id UUID NOT NULL REFERENCES shift_handovers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    content VARCHAR(500) NOT NULL,
    issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_handover_item_type CHECK (type IN ('COMPLETED', 'PENDING', 'ISSUE', 'NOTE'))
);

CREATE INDEX idx_handover_items_handover_id ON handover_items(handover_id);
CREATE INDEX idx_handover_items_issue_id ON handover_items(issue_id);
```

---

## 8. REST API Specifications

All endpoints are standardized under `/api/v1` returning `ApiResponse<T>`:

### 1. Create or Get Draft Handover for Shift
- **`POST /api/v1/shifts/{shiftId}/handover`**
- **Auth:** Assigned Staff, Manager, Owner.
- **Request Body:** Optional initial notes and items.
- **Response:** `ApiResponse<ShiftHandoverResponse>` (returns existing draft if already created).

### 2. Get Handover for Shift
- **`GET /api/v1/shifts/{shiftId}/handover`**
- **Auth:** Branch Staff, Manager, Owner.
- **Response:** `ApiResponse<ShiftHandoverResponse>` including derived task summary and open issue counts.

### 3. Get Latest Branch Handover
- **`GET /api/v1/branches/{branchId}/handovers/latest`**
- **Auth:** Branch Staff, Manager, Owner.
- **Query Params:** Optional `status` (default `SUBMITTED,ACKNOWLEDGED`).
- **Response:** `ApiResponse<ShiftHandoverResponse>` representing the most recent operational handover for incoming teams.

### 4. List Branch Handovers
- **`GET /api/v1/branches/{branchId}/handovers`**
- **Auth:** Manager, Owner.
- **Query Params:** `status`, `page`, `size`.
- **Response:** `ApiResponse<PagedResponse<ShiftHandoverResponse>>`.

### 5. Update Draft Handover
- **`PUT /api/v1/handovers/{id}`**
- **Auth:** Assigned Staff, Manager.
- **Request Body:** `UpdateHandoverRequest(notes, items)`
- **Response:** `ApiResponse<ShiftHandoverResponse>`.
- **Errors:** HTTP 400 if status is not `DRAFT`. HTTP 409 if version conflict.

### 6. Submit Handover
- **`PATCH /api/v1/handovers/{id}/submit`**
- **Auth:** Assigned Staff, Manager.
- **Response:** `ApiResponse<ShiftHandoverResponse>`.
- **Behavior:** Locks handover into `SUBMITTED`, records `submittedBy` and `submittedAt`.

### 7. Acknowledge Handover
- **`PATCH /api/v1/handovers/{id}/acknowledge`**
- **Auth:** Branch Staff (next shift), Manager, Owner.
- **Request Body:** `AcknowledgeHandoverRequest(notes)`.
- **Response:** `ApiResponse<ShiftHandoverResponse>`.
- **Behavior:** Sets status to `ACKNOWLEDGED`, permanently locks record.

---

## 9. Frontend Experience Architecture

The frontend integrates the handover experience directly into the operational day:

1. **Staff Shift View:**
   - Shows active shift overview with real-time derived counters:
     - `Completed Tasks` vs `Pending Tasks`
     - `Unresolved Branch Issues`
   - **Outgoing Shift Experience:** A "Handover Debrief" drawer/card where staff add operational items (`COMPLETED`, `PENDING`, `ISSUE`, `NOTE`) and submit the handover at the end of their shift.
   - **Incoming Shift Experience:** A prominent "Previous Shift Handover" banner on the Dashboard / Shifts page displaying the outgoing shift's notes and items with a one-click **"Acknowledge Handover"** action.
2. **Manager Oversight:**
   - Dedicated Handover History tab / section in Branch Operations showing all shift transitions, status badges, submitted by, and acknowledged by audit trails.
