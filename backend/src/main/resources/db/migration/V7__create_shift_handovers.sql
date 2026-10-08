-- =============================================================================
-- Migration V7: Create shift_handovers and handover_items tables
-- =============================================================================

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
CREATE INDEX idx_shift_handovers_submitted_at ON shift_handovers(submitted_at);

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
