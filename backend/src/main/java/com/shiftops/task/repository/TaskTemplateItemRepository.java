package com.shiftops.task.repository;

import com.shiftops.task.entity.TaskTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTemplateItemRepository extends JpaRepository<TaskTemplateItem, UUID> {

    List<TaskTemplateItem> findByTemplateIdOrderByOrderIndexAsc(UUID templateId);

    void deleteByTemplateId(UUID templateId);
}
