package com.shiftops.handover.repository;

import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, UUID> {

    Optional<ShiftHandover> findByShiftId(UUID shiftId);

    boolean existsByShiftId(UUID shiftId);

    @Query("SELECT h FROM ShiftHandover h " +
            "LEFT JOIN FETCH h.items i " +
            "LEFT JOIN FETCH i.issue " +
            "LEFT JOIN FETCH h.shift s " +
            "LEFT JOIN FETCH s.branch " +
            "LEFT JOIN FETCH h.submittedBy " +
            "LEFT JOIN FETCH h.acknowledgedBy " +
            "WHERE h.id = :id")
    Optional<ShiftHandover> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT h FROM ShiftHandover h " +
            "LEFT JOIN FETCH h.items i " +
            "LEFT JOIN FETCH i.issue " +
            "LEFT JOIN FETCH h.shift s " +
            "LEFT JOIN FETCH s.branch " +
            "LEFT JOIN FETCH h.submittedBy " +
            "LEFT JOIN FETCH h.acknowledgedBy " +
            "WHERE h.shift.id = :shiftId")
    Optional<ShiftHandover> findByShiftIdWithDetails(@Param("shiftId") UUID shiftId);

    @Query("SELECT h FROM ShiftHandover h " +
            "WHERE h.branch.id = :branchId " +
            "AND h.status IN :statuses " +
            "ORDER BY h.shift.endTime DESC, h.createdAt DESC")
    List<ShiftHandover> findLatestBranchHandovers(
            @Param("branchId") UUID branchId,
            @Param("statuses") Collection<HandoverStatus> statuses,
            Pageable pageable);

    Page<ShiftHandover> findByBranchId(UUID branchId, Pageable pageable);

    Page<ShiftHandover> findByBranchIdAndStatus(UUID branchId, HandoverStatus status, Pageable pageable);
}
