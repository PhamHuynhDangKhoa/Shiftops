package com.shiftops.announcement.service;

import com.shiftops.announcement.dto.AnnouncementResponse;
import com.shiftops.announcement.dto.CreateAnnouncementRequest;
import com.shiftops.announcement.entity.Announcement;
import com.shiftops.announcement.entity.AnnouncementTargetType;
import com.shiftops.announcement.repository.AnnouncementRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.event.AnnouncementPublishedEvent;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private Clock clock;

    @InjectMocks
    private AnnouncementService announcementService;

    private Branch branchA;
    private Branch branchB;
    private User owner;
    private User managerA;
    private User staffA;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal managerAPrincipal;
    private UserPrincipal staffAPrincipal;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2026-10-10T10:00:00Z");
        lenient().when(clock.instant()).thenReturn(now);
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));

        branchA = Branch.builder().name("Branch Alpha").isActive(true).build();
        branchA.setId(UUID.randomUUID());

        branchB = Branch.builder().name("Branch Beta").isActive(true).build();
        branchB.setId(UUID.randomUUID());

        owner = User.builder().email("owner@shiftops.com").role(Role.OWNER).isActive(true).build();
        owner.setId(UUID.randomUUID());

        managerA = User.builder().email("mgr@shiftops.com").role(Role.MANAGER).primaryBranch(branchA).isActive(true).build();
        managerA.setId(UUID.randomUUID());

        staffA = User.builder().email("staff@shiftops.com").role(Role.STAFF).primaryBranch(branchA).isActive(true).build();
        staffA.setId(UUID.randomUUID());

        ownerPrincipal = UserPrincipal.create(owner);
        managerAPrincipal = UserPrincipal.create(managerA);
        staffAPrincipal = UserPrincipal.create(staffA);
    }

    @Test
    void createAnnouncement_Manager_Success() {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Team Meeting")
                .content("Staff meeting tomorrow at 9am")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishImmediately(true)
                .build();

        when(branchRepository.findById(branchA.getId())).thenReturn(Optional.of(branchA));
        when(userRepository.findById(managerA.getId())).thenReturn(Optional.of(managerA));
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
            Announcement a = invocation.getArgument(0);
            Announcement saved = Announcement.builder()
                    .branch(a.getBranch())
                    .createdBy(a.getCreatedBy())
                    .title(a.getTitle())
                    .content(a.getContent())
                    .targetType(a.getTargetType())
                    .publishedAt(a.getPublishedAt())
                    .build();
            saved.setId(UUID.randomUUID());
            return saved;
        });

        AnnouncementResponse response = announcementService.createAnnouncement(branchA.getId(), request, managerAPrincipal);

        assertThat(response.title()).isEqualTo("Team Meeting");
        assertThat(response.published()).isTrue();
        verify(branchAccessService).validateBranchAccess(managerAPrincipal, branchA.getId());
        verify(eventPublisher).publishEvent(any(AnnouncementPublishedEvent.class));
    }

    @Test
    void createAnnouncement_Staff_ThrowsAccessDenied() {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Unauthorized")
                .content("Content")
                .build();

        assertThatThrownBy(() -> announcementService.createAnnouncement(branchA.getId(), request, staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff cannot create announcements");
    }

    @Test
    void createAnnouncement_Manager_OrganizationTarget_ThrowsAccessDenied() {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Company wide")
                .content("Content")
                .targetType(AnnouncementTargetType.ORGANIZATION)
                .build();

        assertThatThrownBy(() -> announcementService.createAnnouncement(branchA.getId(), request, managerAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only owners can create organization-wide announcements");
    }

    @Test
    void createAnnouncement_Owner_OrganizationTarget_Success() {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Company wide memo")
                .content("Owner broadcast")
                .targetType(AnnouncementTargetType.ORGANIZATION)
                .publishImmediately(true)
                .build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> {
            Announcement a = invocation.getArgument(0);
            Announcement saved = Announcement.builder()
                    .createdBy(a.getCreatedBy())
                    .title(a.getTitle())
                    .content(a.getContent())
                    .targetType(a.getTargetType())
                    .publishedAt(a.getPublishedAt())
                    .build();
            saved.setId(UUID.randomUUID());
            return saved;
        });

        AnnouncementResponse response = announcementService.createAnnouncement(null, request, ownerPrincipal);

        assertThat(response.title()).isEqualTo("Company wide memo");
        assertThat(response.targetType()).isEqualTo(AnnouncementTargetType.ORGANIZATION);
        verify(eventPublisher).publishEvent(any(AnnouncementPublishedEvent.class));
    }

    @Test
    void getBranchAnnouncements_Staff_ThrowsAccessDenied() {
        Pageable pageable = PageRequest.of(0, 10);
        assertThatThrownBy(() -> announcementService.getBranchAnnouncements(branchA.getId(), pageable, staffAPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff cannot view branch announcement");
    }

    @Test
    void getMyAnnouncements_Staff_ReturnsActiveBranchAnnouncements() {
        Announcement a = Announcement.builder()
                .branch(branchA)
                .createdBy(managerA)
                .title("Notice")
                .content("Msg")
                .publishedAt(now.minusSeconds(3600))
                .build();
        a.setId(UUID.randomUUID());

        when(announcementRepository.findActiveForBranch(eq(branchA.getId()), any(Instant.class)))
                .thenReturn(List.of(a));

        List<AnnouncementResponse> list = announcementService.getMyAnnouncements(staffAPrincipal);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).title()).isEqualTo("Notice");
    }

    @Test
    void publishAnnouncement_Draft_PublishesAndEmitsEvent() {
        UUID id = UUID.randomUUID();
        Announcement draft = Announcement.builder()
                .branch(branchA)
                .createdBy(managerA)
                .title("Draft Announcement")
                .content("Details")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishedAt(null)
                .build();
        draft.setId(id);

        when(announcementRepository.findByIdWithDetails(id)).thenReturn(Optional.of(draft));
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AnnouncementResponse response = announcementService.publishAnnouncement(id, managerAPrincipal);

        assertThat(response.published()).isTrue();
        assertThat(response.publishedAt()).isEqualTo(now);
        verify(eventPublisher).publishEvent(any(AnnouncementPublishedEvent.class));
    }
}
