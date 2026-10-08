package com.shiftops.branch.dto;

import com.shiftops.branch.entity.Branch;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record BranchResponse(
        UUID id,
        String name,
        String address,
        String timezone,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static BranchResponse fromEntity(Branch branch) {
        return BranchResponse.builder()
                .id(branch.getId())
                .name(branch.getName())
                .address(branch.getAddress())
                .timezone(branch.getTimezone())
                .active(branch.isActive())
                .createdAt(branch.getCreatedAt())
                .updatedAt(branch.getUpdatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public String getName() {
        return name();
    }

    public String getAddress() {
        return address();
    }

    public String getTimezone() {
        return timezone();
    }

    public boolean isActive() {
        return active();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
