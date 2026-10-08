package com.shiftops.issue.repository;

import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<Issue, UUID>, JpaSpecificationExecutor<Issue> {

    @Query("""
            SELECT i FROM Issue i
            JOIN FETCH i.branch b
            JOIN FETCH i.reportedBy r
            LEFT JOIN FETCH i.assignedTo a
            LEFT JOIN FETCH i.resolvedBy rb
            LEFT JOIN FETCH i.closedBy cb
            LEFT JOIN FETCH i.shiftAssignment sa
            LEFT JOIN FETCH i.task t
            WHERE i.id = :id
            """)
    Optional<Issue> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT DISTINCT i FROM Issue i
            JOIN FETCH i.branch b
            JOIN FETCH i.reportedBy r
            LEFT JOIN FETCH i.assignedTo a
            LEFT JOIN FETCH i.resolvedBy rb
            LEFT JOIN FETCH i.closedBy cb
            WHERE (r.id = :userId OR a.id = :userId)
            ORDER BY i.createdAt DESC
            """)
    List<Issue> findMyIssues(@Param("userId") UUID userId);

    @Query("""
            SELECT DISTINCT i FROM Issue i
            JOIN FETCH i.branch b
            JOIN FETCH i.reportedBy r
            LEFT JOIN FETCH i.assignedTo a
            WHERE b.id = :branchId
            ORDER BY i.createdAt DESC
            """)
    List<Issue> findByBranchIdOrderByCreatedAtDesc(@Param("branchId") UUID branchId);

    long countByBranchId(UUID branchId);

    long countByBranchIdAndStatus(UUID branchId, IssueStatus status);

    long countByBranchIdAndStatusIn(UUID branchId, java.util.Collection<IssueStatus> statuses);

    long countByBranchIdAndPriority(UUID branchId, IssuePriority priority);
}
