package com.shiftops.handover.service;

import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.dto.*;
import com.shiftops.handover.entity.HandoverItem;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import com.shiftops.handover.repository.HandoverItemRepository;
import com.shiftops.handover.repository.ShiftHandoverRepository;
import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.notification.event.HandoverAcknowledgedEvent;
import com.shiftops.notification.event.HandoverSubmittedEvent;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiftHandoverService {

    private final ShiftHandoverRepository handoverRepository;
    private final HandoverItemRepository itemRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final IssueRepository issueRepository;
    private final BranchAccessService branchAccessService;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ShiftHandoverResponse createOrGetDraftHandover(UUID shiftId, CreateHandoverRequest request, UserPrincipal principal) {
        Shift shift = shiftRepository.findByIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        branchAccessService.validateBranchAccess(principal, shift.getBranch().getId());

        if (shift.getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot create handover for a cancelled shift");
        }

        if (principal.isStaff()) {
            boolean assigned = shiftAssignmentRepository.existsByShiftIdAndUserId(shiftId, principal.getId());
            if (!assigned) {
                throw new AccessDeniedException("Staff can only create handover for their assigned shifts");
            }
        }

        // Idempotent: return existing handover if already present
        Optional<ShiftHandover> existingOpt = handoverRepository.findByShiftIdWithDetails(shiftId);
        if (existingOpt.isPresent()) {
            return ShiftHandoverResponse.fromEntity(existingOpt.get(), computeSummary(shift));
        }

        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .branch(shift.getBranch())
                .status(HandoverStatus.DRAFT)
                .notes(request != null ? request.notes() : null)
                .build();

        if (request != null && request.items() != null) {
            for (HandoverItemRequest itemReq : request.items()) {
                Issue issue = null;
                if (itemReq.issueId() != null) {
                    issue = issueRepository.findById(itemReq.issueId())
                            .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", itemReq.issueId()));
                }
                HandoverItem item = HandoverItem.builder()
                        .type(itemReq.type())
                        .content(itemReq.content())
                        .issue(issue)
                        .orderIndex(itemReq.orderIndex())
                        .build();
                handover.addItem(item);
            }
        }

        try {
            ShiftHandover saved = handoverRepository.save(handover);
            return ShiftHandoverResponse.fromEntity(saved, computeSummary(shift));
        } catch (DataIntegrityViolationException ex) {
            // Concurrent creation caught by unique constraint uq_shift_handover_shift
            log.info("Concurrent handover creation detected for shift {}, fetching existing", shiftId);
            ShiftHandover existing = handoverRepository.findByShiftIdWithDetails(shiftId)
                    .orElseThrow(() -> ex);
            return ShiftHandoverResponse.fromEntity(existing, computeSummary(shift));
        }
    }

    @Transactional(readOnly = true)
    public ShiftHandoverResponse getHandoverByShiftId(UUID shiftId, UserPrincipal principal) {
        ShiftHandover handover = handoverRepository.findByShiftIdWithDetails(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftHandover", "shiftId", shiftId));

        branchAccessService.validateBranchAccess(principal, handover.getBranch().getId());

        return ShiftHandoverResponse.fromEntity(handover, computeSummary(handover.getShift()));
    }

    @Transactional(readOnly = true)
    public ShiftHandoverResponse getLatestBranchHandover(UUID branchId, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, branchId);

        List<ShiftHandover> latest = handoverRepository.findLatestBranchHandovers(
                branchId,
                List.of(HandoverStatus.SUBMITTED, HandoverStatus.ACKNOWLEDGED),
                PageRequest.of(0, 1)
        );

        if (latest.isEmpty()) {
            throw new ResourceNotFoundException("ShiftHandover", "branchId", branchId);
        }

        ShiftHandover handover = handoverRepository.findByIdWithDetails(latest.get(0).getId())
                .orElse(latest.get(0));

        return ShiftHandoverResponse.fromEntity(handover, computeSummary(handover.getShift()));
    }

    @Transactional(readOnly = true)
    public Page<ShiftHandoverResponse> getBranchHandovers(UUID branchId, HandoverStatus status, Pageable pageable, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, branchId);

        Page<ShiftHandover> page;
        if (status != null) {
            page = handoverRepository.findByBranchIdAndStatus(branchId, status, pageable);
        } else {
            page = handoverRepository.findByBranchId(branchId, pageable);
        }

        return page.map(h -> ShiftHandoverResponse.fromEntity(h, computeSummary(h.getShift())));
    }

    @Transactional
    public ShiftHandoverResponse updateDraftHandover(UUID id, UpdateHandoverRequest request, UserPrincipal principal) {
        ShiftHandover handover = handoverRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftHandover", "id", id));

        branchAccessService.validateBranchAccess(principal, handover.getBranch().getId());

        if (handover.getStatus() != HandoverStatus.DRAFT) {
            throw new BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Only draft handovers can be updated. Current status: " + handover.getStatus());
        }

        if (handover.getShift().getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot modify handover for a cancelled shift");
        }

        if (principal.isStaff()) {
            boolean assigned = shiftAssignmentRepository.existsByShiftIdAndUserId(handover.getShift().getId(), principal.getId());
            if (!assigned) {
                throw new AccessDeniedException("Staff can only edit handovers for their assigned shifts");
            }
        }

        handover.setNotes(request.notes());
        handover.clearItems();

        if (request.items() != null) {
            for (HandoverItemRequest itemReq : request.items()) {
                Issue issue = null;
                if (itemReq.issueId() != null) {
                    issue = issueRepository.findById(itemReq.issueId())
                            .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", itemReq.issueId()));
                }
                HandoverItem item = HandoverItem.builder()
                        .type(itemReq.type())
                        .content(itemReq.content())
                        .issue(issue)
                        .orderIndex(itemReq.orderIndex())
                        .build();
                handover.addItem(item);
            }
        }

        ShiftHandover saved = handoverRepository.save(handover);
        return ShiftHandoverResponse.fromEntity(saved, computeSummary(saved.getShift()));
    }

    @Transactional
    public ShiftHandoverResponse submitHandover(UUID id, UserPrincipal principal) {
        ShiftHandover handover = handoverRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftHandover", "id", id));

        branchAccessService.validateBranchAccess(principal, handover.getBranch().getId());

        if (handover.getShift().getStatus() == ShiftStatus.CANCELLED) {
            throw new BusinessRuleException("SHIFT_CANCELLED", "Cannot submit handover for a cancelled shift");
        }

        if (handover.getStatus() != HandoverStatus.DRAFT) {
            throw new BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Cannot submit handover in status: " + handover.getStatus());
        }

        if (principal.isStaff()) {
            boolean assigned = shiftAssignmentRepository.existsByShiftIdAndUserId(handover.getShift().getId(), principal.getId());
            if (!assigned) {
                throw new AccessDeniedException("Staff can only submit handovers for their assigned shifts");
            }
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        handover.setStatus(HandoverStatus.SUBMITTED);
        handover.setSubmittedBy(user);
        handover.setSubmittedAt(clock.instant());

        ShiftHandover saved = handoverRepository.save(handover);
        eventPublisher.publishEvent(new HandoverSubmittedEvent(
                saved.getId(),
                saved.getShift().getId(),
                saved.getBranch().getId(),
                user.getId(),
                saved.getShift().getName()
        ));
        return ShiftHandoverResponse.fromEntity(saved, computeSummary(saved.getShift()));
    }

    @Transactional
    public ShiftHandoverResponse acknowledgeHandover(UUID id, AcknowledgeHandoverRequest request, UserPrincipal principal) {
        ShiftHandover handover = handoverRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftHandover", "id", id));

        branchAccessService.validateBranchAccess(principal, handover.getBranch().getId());

        if (handover.getStatus() != HandoverStatus.SUBMITTED) {
            throw new BusinessRuleException("INVALID_HANDOVER_STATE",
                    "Cannot acknowledge handover in status: " + handover.getStatus());
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        handover.setStatus(HandoverStatus.ACKNOWLEDGED);
        handover.setAcknowledgedBy(user);
        handover.setAcknowledgedAt(clock.instant());
        if (request != null && request.notes() != null) {
            handover.setAcknowledgementNotes(request.notes());
        }

        ShiftHandover saved = handoverRepository.save(handover);
        UUID submitterId = saved.getSubmittedBy() != null ? saved.getSubmittedBy().getId() : null;
        eventPublisher.publishEvent(new HandoverAcknowledgedEvent(
                saved.getId(),
                saved.getShift().getId(),
                saved.getBranch().getId(),
                user.getId(),
                submitterId,
                saved.getShift().getName()
        ));
        return ShiftHandoverResponse.fromEntity(saved, computeSummary(saved.getShift()));
    }

    public HandoverDerivedSummary computeSummary(Shift shift) {
        UUID shiftId = shift.getId();
        UUID branchId = shift.getBranch().getId();

        List<Task> tasks = taskRepository.findByShiftId(shiftId);
        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .count();
        int pendingTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.TODO || t.getStatus() == TaskStatus.IN_PROGRESS)
                .count();

        int openIssues = (int) issueRepository.countByBranchIdAndStatusIn(
                branchId,
                List.of(IssueStatus.OPEN, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS)
        );

        int staffCount = (int) shiftAssignmentRepository.countByShiftId(shiftId);

        return HandoverDerivedSummary.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .openBranchIssues(openIssues)
                .staffAssignedCount(staffCount)
                .build();
    }
}
