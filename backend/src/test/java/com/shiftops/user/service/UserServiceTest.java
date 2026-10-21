package com.shiftops.user.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.*;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private BranchAccessService branchAccessService;

    @InjectMocks
    private UserService userService;

    private Branch branchA;
    private Branch branchB;
    private Branch inactiveBranch;
    private User owner;
    private User managerA;
    private User staffA;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal managerAPrincipal;
    private UserPrincipal staffAPrincipal;

    @BeforeEach
    void setUp() {
        branchA = Branch.builder()
                .name("Branch Alpha")
                .isActive(true)
                .build();
        branchA.setId(UUID.randomUUID());

        branchB = Branch.builder()
                .name("Branch Beta")
                .isActive(true)
                .build();
        branchB.setId(UUID.randomUUID());

        inactiveBranch = Branch.builder()
                .name("Branch Inactive")
                .isActive(false)
                .build();
        inactiveBranch.setId(UUID.randomUUID());

        owner = User.builder()
                .email("owner@shiftops.com")
                .fullName("Owner Alice")
                .passwordHash("hashedPass")
                .role(Role.OWNER)
                .isActive(true)
                .mustChangePassword(false)
                .build();
        owner.setId(UUID.randomUUID());

        managerA = User.builder()
                .email("manager.a@shiftops.com")
                .fullName("Manager Bob")
                .passwordHash("hashedPass")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .mustChangePassword(false)
                .build();
        managerA.setId(UUID.randomUUID());

        staffA = User.builder()
                .email("staff.a@shiftops.com")
                .fullName("Staff Charlie")
                .passwordHash("hashedPass")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .mustChangePassword(false)
                .build();
        staffA.setId(UUID.randomUUID());

        ownerPrincipal = UserPrincipal.create(owner);
        managerAPrincipal = UserPrincipal.create(managerA);
        staffAPrincipal = UserPrincipal.create(staffA);
    }

    @Test
    void createUser_WithCustomPassword_Success() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("newstaff@shiftops.com")
                .password("CustomPassword123!")
                .fullName("New Staff")
                .role(Role.STAFF)
                .primaryBranchId(branchA.getId())
                .build();

        when(userRepository.existsByEmailIgnoreCase("newstaff@shiftops.com")).thenReturn(false);
        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(passwordEncoder.encode("CustomPassword123!")).thenReturn("encodedCustom");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse response = userService.createUser(request, managerAPrincipal);

        assertThat(response.getEmail()).isEqualTo("newstaff@shiftops.com");
        assertThat(response.isMustChangePassword()).isFalse();
        assertThat(response.getTemporaryPassword()).isNull();
    }

    @Test
    void createUser_WithoutPassword_GeneratesTemporaryPassword() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("invite@shiftops.com")
                .fullName("Invited Staff")
                .role(Role.STAFF)
                .primaryBranchId(branchA.getId())
                .build();

        when(userRepository.existsByEmailIgnoreCase("invite@shiftops.com")).thenReturn(false);
        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedTemp");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse response = userService.createUser(request, managerAPrincipal);

        assertThat(response.getEmail()).isEqualTo("invite@shiftops.com");
        assertThat(response.isMustChangePassword()).isTrue();
        assertThat(response.getTemporaryPassword()).isNotNull();
        assertThat(response.getTemporaryPassword().length()).isEqualTo(12);
    }

    @Test
    void createUser_ManagerCreatingNonStaff_ThrowsAccessDenied() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("manager2@shiftops.com")
                .fullName("Manager Two")
                .role(Role.MANAGER)
                .primaryBranchId(branchA.getId())
                .build();

        when(userRepository.existsByEmailIgnoreCase("manager2@shiftops.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request, managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Managers can only create staff members");
    }

    @Test
    void createUser_ManagerAssigningDifferentBranch_ThrowsAccessDenied() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("staffb@shiftops.com")
                .fullName("Staff B")
                .role(Role.STAFF)
                .primaryBranchId(branchB.getId())
                .build();

        when(userRepository.existsByEmailIgnoreCase("staffb@shiftops.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request, managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Managers can only assign staff to their own branch");
    }

    @Test
    void createUser_AssigningInactiveBranch_ThrowsBusinessRuleException() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("staffinact@shiftops.com")
                .fullName("Staff Inactive")
                .role(Role.STAFF)
                .primaryBranchId(inactiveBranch.getId())
                .build();

        when(userRepository.existsByEmailIgnoreCase("staffinact@shiftops.com")).thenReturn(false);
        when(branchRepository.findById(inactiveBranch.getId())).thenReturn(Optional.of(inactiveBranch));

        assertThatThrownBy(() -> userService.createUser(request, ownerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive branch");
    }

    @Test
    void getUsers_StaffPrincipal_ThrowsAccessDenied() {
        Pageable pageable = PageRequest.of(0, 20);

        assertThatThrownBy(() -> userService.getUsers(null, null, null, null, pageable, staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff members are not permitted to list users");
    }

    @Test
    @SuppressWarnings("unchecked")
    void getUsers_ManagerQueryingOtherBranch_ThrowsAccessDenied() {
        Pageable pageable = PageRequest.of(0, 20);

        assertThatThrownBy(() -> userService.getUsers(branchB.getId(), null, null, null, pageable, managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Managers can only list users in their assigned branch");
    }

    @Test
    @SuppressWarnings("unchecked")
    void getUsers_OwnerQueriesAll_Success() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> mockPage = new PageImpl<>(List.of(owner, managerA, staffA), pageable, 3);

        when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        PagedResponse<UserResponse> response = userService.getUsers(null, null, null, null, pageable, ownerPrincipal);

        assertThat(response.getTotalElements()).isEqualTo(3);
        assertThat(response.getContent()).hasSize(3);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getUsers_WithOwnerSearchQuery_Success() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> mockPage = new PageImpl<>(List.of(owner, managerA, staffA), pageable, 3);

        when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        UserSearchQuery query = UserSearchQuery.builder()
                .pageable(pageable)
                .principal(ownerPrincipal)
                .build();

        PagedResponse<UserResponse> response = userService.getUsers(query);

        assertThat(response.getTotalElements()).isEqualTo(3);
        assertThat(response.getContent()).hasSize(3);
    }

    @Test
    void updateUser_ManagerUpdatesStaffInSameBranch_Success() {
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Charlie Updated")
                .phone("999888777")
                .build();

        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse response = userService.updateUser(staffA.getId(), request, managerAPrincipal);

        verify(branchAccessService).validateCanManageUser(managerAPrincipal, staffA);
        assertThat(response.getFullName()).isEqualTo("Charlie Updated");
        assertThat(response.getPhone()).isEqualTo("999888777");
    }

    @Test
    void updateUser_ManagerTriesToChangeRole_ThrowsAccessDenied() {
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Charlie Attempt")
                .role(Role.MANAGER)
                .build();

        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));

        assertThatThrownBy(() -> userService.updateUser(staffA.getId(), request, managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Managers cannot change user roles");
    }

    @Test
    void updateUserStatus_CannotDeactivateSelf() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> userService.updateUserStatus(owner.getId(), false, ownerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("You cannot deactivate your own account");
    }

    @Test
    void transferBranch_OwnerSuccess() {
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(branchRepository.findById(branchB.getId())).thenReturn(Optional.of(branchB));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse response = userService.transferBranch(staffA.getId(), branchB.getId(), ownerPrincipal);

        assertThat(response.getPrimaryBranchId()).isEqualTo(branchB.getId());
        assertThat(response.getPrimaryBranchName()).isEqualTo("Branch Beta");
    }

    @Test
    void transferBranch_ManagerForbidden() {
        assertThatThrownBy(() -> userService.transferBranch(staffA.getId(), branchB.getId(), managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only owners can transfer users");
    }

    @Test
    void resetPassword_Success() {
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(passwordEncoder.encode(anyString())).thenReturn("newHashedTemp");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ResetPasswordResponse response = userService.resetPassword(staffA.getId(), managerAPrincipal);

        verify(branchAccessService).validateCanManageUser(managerAPrincipal, staffA);
        assertThat(response.getUserId()).isEqualTo(staffA.getId());
        assertThat(response.getEmail()).isEqualTo("staff.a@shiftops.com");
        assertThat(response.getTemporaryPassword()).isNotNull();
        assertThat(response.getTemporaryPassword()).hasSize(12);
        assertThat(staffA.isMustChangePassword()).isTrue();
    }

    @Test
    void resetPassword_CannotResetSelf() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> userService.resetPassword(owner.getId(), ownerPrincipal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Use change-password to update your own password");
    }

    @Test
    void changePassword_Success() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("CurrentPassword123!")
                .newPassword("BrandNewPassword123!")
                .build();

        staffA.setMustChangePassword(true);
        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(passwordEncoder.matches("CurrentPassword123!", "hashedPass")).thenReturn(true);
        when(passwordEncoder.matches("BrandNewPassword123!", "hashedPass")).thenReturn(false);
        when(passwordEncoder.encode("BrandNewPassword123!")).thenReturn("newHash123");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse response = userService.changePassword(staffA.getId(), request);

        assertThat(staffA.isMustChangePassword()).isFalse();
        assertThat(staffA.getPasswordHash()).isEqualTo("newHash123");
    }

    @Test
    void changePassword_InvalidOldPassword_ThrowsBusinessRuleException() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("WrongOldPassword")
                .newPassword("BrandNewPassword123!")
                .build();

        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(passwordEncoder.matches("WrongOldPassword", "hashedPass")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(staffA.getId(), request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Current password does not match");
    }

    @Test
    void updateProfile_Success() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Charlie New Name")
                .phone("5551234567")
                .build();

        when(userRepository.findById(staffA.getId())).thenReturn(Optional.of(staffA));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse response = userService.updateProfile(staffA.getId(), request);

        assertThat(response.getFullName()).isEqualTo("Charlie New Name");
        assertThat(response.getPhone()).isEqualTo("5551234567");
    }
}
