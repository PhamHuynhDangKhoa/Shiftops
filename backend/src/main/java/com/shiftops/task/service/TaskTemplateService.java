package com.shiftops.task.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.user.service.BranchAccessService;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.task.dto.*;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskTemplate;
import com.shiftops.task.entity.TaskTemplateItem;
import com.shiftops.task.repository.TaskTemplateItemRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskTemplateService {

    private final TaskTemplateRepository templateRepository;
    private final TaskTemplateItemRepository itemRepository;
    private final BranchRepository branchRepository;
    private final BranchAccessService branchAccessService;

    @Transactional
    public TaskTemplateResponse createTemplate(
            UUID branchId,
            CreateTaskTemplateRequest request,
            UserPrincipal principal) {

        branchAccessService.validateBranchAccess(principal, branchId);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        if (!branch.isActive()) {
            throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot create task template for an inactive branch");
        }

        String name = request.getName().trim();
        if (templateRepository.existsByBranchIdAndName(branchId, name)) {
            throw new ConflictException("Task template with name '" + name + "' already exists in this branch");
        }

        TaskTemplate template = TaskTemplate.builder()
                .branch(branch)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .isActive(true)
                .items(new ArrayList<>())
                .build();

        if (request.getItems() != null) {
            int defaultOrder = 0;
            for (CreateTaskTemplateItemRequest itemReq : request.getItems()) {
                TaskTemplateItem item = TaskTemplateItem.builder()
                        .template(template)
                        .title(itemReq.getTitle().trim())
                        .description(itemReq.getDescription() != null ? itemReq.getDescription().trim() : null)
                        .priority(itemReq.getPriority() != null ? itemReq.getPriority() : TaskPriority.NORMAL)
                        .orderIndex(itemReq.getOrderIndex() != 0 ? itemReq.getOrderIndex() : defaultOrder++)
                        .build();
                template.addItem(item);
            }
        }

        TaskTemplate saved = templateRepository.save(template);
        log.info("Created task template '{}' (id: {}) for branch {}", saved.getName(), saved.getId(), branch.getName());
        return TaskTemplateResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskTemplateResponse> getBranchTemplates(
            UUID branchId,
            Boolean activeOnly,
            UserPrincipal principal) {

        branchAccessService.validateBranchAccess(principal, branchId);

        List<TaskTemplate> templates;
        if (Boolean.TRUE.equals(activeOnly)) {
            templates = templateRepository.findByBranchIdAndIsActive(branchId, true);
        } else {
            templates = templateRepository.findByBranchId(branchId);
        }

        return templates.stream().map(TaskTemplateResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public TaskTemplateResponse getTemplateById(UUID templateId, UserPrincipal principal) {
        TaskTemplate template = templateRepository.findByIdWithItems(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskTemplate", "id", templateId));

        branchAccessService.validateBranchAccess(principal, template.getBranch().getId());
        return TaskTemplateResponse.fromEntity(template);
    }

    @Transactional
    public TaskTemplateResponse updateTemplate(
            UUID templateId,
            UpdateTaskTemplateRequest request,
            UserPrincipal principal) {

        TaskTemplate template = templateRepository.findByIdWithItems(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskTemplate", "id", templateId));

        UUID branchId = template.getBranch().getId();
        branchAccessService.validateBranchAccess(principal, branchId);

        String newName = request.getName().trim();
        if (templateRepository.existsByBranchIdAndNameAndIdNot(branchId, newName, templateId)) {
            throw new ConflictException("Task template with name '" + newName + "' already exists in this branch");
        }

        template.setName(newName);
        if (request.getDescription() != null) {
            template.setDescription(request.getDescription().trim());
        }
        if (request.getActive() != null) {
            template.setActive(request.getActive());
        }

        if (request.getItems() != null) {
            template.getItems().clear();
            int defaultOrder = 0;
            for (CreateTaskTemplateItemRequest itemReq : request.getItems()) {
                TaskTemplateItem item = TaskTemplateItem.builder()
                        .template(template)
                        .title(itemReq.getTitle().trim())
                        .description(itemReq.getDescription() != null ? itemReq.getDescription().trim() : null)
                        .priority(itemReq.getPriority() != null ? itemReq.getPriority() : TaskPriority.NORMAL)
                        .orderIndex(itemReq.getOrderIndex() != 0 ? itemReq.getOrderIndex() : defaultOrder++)
                        .build();
                template.addItem(item);
            }
        }

        TaskTemplate saved = templateRepository.save(template);
        log.info("Updated task template '{}' (id: {})", saved.getName(), saved.getId());
        return TaskTemplateResponse.fromEntity(saved);
    }

    @Transactional
    public TaskTemplateResponse updateTemplateStatus(
            UUID templateId,
            boolean active,
            UserPrincipal principal) {

        TaskTemplate template = templateRepository.findByIdWithItems(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskTemplate", "id", templateId));

        branchAccessService.validateBranchAccess(principal, template.getBranch().getId());

        template.setActive(active);
        TaskTemplate saved = templateRepository.save(template);
        log.info("Updated task template '{}' active status to {}", saved.getName(), active);
        return TaskTemplateResponse.fromEntity(saved);
    }
}
