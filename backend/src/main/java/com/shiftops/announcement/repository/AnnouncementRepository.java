package com.shiftops.announcement.repository;

import com.shiftops.announcement.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    @Query("SELECT a FROM Announcement a " +
            "LEFT JOIN FETCH a.branch " +
            "LEFT JOIN FETCH a.createdBy " +
            "LEFT JOIN FETCH a.targetShift " +
            "WHERE a.id = :id")
    Optional<Announcement> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT a FROM Announcement a " +
            "LEFT JOIN FETCH a.branch " +
            "LEFT JOIN FETCH a.createdBy " +
            "WHERE a.branch.id = :branchId " +
            "ORDER BY a.createdAt DESC")
    Page<Announcement> findByBranchIdOrderByCreatedAtDesc(@Param("branchId") UUID branchId, Pageable pageable);

    @Query("SELECT a FROM Announcement a " +
            "LEFT JOIN FETCH a.branch " +
            "LEFT JOIN FETCH a.createdBy " +
            "WHERE (a.branch.id = :branchId OR a.targetType = com.shiftops.announcement.entity.AnnouncementTargetType.ORGANIZATION) " +
            "AND a.publishedAt IS NOT NULL " +
            "AND (a.expiresAt IS NULL OR a.expiresAt > :now) " +
            "ORDER BY a.publishedAt DESC")
    List<Announcement> findActiveForBranch(
            @Param("branchId") UUID branchId,
            @Param("now") Instant now);

    @Query("SELECT a FROM Announcement a " +
            "LEFT JOIN FETCH a.branch " +
            "LEFT JOIN FETCH a.createdBy " +
            "WHERE a.targetType = com.shiftops.announcement.entity.AnnouncementTargetType.ORGANIZATION " +
            "AND a.publishedAt IS NOT NULL " +
            "AND (a.expiresAt IS NULL OR a.expiresAt > :now) " +
            "ORDER BY a.publishedAt DESC")
    List<Announcement> findActiveOrganizationWide(@Param("now") Instant now);
}
