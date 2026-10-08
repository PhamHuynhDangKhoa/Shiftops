-- =============================================================================
-- Migration V8: Create announcements and notifications tables
-- =============================================================================

-- 1. announcements
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
CREATE INDEX idx_announcements_created_by ON announcements(created_by_id);

-- 2. notifications
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
    CONSTRAINT chk_notification_reference_type CHECK (reference_type IS NULL OR reference_type IN (
        'SHIFT', 'TASK', 'ISSUE', 'HANDOVER', 'ANNOUNCEMENT'
    ))
);

CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, read_at);
CREATE INDEX idx_notifications_dedup ON notifications(recipient_id, type, reference_id);
