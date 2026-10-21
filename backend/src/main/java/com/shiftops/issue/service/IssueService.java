package com.shiftops.issue.service;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.common.storage.StorageService;
import com.shiftops.issue.dto.*;
import com.shiftops.issue.entity.*;
import com.shiftops.issue.repository.IssueAttachmentRepository;
import com.shiftops.issue.repository.IssueCommentRepository;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.task.entity.Task;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final IssueRepository issueRepository;
    private final IssueCommentRepository commentRepository;
    private final IssueAttachmentRepository attachmentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final TaskRepository taskRepository;
    private final BranchAccessService branchAccessService;
    private final StorageService storageService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Autowired(required = false)
    private Clock clock = Clock.systemUTC();

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    @Transactional
    public IssueResponse createIssue(CreateIssueRequest request, UserPrincipal principal) {
        UUID branchId;
        if (principal.isStaff()) {
            branchId = principal.getBranchId();
            if (request.getBranchId() != null && !request.getBranchId().equals(branchId)) {
                throw new AccessDeniedException("Staff can only report issues for their assigned branch");
            }
        } else {
            branchId = request.getBranchId() != null ? request.getBranchId() : principal.getBranchId();
            if (branchId == null) {
                throw new BusinessRuleException("BRANCH_REQUIRED", "Branch ID is required");
            }
            branchAccessService.validateBranchAccess(principal, branchId);
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        if (!branch.isActive()) {
            throw new BusinessRuleException("BRANCH_INACTIVE", "Cannot report issue for an inactive branch");
        }

        User reportedBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        ShiftAssignment shiftAssignment = null;
        if (request.getShiftAssignmentId() != null) {
            shiftAssignment = shiftAssignmentRepository.findById(request.getShiftAssignmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", request.getShiftAssignmentId()));
            if (!shiftAssignment.getShift().getBranch().getId().equals(branchId)) {
                throw new BusinessRuleException("BRANCH_MISMATCH", "Shift assignment belongs to a different branch");
            }
        }

        Task task = null;
        if (request.getTaskId() != null) {
            task = taskRepository.findById(request.getTaskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Task", "id", request.getTaskId()));
            if (!task.getShiftAssignment().getShift().getBranch().getId().equals(branchId)) {
                throw new BusinessRuleException("BRANCH_MISMATCH", "Task belongs to a different branch");
            }
        }

        Issue issue = Issue.builder()
                .branch(branch)
                .reportedBy(reportedBy)
                .shiftAssignment(shiftAssignment)
                .task(task)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory())
                .priority(request.getPriority() != null ? request.getPriority() : IssuePriority.NORMAL)
                .status(IssueStatus.OPEN)
                .build();

        Issue saved = issueRepository.save(issue);
        log.info("Issue '{}' (id: {}) created by {} in branch {}", saved.getTitle(), saved.getId(), reportedBy.getEmail(), branch.getName());
        return IssueResponse.fromEntity(saved, false);
    }

    @Transactional(readOnly = true)
    public IssueResponse getIssueById(UUID id, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", id));

        validateIssueReadAccess(issue, principal);

        List<IssueComment> comments = commentRepository.findByIssueIdOrderByCreatedAtAsc(id);
        List<IssueAttachment> attachments = attachmentRepository.findByIssueIdOrderByCreatedAtAsc(id);
        issue.setComments(comments);
        issue.setAttachments(attachments);

        return IssueResponse.fromEntity(issue, true);
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> getMyIssues(UserPrincipal principal) {
        List<Issue> issues = issueRepository.findMyIssues(principal.getId());
        return issues.stream()
                .map(i -> IssueResponse.fromEntity(i, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> getBranchIssues(BranchIssuesQuery query) {
        branchAccessService.validateBranchAccess(query.principal(), query.branchId());

        Specification<Issue> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("branch").get("id"), query.branchId()));

            if (query.status() != null) {
                predicates.add(cb.equal(root.get("status"), query.status()));
            }
            if (query.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), query.priority()));
            }
            if (query.category() != null) {
                predicates.add(cb.equal(root.get("category"), query.category()));
            }
            if (query.assignedToId() != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), query.assignedToId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Issue> page = issueRepository.findAll(spec, query.pageable());
        return page.map(i -> IssueResponse.fromEntity(i, false));
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> getBranchIssues(
            UUID branchId,
            IssueStatus status,
            IssuePriority priority,
            IssueCategory category,
            UUID assignedToId,
            Pageable pageable,
            UserPrincipal principal) {
        return getBranchIssues(BranchIssuesQuery.builder()
                .branchId(branchId)
                .status(status)
                .priority(priority)
                .category(category)
                .assignedToId(assignedToId)
                .pageable(pageable)
                .principal(principal)
                .build());
    }

    @Transactional(readOnly = true)
    public IssueSummaryResponse getBranchSummary(UUID branchId, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, branchId);

        long total = issueRepository.countByBranchId(branchId);
        long open = issueRepository.countByBranchIdAndStatus(branchId, IssueStatus.OPEN);
        long assigned = issueRepository.countByBranchIdAndStatus(branchId, IssueStatus.ASSIGNED);
        long inProgress = issueRepository.countByBranchIdAndStatus(branchId, IssueStatus.IN_PROGRESS);
        long resolved = issueRepository.countByBranchIdAndStatus(branchId, IssueStatus.RESOLVED);
        long closed = issueRepository.countByBranchIdAndStatus(branchId, IssueStatus.CLOSED);

        long urgent = issueRepository.countByBranchIdAndPriority(branchId, IssuePriority.URGENT);
        long high = issueRepository.countByBranchIdAndPriority(branchId, IssuePriority.HIGH);

        return IssueSummaryResponse.from(total, open, assigned, inProgress, resolved, closed, urgent, high);
    }

    @Transactional
    public IssueResponse assignIssue(UUID issueId, AssignIssueRequest request, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff members cannot assign issues");
        }

        branchAccessService.validateBranchAccess(principal, issue.getBranch().getId());

        if (issue.getStatus() == IssueStatus.CLOSED) {
            throw new BusinessRuleException("ISSUE_CLOSED", "Cannot reassign a closed issue");
        }
        if (issue.getStatus() == IssueStatus.CANCELLED) {
            throw new BusinessRuleException("ISSUE_CANCELLED", "Cannot reassign a cancelled issue");
        }

        User targetUser = null;
        User currentUser = userRepository.getReferenceById(principal.getId());

        if (request.getAssignedToUserId() != null) {
            targetUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToUserId()));

            if (!targetUser.isActive()) {
                throw new BusinessRuleException("STAFF_INACTIVE", "Cannot assign issue to an inactive staff member");
            }

            if (targetUser.getPrimaryBranch() == null ||
                    !targetUser.getPrimaryBranch().getId().equals(issue.getBranch().getId())) {
                throw new BusinessRuleException("BRANCH_MISMATCH", "Cannot assign issue to staff from a different branch");
            }

            issue.assignStaff(targetUser, currentUser);
        } else {
            issue.unassignStaff(currentUser);
        }

        Issue saved = issueRepository.save(issue);
        log.info("Issue {} assignment updated by {}", issueId, principal.getUsername());
        if (targetUser != null) {
            eventPublisher.publishEvent(new com.shiftops.notification.event.IssueAssignedEvent(
                    saved.getId(), saved.getBranch().getId(), targetUser.getId(), saved.getTitle()));
        }
        return IssueResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueResponse updateIssueStatus(UUID issueId, UpdateIssueStatusRequest request, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        IssueStatus currentStatus = issue.getStatus();
        IssueStatus targetStatus = request.getStatus();

        if (currentStatus == targetStatus) {
            return IssueResponse.fromEntity(issue, true);
        }

        if (principal.isStaff()) {
            if (issue.getAssignedTo() == null || !issue.getAssignedTo().getId().equals(principal.getId())) {
                throw new AccessDeniedException("Staff can only update issues assigned to them");
            }
            if (targetStatus == IssueStatus.CLOSED || targetStatus == IssueStatus.CANCELLED) {
                throw new AccessDeniedException("Only managers can close or cancel issues");
            }
        } else {
            branchAccessService.validateBranchAccess(principal, issue.getBranch().getId());
        }

        User currentUser = userRepository.getReferenceById(principal.getId());

        // Domain method encapsulates state transitions, role invariants, timestamps, and timeline comment
        issue.transitionTo(targetStatus, currentUser, request.getComment(), clock.instant(), principal.isStaff());

        Issue saved = issueRepository.save(issue);
        log.info("Issue {} transitioned: {} -> {} by {}", issueId, currentStatus, targetStatus, principal.getUsername());
        eventPublisher.publishEvent(new com.shiftops.notification.event.IssueStatusChangedEvent(
                saved.getId(),
                saved.getBranch().getId(),
                saved.getReportedBy() != null ? saved.getReportedBy().getId() : null,
                saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null,
                currentStatus,
                targetStatus,
                saved.getTitle()
        ));
        return IssueResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueCommentResponse addComment(UUID issueId, CreateIssueCommentRequest request, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        validateIssueReadAccess(issue, principal);

        if (issue.getStatus() == IssueStatus.CLOSED && principal.isStaff()) {
            throw new BusinessRuleException("ISSUE_CLOSED", "Cannot add comments to a closed issue");
        }

        User author = userRepository.getReferenceById(principal.getId());
        boolean isInternal = Boolean.TRUE.equals(request.getInternal()) && !principal.isStaff();

        IssueComment comment = IssueComment.builder()
                .issue(issue)
                .author(author)
                .message(request.getMessage().trim())
                .isInternal(isInternal)
                .build();

        IssueComment saved = commentRepository.save(comment);
        log.info("Added comment to issue {} by {}", issueId, author.getEmail());
        return IssueCommentResponse.fromEntity(saved);
    }

    @Transactional
    public IssueAttachmentResponse addAttachment(UUID issueId, MultipartFile file, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        validateIssueReadAccess(issue, principal);

        if (issue.getStatus() == IssueStatus.CLOSED) {
            throw new BusinessRuleException("ISSUE_CLOSED", "Cannot attach files to a closed issue");
        }

        if (file.isEmpty()) {
            throw new BusinessRuleException("EMPTY_FILE", "Uploaded file is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("FILE_TOO_LARGE", "File size exceeds 5MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("INVALID_FILE_TYPE", "Only JPEG, PNG, and WebP images are allowed");
        }

        String subDirectory = "issues/" + issueId;
        String storagePath = storageService.store(file, subDirectory);

        User uploadedBy = userRepository.getReferenceById(principal.getId());
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment.jpg";
        String fileName = storagePath.substring(storagePath.lastIndexOf('/') + 1);

        IssueAttachment attachment = IssueAttachment.builder()
                .issue(issue)
                .uploadedBy(uploadedBy)
                .fileName(fileName)
                .originalFileName(originalFilename)
                .contentType(contentType)
                .fileSize(file.getSize())
                .storagePath(storagePath)
                .build();

        IssueAttachment saved = attachmentRepository.save(attachment);
        log.info("Added attachment '{}' to issue {} by {}", originalFilename, issueId, uploadedBy.getEmail());
        return IssueAttachmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AttachmentFile getAttachmentFile(UUID issueId, UUID attachmentId, UserPrincipal principal) {
        Issue issue = issueRepository.findByIdWithDetails(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        validateIssueReadAccess(issue, principal);

        IssueAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("IssueAttachment", "id", attachmentId));

        if (!attachment.getIssue().getId().equals(issueId)) {
            throw new BusinessRuleException("ATTACHMENT_MISMATCH", "Attachment does not belong to specified issue");
        }

        Resource resource = storageService.loadAsResource(attachment.getStoragePath());
        return new AttachmentFile(resource, attachment.getContentType(), attachment.getOriginalFileName());
    }

    private void validateIssueReadAccess(Issue issue, UserPrincipal principal) {
        if (principal.isStaff()) {
            UUID userBranchId = principal.getBranchId();
            if (userBranchId == null || !userBranchId.equals(issue.getBranch().getId())) {
                throw new AccessDeniedException("Access denied: You do not have access to this branch");
            }
            boolean isReporter = issue.getReportedBy().getId().equals(principal.getId());
            boolean isAssignee = issue.getAssignedTo() != null && issue.getAssignedTo().getId().equals(principal.getId());
            if (!isReporter && !isAssignee) {
                throw new AccessDeniedException("Staff can only view issues reported by them or assigned to them");
            }
        } else {
            branchAccessService.validateBranchAccess(principal, issue.getBranch().getId());
        }
    }

    public record AttachmentFile(Resource resource, String contentType, String originalFileName) {}
}
