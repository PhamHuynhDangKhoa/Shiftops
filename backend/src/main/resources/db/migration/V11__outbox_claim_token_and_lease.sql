-- =============================================================================
-- Migration V11: Add claim token and lease expiration to outbox_events
-- =============================================================================

ALTER TABLE outbox_events
    ADD COLUMN claim_token UUID,
    ADD COLUMN lease_expires_at TIMESTAMPTZ;

CREATE INDEX idx_outbox_processing_lease ON outbox_events (status, lease_expires_at) WHERE status = 'PROCESSING';
