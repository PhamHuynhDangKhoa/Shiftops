package com.shiftops.shift.entity;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ShiftStatus status = ShiftStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ShiftAssignment> assignments = new ArrayList<>();
}
