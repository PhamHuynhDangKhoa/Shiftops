package com.shiftops.issue.repository;

import com.shiftops.issue.entity.IssueComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IssueCommentRepository extends JpaRepository<IssueComment, UUID> {

    @Query("SELECT c FROM IssueComment c JOIN FETCH c.author WHERE c.issue.id = :issueId ORDER BY c.createdAt ASC")
    List<IssueComment> findByIssueIdOrderByCreatedAtAsc(@Param("issueId") UUID issueId);
}
