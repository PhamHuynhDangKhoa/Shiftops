package com.shiftops.shift.entity;

import com.shiftops.common.entity.BaseEntity;
import com.shiftops.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "shift_assignments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shift_assignments_shift_user", columnNames = {"shift_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();
}
