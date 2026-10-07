package com.shiftops.branch.service;

import com.shiftops.branch.dto.BranchResponse;
import com.shiftops.branch.dto.BranchSummaryResponse;
import com.shiftops.branch.dto.CreateBranchRequest;
import com.shiftops.branch.dto.UpdateBranchRequest;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.entity.Role;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BranchAccessService branchAccessService;

    @Transactional
    public BranchResponse createBranch(CreateBranchRequest request) {
        String trimmedName = request.getName().trim();
        if (branchRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ConflictException("Branch with name '" + trimmedName + "' already exists");
        }

        Branch branch = Branch.builder()
                .name(trimmedName)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .timezone(request.getTimezone() != null && !request.getTimezone().isBlank()
                        ? request.getTimezone().trim() : "UTC")
                .isActive(true)
                .build();

        Branch saved = branchRepository.save(branch);
        return BranchResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public BranchResponse getBranchById(UUID id, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, id);

        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));
        return BranchResponse.fromEntity(branch);
    }

    @Transactional(readOnly = true)
    public List<BranchResponse> getAccessibleBranches(UserPrincipal principal) {
        if (principal.isOwner()) {
            return branchRepository.findAll().stream()
                    .map(BranchResponse::fromEntity)
                    .toList();
        }

        if (principal.getPrimaryBranchId() != null) {
            return branchRepository.findById(principal.getPrimaryBranchId())
                    .map(b -> List.of(BranchResponse.fromEntity(b)))
                    .orElseGet(Collections::emptyList);
        }

        return Collections.emptyList();
    }

    @Transactional
    public BranchResponse updateBranch(UUID id, UpdateBranchRequest request) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        String trimmedName = request.getName().trim();
        if (!branch.getName().equalsIgnoreCase(trimmedName)
                && branchRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ConflictException("Branch with name '" + trimmedName + "' already exists");
        }

        branch.setName(trimmedName);
        if (request.getAddress() != null) {
            branch.setAddress(request.getAddress().trim());
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            branch.setTimezone(request.getTimezone().trim());
        }
        if (request.getActive() != null) {
            branch.setActive(request.getActive());
        }

        Branch updated = branchRepository.save(branch);
        return BranchResponse.fromEntity(updated);
    }

    @Transactional
    public BranchResponse updateBranchStatus(UUID id, boolean active) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        branch.setActive(active);
        Branch updated = branchRepository.save(branch);
        return BranchResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public BranchSummaryResponse getBranchSummary(UUID id, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, id);

        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        long totalStaff = userRepository.countByPrimaryBranchId(id);
        long activeStaff = userRepository.countByPrimaryBranchIdAndIsActiveTrue(id);
        long managerCount = userRepository.countByPrimaryBranchIdAndRole(id, Role.MANAGER);

        return BranchSummaryResponse.builder()
                .branchId(branch.getId())
                .branchName(branch.getName())
                .totalStaff(totalStaff)
                .activeStaff(activeStaff)
                .managerCount(managerCount)
                .build();
    }
}
