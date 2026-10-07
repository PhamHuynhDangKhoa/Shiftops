package com.shiftops.user.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.CreateUserRequest;
import com.shiftops.user.dto.UserResponse;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchAccessService branchAccessService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, UserPrincipal principal) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("User with email '" + normalizedEmail + "' already exists");
        }

        // Authorization checks
        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot create users");
        }

        if (principal.isManager()) {
            if (request.getRole() != Role.STAFF) {
                throw new AccessDeniedException("Managers can only create staff members");
            }
            if (request.getPrimaryBranchId() == null
                    || !request.getPrimaryBranchId().equals(principal.getPrimaryBranchId())) {
                throw new AccessDeniedException("Managers can only assign staff to their own branch");
            }
        }

        // Branch validation
        Branch primaryBranch = null;
        if (request.getRole() != Role.OWNER && request.getPrimaryBranchId() == null) {
            throw new BusinessRuleException("BRANCH_REQUIRED", "Primary branch is required for " + request.getRole());
        }

        if (request.getPrimaryBranchId() != null) {
            primaryBranch = branchRepository.findById(request.getPrimaryBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getPrimaryBranchId()));
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(request.getRole())
                .primaryBranch(primaryBranch)
                .isActive(true)
                .mustChangePassword(false)
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (principal.isOwner()) {
            return UserResponse.fromEntity(user);
        }

        if (principal.isManager()) {
            UUID targetBranchId = user.getPrimaryBranch() != null ? user.getPrimaryBranch().getId() : null;
            if (principal.getPrimaryBranchId() == null || !principal.getPrimaryBranchId().equals(targetBranchId)) {
                throw new AccessDeniedException("You do not have permission to view users outside your branch");
            }
            return UserResponse.fromEntity(user);
        }

        // STAFF can only view self
        if (!principal.getId().equals(id)) {
            throw new AccessDeniedException("Staff members can only view their own profile");
        }

        return UserResponse.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(UserPrincipal principal) {
        if (principal.isOwner()) {
            return userRepository.findAll().stream()
                    .map(UserResponse::fromEntity)
                    .toList();
        }

        if (principal.isManager()) {
            if (principal.getPrimaryBranchId() == null) {
                return List.of();
            }
            return userRepository.findByPrimaryBranchId(principal.getPrimaryBranchId()).stream()
                    .map(UserResponse::fromEntity)
                    .toList();
        }

        throw new AccessDeniedException("Staff members are not permitted to list users");
    }

    @Transactional
    public UserResponse updateUserStatus(UUID id, boolean active, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        branchAccessService.validateCanManageUser(principal, user);

        user.setActive(active);
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }
}
