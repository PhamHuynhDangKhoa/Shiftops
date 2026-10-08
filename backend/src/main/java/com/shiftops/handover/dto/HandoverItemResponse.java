package com.shiftops.handover.dto;

import com.shiftops.handover.entity.HandoverItem;
import com.shiftops.handover.entity.HandoverItemType;
import com.shiftops.issue.entity.IssueStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record HandoverItemResponse(
        UUID id,
        UUID handoverId,
        HandoverItemType type,
        String content,
        UUID issueId,
        String issueTitle,
        IssueStatus issueStatus,
        int orderIndex,
        Instant createdAt
) {
    public static HandoverItemResponse fromEntity(HandoverItem item) {
        UUID issueId = item.getIssue() != null ? item.getIssue().getId() : null;
        String issueTitle = item.getIssue() != null ? item.getIssue().getTitle() : null;
        IssueStatus issueStatus = item.getIssue() != null ? item.getIssue().getStatus() : null;

        return HandoverItemResponse.builder()
                .id(item.getId())
                .handoverId(item.getHandover() != null ? item.getHandover().getId() : null)
                .type(item.getType())
                .content(item.getContent())
                .issueId(issueId)
                .issueTitle(issueTitle)
                .issueStatus(issueStatus)
                .orderIndex(item.getOrderIndex())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getHandoverId() {
        return handoverId();
    }

    public HandoverItemType getType() {
        return type();
    }

    public String getContent() {
        return content();
    }

    public UUID getIssueId() {
        return issueId();
    }

    public String getIssueTitle() {
        return issueTitle();
    }

    public IssueStatus getIssueStatus() {
        return issueStatus();
    }

    public int getOrderIndex() {
        return orderIndex();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }
}
