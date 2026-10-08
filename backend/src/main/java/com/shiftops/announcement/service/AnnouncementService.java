package com.shiftops.announcement.service;

import com.shiftops.announcement.dto.AnnouncementResponse;
import com.shiftops.announcement.dto.CreateAnnouncementRequest;
import com.shiftops.announcement.entity.Announcement;
import com.shiftops.announcement.entity.AnnouncementTargetType;
import com.shiftops.announcement.repository.AnnouncementRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.event.AnnouncementPublishedEvent;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final BranchAccessService branchAccessService;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    @Transactional
    public AnnouncementResponse createAnnouncement(UUID branchId, CreateAnnouncementRequest request, UserPrincipal principal) {
        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff cannot create announcements");
        }

        AnnouncementTargetType targetType = request.getTargetType() != null ? request.getTargetType() : AnnouncementTargetType.BRANCH;

        Branch branch = null;
        if (targetType == AnnouncementTargetType.ORGANIZATION) {
            if (!principal.isOwner()) {
                throw new AccessDeniedException("Only owners can create organization-wide announcements");
            }
        } else {
            if (branchId == null) {
                branchId = principal.getPrimaryBranchId();
            }
            if (branchId == null) {
                throw new IllegalArgumentException("Branch ID is required for branch-scoped announcements");
            }
            branchAccessService.validateBranchAccess(principal, branchId);
            final UUID lookupBranchId = branchId;
            branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", lookupBranchId));
        }

        User author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        Shift targetShift = null;
        if (request.getTargetShiftId() != null) {
            targetShift = shiftRepository.findById(request.getTargetShiftId())
                    .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getTargetShiftId()));
        }

        Announcement announcement = Announcement.builder()
                .branch(branch)
                .createdBy(author)
                .title(request.getTitle())
                .content(request.getContent())
                .targetType(targetType)
                .targetShift(targetShift)
                .expiresAt(request.getExpiresAt())
                .build();

        if (Boolean.TRUE.equals(request.getPublishImmediately())) {
            announcement.setPublishedAt(clock.instant());
        }

        Announcement saved = announcementRepository.save(announcement);

        if (saved.isPublished()) {
            eventPublisher.publishEvent(new AnnouncementPublishedEvent(
                    saved.getId(),
                    branch != null ? branch.getId() : null,
                    saved.getTargetType(),
                    saved.getTargetShift() != null ? saved.getTargetShift().getId() : null,
                    saved.getTitle(),
                    saved.getContent()
            ));
        }

        return AnnouncementResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getBranchAnnouncements(UUID branchId, Pageable pageable, UserPrincipal principal) {
        branchAccessService.validateBranchAccess(principal, branchId);

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff cannot view branch announcement management list");
        }

        return announcementRepository.findByBranchIdOrderByCreatedAtDesc(branchId, pageable)
                .map(AnnouncementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getMyAnnouncements(UserPrincipal principal) {
        if (principal.getPrimaryBranchId() != null) {
            return announcementRepository.findActiveForBranch(principal.getPrimaryBranchId(), clock.instant())
                    .stream()
                    .map(AnnouncementResponse::fromEntity)
                    .toList();
        } else if (principal.isOwner()) {
            return announcementRepository.findActiveOrganizationWide(clock.instant())
                    .stream()
                    .map(AnnouncementResponse::fromEntity)
                    .toList();
        }
        return Collections.emptyList();
    }

    @Transactional
    public AnnouncementResponse publishAnnouncement(UUID id, UserPrincipal principal) {
        Announcement announcement = announcementRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        if (principal.isStaff()) {
            throw new AccessDeniedException("Staff cannot publish announcements");
        }

        if (announcement.getBranch() != null) {
            branchAccessService.validateBranchAccess(principal, announcement.getBranch().getId());
        } else if (!principal.isOwner()) {
            throw new AccessDeniedException("Only owners can publish organization announcements");
        }

        if (!announcement.isPublished()) {
            announcement.setPublishedAt(clock.instant());
            announcement = announcementRepository.save(announcement);

            eventPublisher.publishEvent(new AnnouncementPublishedEvent(
                    announcement.getId(),
                    announcement.getBranch() != null ? announcement.getBranch().getId() : null,
                    announcement.getTargetType(),
                    announcement.getTargetShift() != null ? announcement.getTargetShift().getId() : null,
                    announcement.getTitle(),
                    announcement.getContent()
            ));
        }

        return AnnouncementResponse.fromEntity(announcement);
    }
}
