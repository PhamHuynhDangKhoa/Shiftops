package com.shiftops.shift.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.dto.*;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BranchAccessService branchAccessService;

    @Transactional
    public ShiftResponse createShift(UUID branchId, CreateShiftRequest request, UserPrincipal principal) {
        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot create shifts");
        }

        branchAccessService.validateBranchAccess(principal, branchId);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        if (!branch.isActive()) {
            throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot create shift on an inactive branch");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessRuleException("INVALID_TIME_RANGE", "Start time must be before end time");
        }

        Shift shift = Shift.builder()
                .branch(branch)
                .name(request.getName() != null ? request.getName().trim() : null)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(ShiftStatus.DRAFT)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .build();

        Shift saved = shiftRepository.save(shift);
        return ShiftResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public ShiftResponse getShiftById(UUID shiftId, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (principal.isOwner()) {
            return ShiftResponse.fromEntity(shift);
        }

        if (principal.isManager()) {
            if (!shift.getBranch().getId().equals(principal.getPrimaryBranchId())) {
                throw new AccessDeniedException("You do not have access to shifts outside your assigned branch");
            }
            return ShiftResponse.fromEntity(shift);
        }

        // STAFF: can only view if published and assigned to self
        if (shift.getStatus() != ShiftStatus.PUBLISHED) {
            throw new AccessDeniedException("Staff members can only view published shifts");
        }

        boolean isAssigned = shift.getAssignments() != null && shift.getAssignments().stream()
                .anyMatch(a -> a.getUser().getId().equals(principal.getId()));

        if (!isAssigned) {
            throw new AccessDeniedException("Staff members can only view shifts assigned to them");
        }

        return ShiftResponse.fromEntity(shift);
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getBranchShifts(
            UUID branchId,
            Instant startDate,
            Instant endDate,
            ShiftStatus status,
            UserPrincipal principal) {

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot list all branch shifts. Use /my-shifts instead.");
        }

        branchAccessService.validateBranchAccess(principal, branchId);

        Instant start = startDate != null ? startDate : Instant.now().minus(7, ChronoUnit.DAYS);
        Instant end = endDate != null ? endDate : Instant.now().plus(14, ChronoUnit.DAYS);

        List<Shift> shifts;
        if (status != null) {
            shifts = shiftRepository.findByBranchAndStatusAndWindow(branchId, status, start, end);
        } else {
            shifts = shiftRepository.findByBranchAndWindow(branchId, start, end);
        }

        return shifts.stream().map(ShiftResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getMyShifts(Instant startDate, Instant endDate, UserPrincipal principal) {
        Instant start = startDate != null ? startDate : Instant.now().minus(7, ChronoUnit.DAYS);
        Instant end = endDate != null ? endDate : Instant.now().plus(14, ChronoUnit.DAYS);

        List<Shift> shifts = shiftRepository.findUserShiftsByStatusAndWindow(
                principal.getId(),
                ShiftStatus.PUBLISHED,
                start,
                end);

        return shifts.stream().map(ShiftResponse::fromEntity).toList();
    }

    @Transactional
    public ShiftResponse updateShift(UUID shiftId, UpdateShiftRequest request, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot update shifts");
        }

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Completed shifts cannot be modified");
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cancelled shifts cannot be modified");
        }

        Instant newStart = request.getStartTime() != null ? request.getStartTime() : shift.getStartTime();
        Instant newEnd = request.getEndTime() != null ? request.getEndTime() : shift.getEndTime();

        boolean timesChanged = !newStart.equals(shift.getStartTime()) || !newEnd.equals(shift.getEndTime());

        if (timesChanged) {
            if (shift.getStatus() == ShiftStatus.PUBLISHED) {
                throw new BusinessRuleException(
                        "PUBLISHED_SHIFT_IMMUTABLE_TIMES",
                        "Cannot modify times of a published shift. Revert to DRAFT first.");
            }

            if (!newStart.isBefore(newEnd)) {
                throw new BusinessRuleException("INVALID_TIME_RANGE", "Start time must be before end time");
            }

            // Verify no existing assignments will overlap with new times
            if (shift.getAssignments() != null) {
                for (ShiftAssignment assignment : shift.getAssignments()) {
                    long overlaps = shiftAssignmentRepository.countOverlappingAssignments(
                            assignment.getUser().getId(),
                            shift.getId(),
                            newStart,
                            newEnd);
                    if (overlaps > 0) {
                        throw new BusinessRuleException(
                                "SHIFT_OVERLAP_CONFLICT",
                                "Updated shift times cause a schedule conflict for " + assignment.getUser().getFullName());
                    }
                }
            }

            shift.setStartTime(newStart);
            shift.setEndTime(newEnd);
        }

        if (request.getName() != null) {
            shift.setName(request.getName().trim());
        }
        if (request.getNotes() != null) {
            shift.setNotes(request.getNotes().trim());
        }

        Shift updated = shiftRepository.save(shift);
        return ShiftResponse.fromEntity(updated);
    }

    @Transactional
    public ShiftResponse updateShiftStatus(UUID shiftId, ShiftStatus targetStatus, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot update shift status");
        }

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        ShiftStatus currentStatus = shift.getStatus();
        if (currentStatus == targetStatus) {
            return ShiftResponse.fromEntity(shift);
        }

        // State Machine validation
        boolean validTransition = false;
        switch (currentStatus) {
            case DRAFT -> validTransition = (targetStatus == ShiftStatus.PUBLISHED || targetStatus == ShiftStatus.CANCELLED);
            case PUBLISHED -> validTransition = (targetStatus == ShiftStatus.DRAFT || targetStatus == ShiftStatus.COMPLETED || targetStatus == ShiftStatus.CANCELLED);
            case COMPLETED, CANCELLED -> validTransition = false;
        }

        if (!validTransition) {
            throw new BusinessRuleException(
                    "INVALID_STATE_TRANSITION",
                    "Cannot transition shift from " + currentStatus + " to " + targetStatus);
        }

        shift.setStatus(targetStatus);
        Shift updated = shiftRepository.save(shift);
        return ShiftResponse.fromEntity(updated);
    }

    @Transactional
    public ShiftResponse assignStaff(UUID shiftId, UUID userId, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot assign staff");
        }

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Cannot assign staff to a completed shift");
        }
        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot assign staff to a cancelled shift");
        }

        // 1. Fetch target user with lock to prevent concurrent overlapping assignments
        User targetUser = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!targetUser.isActive()) {
            throw new BusinessRuleException("USER_INACTIVE", "Cannot assign an inactive staff member");
        }

        // Branch boundary check: Staff must belong to the same branch as the shift (Owner role exempt)
        if (targetUser.getRole() != Role.OWNER
                && targetUser.getPrimaryBranch() != null
                && !targetUser.getPrimaryBranch().getId().equals(shift.getBranch().getId())) {
            throw new BusinessRuleException("BRANCH_MISMATCH", "Staff member does not belong to the shift's branch");
        }

        // 2. Duplicate assignment check
        if (shiftAssignmentRepository.existsByShiftIdAndUserId(shift.getId(), targetUser.getId())) {
            throw new ConflictException("Staff member is already assigned to this shift");
        }

        // 3. Overlap check: [A_start < B_end] AND [B_start < A_end]
        long overlappingCount = shiftAssignmentRepository.countOverlappingAssignments(
                targetUser.getId(),
                shift.getId(),
                shift.getStartTime(),
                shift.getEndTime());

        if (overlappingCount > 0) {
            throw new BusinessRuleException(
                    "SHIFT_OVERLAP_CONFLICT",
                    "Staff member already has an overlapping shift assignment during this time interval");
        }

        User assignedByUser = userRepository.getReferenceById(principal.getId());

        ShiftAssignment assignment = ShiftAssignment.builder()
                .shift(shift)
                .user(targetUser)
                .assignedBy(assignedByUser)
                .assignedAt(Instant.now())
                .build();

        shift.getAssignments().add(assignment);
        Shift saved = shiftRepository.save(shift);

        return ShiftResponse.fromEntity(saved);
    }

    @Transactional
    public ShiftResponse removeStaffAssignment(UUID shiftId, UUID userId, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot unassign staff");
        }

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new BusinessRuleException("SHIFT_COMPLETED", "Cannot remove assignments from a completed shift");
        }

        ShiftAssignment assignment = shiftAssignmentRepository.findByShiftIdAndUserId(shiftId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "userId", userId));

        shift.getAssignments().remove(assignment);
        shiftAssignmentRepository.delete(assignment);

        Shift saved = shiftRepository.save(shift);
        return ShiftResponse.fromEntity(saved);
    }
}
