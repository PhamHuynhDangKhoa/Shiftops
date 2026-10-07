package com.shiftops.shift.repository;

import com.shiftops.shift.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, UUID> {

    boolean existsByShiftIdAndUserId(UUID shiftId, UUID userId);

    Optional<ShiftAssignment> findByShiftIdAndUserId(UUID shiftId, UUID userId);

    void deleteByShiftIdAndUserId(UUID shiftId, UUID userId);

    @Query("SELECT COUNT(sa) FROM ShiftAssignment sa " +
           "JOIN sa.shift s " +
           "WHERE sa.user.id = :userId " +
           "AND s.id != :shiftId " +
           "AND s.status != com.shiftops.shift.entity.ShiftStatus.CANCELLED " +
           "AND s.startTime < :newEndTime " +
           "AND s.endTime > :newStartTime")
    long countOverlappingAssignments(
            @Param("userId") UUID userId,
            @Param("shiftId") UUID shiftId,
            @Param("newStartTime") Instant newStartTime,
            @Param("newEndTime") Instant newEndTime);
}
