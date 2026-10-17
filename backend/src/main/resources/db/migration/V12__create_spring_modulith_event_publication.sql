-- =============================================================================
-- Migration V12: Create Spring Modulith Event Publication Registry table
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_publication (
    id UUID NOT NULL PRIMARY KEY,
    listener_id VARCHAR(512) NOT NULL,
    event_type VARCHAR(512) NOT NULL,
    serialized_event TEXT NOT NULL,
    publication_date TIMESTAMPTZ NOT NULL,
    completion_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_publication_pub_date ON event_publication (publication_date);
CREATE INDEX IF NOT EXISTS idx_event_publication_comp_date ON event_publication (completion_date);
