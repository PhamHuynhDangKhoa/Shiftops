package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueAttachment;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record IssueAttachmentResponse(
        UUID id,
        UUID issueId,
        String fileName,
        String originalFileName,
        String contentType,
        long fileSize,
        String downloadUrl,
        UUID uploadedById,
        String uploadedByName,
        Instant createdAt
) {
    public static IssueAttachmentResponse fromEntity(IssueAttachment attachment) {
        UUID issueId = attachment.getIssue() != null ? attachment.getIssue().getId() : null;
        return IssueAttachmentResponse.builder()
                .id(attachment.getId())
                .issueId(issueId)
                .fileName(attachment.getFileName())
                .originalFileName(attachment.getOriginalFileName())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .downloadUrl("/v1/issues/" + issueId + "/attachments/" + attachment.getId() + "/file")
                .uploadedById(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getId() : null)
                .uploadedByName(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getFullName() : null)
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    public UUID getId() {
        return id();
    }

    public UUID getIssueId() {
        return issueId();
    }

    public String getFileName() {
        return fileName();
    }

    public String getOriginalFileName() {
        return originalFileName();
    }

    public String getContentType() {
        return contentType();
    }

    public long getFileSize() {
        return fileSize();
    }

    public String getDownloadUrl() {
        return downloadUrl();
    }

    public UUID getUploadedById() {
        return uploadedById();
    }

    public String getUploadedByName() {
        return uploadedByName();
    }

    public Instant getCreatedAt() {
        return createdAt();
    }
}
