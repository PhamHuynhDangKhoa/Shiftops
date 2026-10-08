package com.shiftops.user.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.dto.PagedResponse;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.*;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchAccessService branchAccessService;

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SPECIAL;
    private static final SecureRandom RANDOM = new SecureRandom();

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
            if (!primaryBranch.isActive()) {
                throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot assign user to an inactive branch");
            }
        }

        String password;
        boolean mustChangePassword;
        String temporaryPasswordToReturn = null;

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            password = request.getPassword();
            mustChangePassword = false;
        } else {
            password = generateSecureTemporaryPassword();
            mustChangePassword = true;
            temporaryPasswordToReturn = password;
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(request.getRole())
                .primaryBranch(primaryBranch)
                .isActive(true)
                .mustChangePassword(mustChangePassword)
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved, temporaryPasswordToReturn);
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

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getUsers(
            UUID branchId,
            Role role,
            Boolean active,
            String search,
            Pageable pageable,
            UserPrincipal principal) {

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members are not permitted to list users");
        }

        UUID effectiveBranchId = branchId;
        if (principal.isManager()) {
            if (branchId != null && !branchId.equals(principal.getPrimaryBranchId())) {
                throw new AccessDeniedException("Managers can only list users in their assigned branch");
            }
            effectiveBranchId = principal.getPrimaryBranchId();
        }

        final UUID queryBranchId = effectiveBranchId;
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (queryBranchId != null) {
                predicates.add(cb.equal(root.get("primaryBranch").get("id"), queryBranchId));
            }
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("isActive"), active));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> pageResult = userRepository.findAll(spec, pageable);
        return PagedResponse.of(pageResult.map(UserResponse::fromEntity));
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (principal.isManager()) {
            branchAccessService.validateCanManageUser(principal, user);

            if (request.getRole() != null && request.getRole() != Role.STAFF) {
                throw new AccessDeniedException("Managers cannot change user roles");
            }
            if (request.getPrimaryBranchId() != null
                    && !request.getPrimaryBranchId().equals(principal.getPrimaryBranchId())) {
                throw new AccessDeniedException("Managers cannot change staff branch assignment");
            }

            user.setFullName(request.getFullName().trim());
            if (request.getPhone() != null) {
                user.setPhone(request.getPhone().trim());
            }
        } else if (principal.isOwner()) {
            user.setFullName(request.getFullName().trim());
            if (request.getPhone() != null) {
                user.setPhone(request.getPhone().trim());
            }

            if (request.getRole() != null) {
                user.setRole(request.getRole());
            }

            if (request.getPrimaryBranchId() != null) {
                Branch branch = branchRepository.findById(request.getPrimaryBranchId())
                        .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getPrimaryBranchId()));
                if (!branch.isActive()) {
                    throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot assign user to an inactive branch");
                }
                user.setPrimaryBranch(branch);
            } else if (user.getRole() == Role.OWNER && request.getPrimaryBranchId() == null && request.getRole() != null) {
                // If updated to OWNER without branch, it's allowed
                user.setPrimaryBranch(null);
            }
        } else {
            throw new AccessDeniedException("You do not have permission to update users");
        }

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse updateUserStatus(UUID id, boolean active, UserPrincipal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (id.equals(principal.getId()) && !active) {
            throw new BusinessRuleException("CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own account");
        }

        branchAccessService.validateCanManageUser(principal, user);

        user.setActive(active);
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse transferBranch(UUID userId, UUID targetBranchId, UserPrincipal principal) {
        if (!principal.isOwner()) {
            throw new AccessDeniedException("Only owners can transfer users between branches");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Branch targetBranch = branchRepository.findById(targetBranchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", targetBranchId));

        if (!targetBranch.isActive()) {
            throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot transfer user to an inactive branch");
        }

        user.setPrimaryBranch(targetBranch);
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public ResetPasswordResponse resetPassword(UUID userId, UserPrincipal principal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (userId.equals(principal.getId())) {
            throw new BusinessRuleException("CANNOT_RESET_SELF", "Use change-password to update your own password");
        }

        branchAccessService.validateCanManageUser(principal, user);

        String tempPassword = generateSecureTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);

        userRepository.save(user);

        return ResetPasswordResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .temporaryPassword(tempPassword)
                .message("Temporary password generated. Staff must change password after login.")
                .build();
    }

    @Transactional
    public UserResponse changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("INVALID_CREDENTIALS", "Current password does not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("PASSWORD_SAME", "New password cannot be the same as the old password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    private String generateSecureTemporaryPassword() {
        StringBuilder sb = new StringBuilder(12);
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        sb.append(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        for (int i = 4; i < 12; i++) {
            sb.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }

        List<Character> chars = new ArrayList<>();
        for (int i = 0; i < sb.length(); i++) {
            chars.add(sb.charAt(i));
        }
        Collections.shuffle(chars, RANDOM);

        StringBuilder result = new StringBuilder();
        chars.forEach(result::append);
        return result.toString();
    }
}
