package com.shiftops.handover.dto;

import com.shiftops.handover.entity.HandoverItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

@Builder
public record HandoverItemRequest(
        @NotNull(message = "Item type is required")
        HandoverItemType type,

        @NotBlank(message = "Content cannot be blank")
        @Size(max = 500, message = "Content cannot exceed 500 characters")
        String content,

        UUID issueId,

        int orderIndex
) {
    public HandoverItemType getType() {
        return type();
    }

    public String getContent() {
        return content();
    }

    public UUID getIssueId() {
        return issueId();
    }

    public int getOrderIndex() {
        return orderIndex();
    }
}
