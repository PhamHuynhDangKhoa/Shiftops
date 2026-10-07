package com.shiftops.shift.repository;

import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, UUID> {

    @Query("SELECT DISTINCT s FROM Shift s " +
           "LEFT JOIN FETCH s.branch " +
           "LEFT JOIN FETCH s.assignments a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.assignedBy " +
           "WHERE s.id = :id")
    Optional<Shift> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT DISTINCT s FROM Shift s " +
           "LEFT JOIN FETCH s.branch " +
           "LEFT JOIN FETCH s.assignments a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.assignedBy " +
           "WHERE s.branch.id = :branchId " +
           "AND s.startTime < :endDate " +
           "AND s.endTime > :startDate " +
           "ORDER BY s.startTime ASC")
    List<Shift> findByBranchAndWindow(
            @Param("branchId") UUID branchId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT DISTINCT s FROM Shift s " +
           "LEFT JOIN FETCH s.branch " +
           "LEFT JOIN FETCH s.assignments a " +
           "LEFT JOIN FETCH a.user " +
           "LEFT JOIN FETCH a.assignedBy " +
           "WHERE s.branch.id = :branchId " +
           "AND s.status = :status " +
           "AND s.startTime < :endDate " +
           "AND s.endTime > :startDate " +
           "ORDER BY s.startTime ASC")
    List<Shift> findByBranchAndStatusAndWindow(
            @Param("branchId") UUID branchId,
            @Param("status") ShiftStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT DISTINCT s FROM Shift s " +
           "JOIN s.assignments a " +
           "LEFT JOIN FETCH s.branch " +
           "LEFT JOIN FETCH s.assignments allA " +
           "LEFT JOIN FETCH allA.user " +
           "LEFT JOIN FETCH allA.assignedBy " +
           "WHERE a.user.id = :userId " +
           "AND s.status = :status " +
           "AND s.startTime < :endDate " +
           "AND s.endTime > :startDate " +
           "ORDER BY s.startTime ASC")
    List<Shift> findUserShiftsByStatusAndWindow(
            @Param("userId") UUID userId,
            @Param("status") ShiftStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);
}
