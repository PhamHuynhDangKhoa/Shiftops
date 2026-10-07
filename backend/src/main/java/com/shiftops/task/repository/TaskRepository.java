package com.shiftops.task.repository;

import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("""
            SELECT t FROM Task t
            JOIN FETCH t.shiftAssignment sa
            JOIN FETCH sa.shift s
            JOIN FETCH s.branch b
            JOIN FETCH sa.user u
            LEFT JOIN FETCH t.templateItem ti
            LEFT JOIN FETCH t.completedBy cb
            WHERE t.id = :id
            """)
    Optional<Task> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT t FROM Task t
            JOIN FETCH t.shiftAssignment sa
            JOIN FETCH sa.shift s
            JOIN FETCH s.branch b
            JOIN FETCH sa.user u
            LEFT JOIN FETCH t.templateItem ti
            LEFT JOIN FETCH t.completedBy cb
            WHERE sa.user.id = :userId
            AND (:shiftId IS NULL OR s.id = :shiftId)
            AND (:status IS NULL OR t.status = :status)
            ORDER BY t.createdAt ASC
            """)
    List<Task> findMyTasks(
            @Param("userId") UUID userId,
            @Param("shiftId") UUID shiftId,
            @Param("status") TaskStatus status);

    @Query("""
            SELECT t FROM Task t
            JOIN FETCH t.shiftAssignment sa
            JOIN FETCH sa.shift s
            JOIN FETCH s.branch b
            JOIN FETCH sa.user u
            LEFT JOIN FETCH t.templateItem ti
            LEFT JOIN FETCH t.completedBy cb
            WHERE b.id = :branchId
            AND (:shiftId IS NULL OR s.id = :shiftId)
            AND (:staffId IS NULL OR u.id = :staffId)
            AND (:status IS NULL OR t.status = :status)
            AND s.startTime < :endDate
            AND s.endTime > :startDate
            ORDER BY s.startTime DESC, t.createdAt ASC
            """)
    List<Task> findBranchTasks(
            @Param("branchId") UUID branchId,
            @Param("shiftId") UUID shiftId,
            @Param("staffId") UUID staffId,
            @Param("status") TaskStatus status,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("""
            SELECT t FROM Task t
            JOIN FETCH t.shiftAssignment sa
            JOIN FETCH sa.shift s
            JOIN FETCH s.branch b
            JOIN FETCH sa.user u
            LEFT JOIN FETCH t.templateItem ti
            LEFT JOIN FETCH t.completedBy cb
            WHERE s.id = :shiftId
            ORDER BY u.fullName ASC, t.createdAt ASC
            """)
    List<Task> findByShiftId(@Param("shiftId") UUID shiftId);

    List<Task> findByShiftAssignmentId(UUID shiftAssignmentId);

    boolean existsByShiftAssignmentIdAndTemplateItemId(UUID shiftAssignmentId, UUID templateItemId);

    long countByShiftAssignmentIdAndStatus(UUID shiftAssignmentId, TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.shiftAssignment.shift.id = :shiftId AND t.status IN :statuses")
    List<Task> findByShiftIdAndStatusIn(@Param("shiftId") UUID shiftId, @Param("statuses") Collection<TaskStatus> statuses);
}
