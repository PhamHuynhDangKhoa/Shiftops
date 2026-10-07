package com.shiftops.task.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.user.service.BranchAccessService;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.task.dto.CreateTaskTemplateItemRequest;
import com.shiftops.task.dto.CreateTaskTemplateRequest;
import com.shiftops.task.dto.TaskTemplateResponse;
import com.shiftops.task.dto.UpdateTaskTemplateRequest;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskTemplate;
import com.shiftops.task.entity.TaskTemplateItem;
import com.shiftops.task.repository.TaskTemplateItemRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskTemplateServiceTest {

    @Mock
    private TaskTemplateRepository templateRepository;

    @Mock
    private TaskTemplateItemRepository itemRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @InjectMocks
    private TaskTemplateService templateService;

    private Branch branchA;
    private Branch inactiveBranch;
    private User owner;
    private User managerA;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal managerAPrincipal;

    @BeforeEach
    void setUp() {
        branchA = Branch.builder()
                .name("Alpha Branch")
                .isActive(true)
                .build();
        branchA.setId(UUID.randomUUID());

        inactiveBranch = Branch.builder()
                .name("Inactive Branch")
                .isActive(false)
                .build();
        inactiveBranch.setId(UUID.randomUUID());

        owner = User.builder()
                .email("owner@shiftops.com")
                .fullName("System Owner")
                .role(Role.OWNER)
                .isActive(true)
                .build();
        owner.setId(UUID.randomUUID());
        ownerPrincipal = UserPrincipal.create(owner);

        managerA = User.builder()
                .email("manager@shiftops.com")
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build();
        managerA.setId(UUID.randomUUID());
        managerAPrincipal = UserPrincipal.create(managerA);
    }

    @Test
    void testCreateTemplate_Success() {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder()
                .name("Morning Opening")
                .description("Opening duties")
                .items(List.of(
                        CreateTaskTemplateItemRequest.builder().title("Open Door").priority(TaskPriority.HIGH).build(),
                        CreateTaskTemplateItemRequest.builder().title("Turn on Lights").priority(TaskPriority.NORMAL).build()
                ))
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(templateRepository.existsByBranchIdAndName(branchA.getId(), "Morning Opening")).thenReturn(false);
        when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> {
            TaskTemplate t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskTemplateResponse res = templateService.createTemplate(branchA.getId(), req, managerAPrincipal);

        assertThat(res).isNotNull();
        assertThat(res.getName()).isEqualTo("Morning Opening");
        assertThat(res.getItems()).hasSize(2);
        verify(branchAccessService).validateBranchAccess(managerAPrincipal, branchA.getId());
    }

    @Test
    void testCreateTemplate_DuplicateName_ThrowsConflictException() {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder()
                .name("Morning Opening")
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(templateRepository.existsByBranchIdAndName(branchA.getId(), "Morning Opening")).thenReturn(true);

        assertThatThrownBy(() -> templateService.createTemplate(branchA.getId(), req, managerAPrincipal))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void testCreateTemplate_InactiveBranch_ThrowsBusinessRuleException() {
        CreateTaskTemplateRequest req = CreateTaskTemplateRequest.builder()
                .name("Morning Opening")
                .build();

        when(branchRepository.findById(inactiveBranch.getId())).thenReturn(Optional.of(inactiveBranch));

        assertThatThrownBy(() -> templateService.createTemplate(inactiveBranch.getId(), req, ownerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive branch");
    }

    @Test
    void testUpdateTemplate_Success() {
        TaskTemplate existing = TaskTemplate.builder()
                .branch(branchA)
                .name("Old Name")
                .items(new ArrayList<>())
                .isActive(true)
                .build();
        existing.setId(UUID.randomUUID());

        UpdateTaskTemplateRequest req = UpdateTaskTemplateRequest.builder()
                .name("New Name")
                .description("Updated desc")
                .active(true)
                .items(List.of(CreateTaskTemplateItemRequest.builder().title("New Item").build()))
                .build();

        when(templateRepository.findByIdWithItems(existing.getId())).thenReturn(Optional.of(existing));
        when(templateRepository.existsByBranchIdAndNameAndIdNot(branchA.getId(), "New Name", existing.getId())).thenReturn(false);
        when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskTemplateResponse res = templateService.updateTemplate(existing.getId(), req, managerAPrincipal);

        assertThat(res.getName()).isEqualTo("New Name");
        assertThat(res.getItems()).hasSize(1);
    }

    @Test
    void testUpdateTemplateStatus_Success() {
        TaskTemplate existing = TaskTemplate.builder()
                .branch(branchA)
                .name("Template A")
                .items(new ArrayList<>())
                .isActive(true)
                .build();
        existing.setId(UUID.randomUUID());

        when(templateRepository.findByIdWithItems(existing.getId())).thenReturn(Optional.of(existing));
        when(templateRepository.save(any(TaskTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskTemplateResponse res = templateService.updateTemplateStatus(existing.getId(), false, managerAPrincipal);

        assertThat(res.isActive()).isFalse();
    }
}
