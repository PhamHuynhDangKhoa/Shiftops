package com.shiftops.issue.repository;

import com.shiftops.issue.entity.IssueAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IssueAttachmentRepository extends JpaRepository<IssueAttachment, UUID> {

    @Query("SELECT a FROM IssueAttachment a JOIN FETCH a.uploadedBy WHERE a.issue.id = :issueId ORDER BY a.createdAt ASC")
    List<IssueAttachment> findByIssueIdOrderByCreatedAtAsc(@Param("issueId") UUID issueId);
}
