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
}
