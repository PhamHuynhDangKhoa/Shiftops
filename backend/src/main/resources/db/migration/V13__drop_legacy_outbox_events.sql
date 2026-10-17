-- =============================================================================
-- Migration V13: Drop legacy custom outbox table in favor of Spring Modulith event_publication
-- =============================================================================

DROP TABLE IF EXISTS outbox_events CASCADE;
