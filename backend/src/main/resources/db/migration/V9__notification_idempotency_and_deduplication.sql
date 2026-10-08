-- =============================================================================
-- Migration V9: Notification Idempotency, Deduplication & Email Lowercase Index
-- =============================================================================

-- 1. Add idempotency_key column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

-- 2. Clean up any pre-existing duplicate notifications prior to unique index creation
DELETE FROM notifications a USING notifications b
WHERE a.id > b.id
  AND a.recipient_id = b.recipient_id
  AND a.type = b.type
  AND a.reference_id = b.reference_id
  AND a.reference_id IS NOT NULL;

-- 3. Drop legacy non-unique index and create partial unique indexes
DROP INDEX IF EXISTS idx_notifications_dedup;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_idempotency_key
    ON notifications (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_recipient_type_ref
    ON notifications (recipient_id, type, reference_id)
    WHERE reference_id IS NOT NULL;

-- 4. Case-insensitive email uniqueness index for users table
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email_lower
    ON users (LOWER(email));
