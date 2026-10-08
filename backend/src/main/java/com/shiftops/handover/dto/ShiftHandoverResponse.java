package com.shiftops.handover.dto;

import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import lombok.Builder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record ShiftHandoverResponse(
        UUID id,
        UUID shiftId,
        String shiftName,
        Instant shiftStartTime,
        Instant shiftEndTime,
        UUID branchId,
        String branchName,
        HandoverStatus status,
        String notes,
        UUID submittedById,
        String submittedByName,
        Instant submittedAt,
        UUID acknowledgedById,
        String acknowledgedByName,
        Instant acknowledgedAt,
        String acknowledgementNotes,
        List<HandoverItemResponse> items,
        HandoverDerivedSummary summary,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {
    public static ShiftHandoverResponse fromEntity(ShiftHandover handover, HandoverDerivedSummary summary) {
        List<HandoverItemResponse> itemResponses = handover.getItems() != null
                ? handover.getItems().stream()
                .map(HandoverItemResponse::fromEntity)
                .toList()
                : Collections.emptyList();

        UUID submittedById = handover.getSubmittedBy() != null ? handover.getSubmittedBy().getId() : null;
        String submittedByName = handover.getSubmittedBy() != null ? handover.getSubmittedBy().getFullName() : null;

        UUID acknowledgedById = handover.getAcknowledgedBy() != null ? handover.getAcknowledgedBy().getId() : null;
        String acknowledgedByName = handover.getAcknowledgedBy() != null ? handover.getAcknowledgedBy().getFullName() : null;

        return ShiftHandoverResponse.builder()
                .id(handover.getId())
                .shiftId(handover.getShift().getId())
                .shiftName(handover.getShift().getName())
                .shiftStartTime(handover.getShift().getStartTime())
                .shiftEndTime(handover.getShift().getEndTime())
                .branchId(handover.getBranch().getId())
                .branchName(handover.getBranch().getName())
                .status(handover.getStatus())
                .notes(handover.getNotes())
                .submittedById(submittedById)
                .submittedByName(submittedByName)
                .submittedAt(handover.getSubmittedAt())
                .acknowledgedById(acknowledgedById)
                .acknowledgedByName(acknowledgedByName)
                .acknowledgedAt(handover.getAcknowledgedAt())
                .acknowledgementNotes(handover.getAcknowledgementNotes())
                .items(itemResponses)
                .summary(summary)
                .version(handover.getVersion())
                .createdAt(handover.getCreatedAt())
                .updatedAt(handover.getUpdatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getShiftId() {
        return shiftId();
    }

    public String getShiftName() {
        return shiftName();
    }

    public Instant getShiftStartTime() {
        return shiftStartTime();
    }

    public Instant getShiftEndTime() {
        return shiftEndTime();
    }

    public UUID getBranchId() {
        return branchId();
    }

    public String getBranchName() {
        return branchName();
    }

    public HandoverStatus getStatus() {
        return status();
    }

    public String getNotes() {
        return notes();
    }

    public UUID getSubmittedById() {
        return submittedById();
    }

    public String getSubmittedByName() {
        return submittedByName();
    }

    public Instant getSubmittedAt() {
        return submittedAt();
    }

    public UUID getAcknowledgedById() {
        return acknowledgedById();
    }

    public String getAcknowledgedByName() {
        return acknowledgedByName();
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt();
    }

    public String getAcknowledgementNotes() {
        return acknowledgementNotes();
    }

    public List<HandoverItemResponse> getItems() {
        return items();
    }

    public HandoverDerivedSummary getSummary() {
        return summary();
    }

    public Long getVersion() {
        return version();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }

    public Instant getUpdatedAt() {
        return updatedAt();
    }
}
