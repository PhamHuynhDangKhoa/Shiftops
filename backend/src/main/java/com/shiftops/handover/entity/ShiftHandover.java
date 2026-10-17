package com.shiftops.handover.entity;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.entity.BaseEntity;
import com.shiftops.shift.entity.Shift;
import com.shiftops.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shift_handovers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftHandover extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false, unique = true)
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private HandoverStatus status = HandoverStatus.DRAFT;

    @Column(length = 2000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by_id")
    private User acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "acknowledgement_notes", length = 1000)
    private String acknowledgementNotes;

    @Builder.Default
    @OneToMany(mappedBy = "handover", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, createdAt ASC")
    private List<HandoverItem> items = new ArrayList<>();

    public void addItem(HandoverItem item) {
        items.add(item);
        item.setHandover(this);
    }

    public void removeItem(HandoverItem item) {
        items.remove(item);
        item.setHandover(null);
    }

    public void clearItems() {
        for (HandoverItem item : new ArrayList<>(items)) {
            removeItem(item);
        }
    }

    // =========================================================================
    // Domain Business Methods (Expressive Ubiquitous Language)
    // =========================================================================

    public boolean isDraft() {
        return status == HandoverStatus.DRAFT;
    }

    public boolean isSubmitted() {
        return status == HandoverStatus.SUBMITTED;
    }

    public boolean isAcknowledged() {
        return status == HandoverStatus.ACKNOWLEDGED;
    }

    public void updateDraftNotes(String notes) {
        if (!isDraft()) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Only draft handovers can be updated. Current status: " + this.status);
        }
        if (this.shift != null && this.shift.isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_CANCELLED",
                    "Cannot modify handover for a cancelled shift");
        }
        this.notes = notes;
    }

    public void submit(User submitter, Instant submittedAt) {
        if (this.shift != null && this.shift.isCancelled()) {
            throw new com.shiftops.common.exception.BusinessRuleException("SHIFT_CANCELLED",
                    "Cannot submit handover for a cancelled shift");
        }
        if (!isDraft()) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Cannot submit handover in status: " + this.status);
        }
        this.status = HandoverStatus.SUBMITTED;
        this.submittedBy = submitter;
        this.submittedAt = submittedAt;
    }

    public void acknowledge(User acknowledger, String notes, Instant acknowledgedAt) {
        if (!isSubmitted()) {
            throw new com.shiftops.common.exception.BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Cannot acknowledge handover in status: " + this.status);
        }
        this.status = HandoverStatus.ACKNOWLEDGED;
        this.acknowledgedBy = acknowledger;
        this.acknowledgedAt = acknowledgedAt;
        if (notes != null) {
            this.acknowledgementNotes = notes;
        }
    }
}
