package com.shiftops.issue.dto;

import com.shiftops.issue.entity.IssueAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueAttachmentResponse {

    private UUID id;
    private UUID issueId;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private long fileSize;
    private String downloadUrl;
    private UUID uploadedById;
    private String uploadedByName;
    private Instant createdAt;

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
}
