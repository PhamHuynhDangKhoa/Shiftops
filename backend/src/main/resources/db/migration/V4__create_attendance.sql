-- Phase 4: Attendance Management Migration

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
