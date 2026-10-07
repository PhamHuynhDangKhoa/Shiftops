package com.shiftops.attendance.repository;

import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    boolean existsByShiftAssignmentId(UUID shiftAssignmentId);

    Optional<Attendance> findByShiftAssignmentId(UUID shiftAssignmentId);

    @Query("SELECT a FROM Attendance a " +
           "JOIN FETCH a.shiftAssignment sa " +
           "JOIN FETCH sa.shift s " +
           "JOIN FETCH s.branch " +
           "JOIN FETCH sa.user u " +
           "WHERE a.id = :id")
    Optional<Attendance> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT a FROM Attendance a " +
           "JOIN FETCH a.shiftAssignment sa " +
           "JOIN FETCH sa.shift s " +
           "JOIN FETCH s.branch " +
           "JOIN FETCH sa.user u " +
           "WHERE sa.id = :shiftAssignmentId")
    Optional<Attendance> findByShiftAssignmentIdWithDetails(@Param("shiftAssignmentId") UUID shiftAssignmentId);

    @Query("SELECT a FROM Attendance a " +
           "JOIN FETCH a.shiftAssignment sa " +
           "JOIN FETCH sa.shift s " +
           "JOIN FETCH s.branch " +
           "JOIN FETCH sa.user u " +
           "WHERE sa.user.id = :userId " +
           "AND s.startTime < :endDate " +
           "AND s.endTime > :startDate " +
           "ORDER BY s.startTime DESC")
    List<Attendance> findByUserIdAndWindow(
            @Param("userId") UUID userId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT a FROM Attendance a " +
           "JOIN FETCH a.shiftAssignment sa " +
           "JOIN FETCH sa.shift s " +
           "JOIN FETCH s.branch " +
           "JOIN FETCH sa.user u " +
           "WHERE s.branch.id = :branchId " +
           "AND s.startTime < :endDate " +
           "AND s.endTime > :startDate " +
           "AND (:status IS NULL OR a.status = :status) " +
           "ORDER BY s.startTime DESC")
    List<Attendance> findByBranchAndWindow(
            @Param("branchId") UUID branchId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("status") AttendanceStatus status);
}
