-- Phase 3: Tables for Shift Scheduling and Assignments

CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL,
    name VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_shifts_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE RESTRICT,
    CONSTRAINT chk_shifts_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_shifts_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_shifts_branch ON shifts (branch_id);
CREATE INDEX idx_shifts_status ON shifts (status);
CREATE INDEX idx_shifts_times ON shifts (start_time, end_time);
CREATE INDEX idx_shifts_branch_times ON shifts (branch_id, start_time, end_time);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL,
    user_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_shift_assignments_shift FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_shift_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uk_shift_assignments_shift_user UNIQUE (shift_id, user_id)
);

CREATE INDEX idx_shift_assignments_shift ON shift_assignments (shift_id);
CREATE INDEX idx_shift_assignments_user ON shift_assignments (user_id);
