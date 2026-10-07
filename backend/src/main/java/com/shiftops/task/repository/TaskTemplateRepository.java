package com.shiftops.task.repository;

import com.shiftops.task.entity.TaskTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, UUID> {

    @Query("SELECT t FROM TaskTemplate t LEFT JOIN FETCH t.items WHERE t.id = :id")
    Optional<TaskTemplate> findByIdWithItems(@Param("id") UUID id);

    List<TaskTemplate> findByBranchId(UUID branchId);

    List<TaskTemplate> findByBranchIdAndIsActive(UUID branchId, boolean isActive);

    boolean existsByBranchIdAndName(UUID branchId, String name);

    boolean existsByBranchIdAndNameAndIdNot(UUID branchId, String name, UUID id);
}
