package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.announcement.dto.CreateAnnouncementRequest;
import com.shiftops.announcement.entity.Announcement;
import com.shiftops.announcement.entity.AnnouncementTargetType;
import com.shiftops.announcement.repository.AnnouncementRepository;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.entity.HandoverItemType;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import com.shiftops.handover.repository.HandoverItemRepository;
import com.shiftops.handover.repository.ShiftHandoverRepository;
import com.shiftops.handover.service.ShiftHandoverService;
import com.shiftops.issue.dto.AssignIssueRequest;
import com.shiftops.issue.dto.UpdateIssueStatusRequest;
import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.repository.IssueAttachmentRepository;
import com.shiftops.issue.repository.IssueCommentRepository;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.issue.service.IssueService;
import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.event.TaskAssignedEvent;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.notification.service.NotificationService;
import com.shiftops.notification.service.ShiftReminderScheduler;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.dto.CreateAdHocTaskRequest;
import com.shiftops.task.entity.Task;
import com.shiftops.task.entity.TaskPriority;
import com.shiftops.task.entity.TaskStatus;
import com.shiftops.task.repository.TaskRepository;
import com.shiftops.task.repository.TaskTemplateRepository;
import com.shiftops.task.service.TaskService;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(Phase8IntegrationTest.TestClockConfig.class)
public class Phase8IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private ShiftHandoverRepository handoverRepository;

    @Autowired
    private HandoverItemRepository itemRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskTemplateRepository taskTemplateRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private IssueCommentRepository commentRepository;

    @Autowired
    private IssueAttachmentRepository attachmentRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private IssueService issueService;

    @Autowired
    private ShiftHandoverService handoverService;

    @Autowired
    private ShiftReminderScheduler shiftReminderScheduler;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private RollbackTestService rollbackTestService;

    @Autowired
    private MutableClock mutableClock;

    private Branch branchAlpha;
    private Branch branchBeta;

    private User owner;
    private User managerAlpha;
    private User managerBeta;
    private User staffAlpha1;
    private User staffAlpha2;
    private User staffBeta;
    private User inactiveStaff;

    private String ownerToken;
    private String managerAlphaToken;
    private String managerBetaToken;
    private String staffAlpha1Token;
    private String staffBetaToken;

    private static final Instant BASE_TIME = Instant.parse("2026-10-15T08:00:00Z");

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        public MutableClock mutableClock() {
            return new MutableClock(BASE_TIME, ZoneId.of("UTC"));
        }

        @Bean
        public RollbackTestService rollbackTestService(ApplicationEventPublisher publisher) {
            return new RollbackTestService(publisher);
        }
    }

    public static class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zone;

        public MutableClock(Instant initialInstant, ZoneId zone) {
            this.instant = initialInstant;
            this.zone = zone;
        }

        public void setInstant(Instant newInstant) {
            this.instant = newInstant;
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }

    public static class RollbackTestService {
        private final ApplicationEventPublisher publisher;

        public RollbackTestService(ApplicationEventPublisher publisher) {
            this.publisher = publisher;
        }

        @Transactional
        public void emitEventAndRollback(UUID staffId, UUID taskId) {
            publisher.publishEvent(new TaskAssignedEvent(taskId, UUID.randomUUID(), staffId, "Doomed Task"));
            throw new RuntimeException("Simulated transaction rollback");
        }
    }

    @BeforeEach
    void setUp() {
        mutableClock.setInstant(BASE_TIME);
        cleanupDatabase();

        branchAlpha = branchRepository.save(Branch.builder()
                .name("Branch Alpha")
                .address("100 Main St")
                .isActive(true)
                .build());

        branchBeta = branchRepository.save(Branch.builder()
                .name("Branch Beta")
                .address("200 Second St")
                .isActive(true)
                .build());

        owner = userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash("hashed")
                .fullName("Alice Owner")
                .role(Role.OWNER)
                .isActive(true)
                .build());

        managerAlpha = userRepository.save(User.builder()
                .email("mgr.alpha@shiftops.com")
                .passwordHash("hashed")
                .fullName("Bob Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchAlpha)
                .isActive(true)
                .build());

        managerBeta = userRepository.save(User.builder()
                .email("mgr.beta@shiftops.com")
                .passwordHash("hashed")
                .fullName("Carol Manager Beta")
                .role(Role.MANAGER)
                .primaryBranch(branchBeta)
                .isActive(true)
                .build());

        staffAlpha1 = userRepository.save(User.builder()
                .email("staff.alpha1@shiftops.com")
                .passwordHash("hashed")
                .fullName("Dave Staff Alpha 1")
                .role(Role.STAFF)
                .primaryBranch(branchAlpha)
                .isActive(true)
                .build());

        staffAlpha2 = userRepository.save(User.builder()
                .email("staff.alpha2@shiftops.com")
                .passwordHash("hashed")
                .fullName("Eve Staff Alpha 2")
                .role(Role.STAFF)
                .primaryBranch(branchAlpha)
                .isActive(true)
                .build());

        staffBeta = userRepository.save(User.builder()
                .email("staff.beta@shiftops.com")
                .passwordHash("hashed")
                .fullName("Frank Staff Beta")
                .role(Role.STAFF)
                .primaryBranch(branchBeta)
                .isActive(true)
                .build());

        inactiveStaff = userRepository.save(User.builder()
                .email("inactive@shiftops.com")
                .passwordHash("hashed")
                .fullName("Grace Inactive")
                .role(Role.STAFF)
                .primaryBranch(branchAlpha)
                .isActive(false)
                .build());

        ownerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAlphaToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerAlpha));
        managerBetaToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerBeta));
        staffAlpha1Token = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffAlpha1));
        staffBetaToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffBeta));
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
        itemRepository.deleteAll();
        handoverRepository.deleteAll();
        attendanceRepository.deleteAll();
        taskRepository.deleteAll();
        taskTemplateRepository.deleteAll();
        commentRepository.deleteAll();
        attachmentRepository.deleteAll();
        issueRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();
    }

    // 1. Create announcement
    @Test
    void test01_createAnnouncement() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Store Policy Update")
                .content("New opening checklist rules in effect.")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishImmediately(true)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", managerAlphaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Store Policy Update"))
                .andExpect(jsonPath("$.data.published").value(true));

        assertThat(announcementRepository.count()).isEqualTo(1);
    }

    // 2. Branch-scoped announcement
    @Test
    void test02_branchScopedAnnouncement() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Alpha Branch Announcement")
                .content("Only for Alpha branch staff.")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishImmediately(true)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", managerAlphaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.branchId").value(branchAlpha.getId().toString()))
                .andExpect(jsonPath("$.data.targetType").value("BRANCH"));

        Announcement saved = announcementRepository.findAll().get(0);
        assertThat(saved.getBranch().getId()).isEqualTo(branchAlpha.getId());
    }

    // 3. Owner cross-branch announcement
    @Test
    void test03_ownerCrossBranchAnnouncement() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("All-Hands Organization Memo")
                .content("Company-wide town hall Friday.")
                .targetType(AnnouncementTargetType.ORGANIZATION)
                .publishImmediately(true)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.targetType").value("ORGANIZATION"));

        Announcement saved = announcementRepository.findAll().get(0);
        assertThat(saved.getTargetType()).isEqualTo(AnnouncementTargetType.ORGANIZATION);
    }

    // 4. Manager cross-branch rejection
    @Test
    void test04_managerCrossBranchRejection() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Unauthorized announcement")
                .content("Manager Beta trying to post on Alpha")
                .targetType(AnnouncementTargetType.BRANCH)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", managerBetaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // 5. Staff cannot create announcement
    @Test
    void test05_staffCannotCreateAnnouncement() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Staff broadcast attempt")
                .content("Unauthorized content")
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", staffAlpha1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // 6. Relevant staff receive notification
    @Test
    void test06_relevantStaffReceiveNotification() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Alpha Team Meeting")
                .content("Mandatory meeting at 10am")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishImmediately(true)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", managerAlphaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Staff in Branch Alpha must receive the notification
        List<Notification> alpha1Notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(alpha1Notifications).hasSize(1);
        assertThat(alpha1Notifications.get(0).getType()).isEqualTo(NotificationType.ANNOUNCEMENT_PUBLISHED);
        assertThat(alpha1Notifications.get(0).getTitle()).contains("Alpha Team Meeting");
    }

    // 7. Unrelated branch staff do not receive notification
    @Test
    void test07_unrelatedBranchStaffDoNotReceiveNotification() throws Exception {
        CreateAnnouncementRequest request = CreateAnnouncementRequest.builder()
                .title("Alpha Exclusive Notice")
                .content("Only for Alpha")
                .targetType(AnnouncementTargetType.BRANCH)
                .publishImmediately(true)
                .build();

        mockMvc.perform(post("/v1/branches/{branchId}/announcements", branchAlpha.getId())
                        .header("Authorization", managerAlphaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Staff in Branch Beta must NOT receive the notification
        List<Notification> betaNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffBeta.getId()))
                .toList();

        assertThat(betaNotifications).isEmpty();
    }

    // 8. Task assignment creates notification
    @Test
    void test08_taskAssignmentCreatesNotification() {
        Shift shift = createPublishedShiftWithStaff(branchAlpha, staffAlpha1);
        ShiftAssignment sa = shift.getAssignments().get(0);

        CreateAdHocTaskRequest request = CreateAdHocTaskRequest.builder()
                .title("Clean Coffee Machine")
                .priority(TaskPriority.NORMAL)
                .build();

        var taskResponse = taskService.createAdHocTask(sa.getId(), request, UserPrincipal.create(managerAlpha));

        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotificationType.TASK_ASSIGNED);
        assertThat(notifications.get(0).getReferenceType()).isEqualTo(ReferenceType.TASK);
        assertThat(notifications.get(0).getReferenceId()).isEqualTo(taskResponse.id());
    }

    // 9. Issue assignment creates notification
    @Test
    void test09_issueAssignmentCreatesNotification() {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchAlpha)
                .reportedBy(staffAlpha2)
                .title("Espresso Machine Leaking")
                .description("Water pooled under steam wand")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.HIGH)
                .status(IssueStatus.OPEN)
                .build());

        issueService.assignIssue(issue.getId(), new AssignIssueRequest(staffAlpha1.getId()), UserPrincipal.create(managerAlpha));

        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotificationType.ISSUE_ASSIGNED);
        assertThat(notifications.get(0).getReferenceType()).isEqualTo(ReferenceType.ISSUE);
        assertThat(notifications.get(0).getReferenceId()).isEqualTo(issue.getId());
    }

    // 10. Issue update creates notification
    @Test
    void test10_issueUpdateCreatesNotification() {
        Issue issue = issueRepository.save(Issue.builder()
                .branch(branchAlpha)
                .reportedBy(staffAlpha1)
                .assignedTo(staffAlpha2)
                .title("Broken Light Fixture")
                .description("Flickering in backroom")
                .category(IssueCategory.FACILITY)
                .priority(IssuePriority.LOW)
                .status(IssueStatus.IN_PROGRESS)
                .build());

        UpdateIssueStatusRequest updateRequest = new UpdateIssueStatusRequest(IssueStatus.RESOLVED, "Fixed broken wire");
        issueService.updateIssueStatus(issue.getId(), updateRequest, UserPrincipal.create(managerAlpha));

        // Reporter (staffAlpha1) should receive status update notification
        List<Notification> reporterNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(reporterNotifications).hasSize(1);
        assertThat(reporterNotifications.get(0).getType()).isEqualTo(NotificationType.ISSUE_UPDATED);
        assertThat(reporterNotifications.get(0).getMessage()).contains("RESOLVED");
    }

    // 11. Handover submission creates notification
    @Test
    void test11_handoverSubmissionCreatesNotification() {
        Shift shift = createPublishedShiftWithStaff(branchAlpha, staffAlpha1);
        ShiftHandover handover = handoverRepository.save(ShiftHandover.builder()
                .shift(shift)
                .branch(branchAlpha)
                .status(HandoverStatus.DRAFT)
                .notes("All good")
                .build());

        handoverService.submitHandover(handover.getId(), UserPrincipal.create(staffAlpha1));

        // Branch manager (managerAlpha) should receive HANDOVER_SUBMITTED notification
        List<Notification> mgrNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(managerAlpha.getId()))
                .toList();

        assertThat(mgrNotifications).hasSize(1);
        assertThat(mgrNotifications.get(0).getType()).isEqualTo(NotificationType.HANDOVER_SUBMITTED);
        assertThat(mgrNotifications.get(0).getReferenceId()).isEqualTo(handover.getId());

        // Submitter (staffAlpha1) should NOT receive a notification for their own submission
        List<Notification> selfNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();
        assertThat(selfNotifications).isEmpty();
    }

    // 12. Notification appears in recipient inbox
    @Test
    void test12_notificationAppearsInRecipientInbox() throws Exception {
        notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Restock Beans",
                "Restock dark roast beans in hopper",
                ReferenceType.TASK,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/v1/notifications/my")
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title").value("Restock Beans"))
                .andExpect(jsonPath("$.data.content[0].read").value(false));
    }

    // 13. Unread count
    @Test
    void test13_unreadCount() throws Exception {
        notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task 1",
                "Msg 1",
                ReferenceType.TASK,
                UUID.randomUUID()
        );
        notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task 2",
                "Msg 2",
                ReferenceType.TASK,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/v1/notifications/unread-count")
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(2));
    }

    // 14. Mark notification read
    @Test
    void test14_markNotificationRead() throws Exception {
        Notification n = notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Unread Task",
                "Msg",
                ReferenceType.TASK,
                UUID.randomUUID()
        ).orElseThrow();

        mockMvc.perform(patch("/v1/notifications/{id}/read", n.getId())
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.read").value(true))
                .andExpect(jsonPath("$.data.readAt").isNotEmpty());

        mockMvc.perform(get("/v1/notifications/unread-count")
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(0));
    }

    // 15. Mark all read
    @Test
    void test15_markAllRead() throws Exception {
        notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task 1",
                "Msg 1",
                ReferenceType.TASK,
                UUID.randomUUID()
        );
        notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task 2",
                "Msg 2",
                ReferenceType.TASK,
                UUID.randomUUID()
        );

        mockMvc.perform(patch("/v1/notifications/read-all")
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(2));

        mockMvc.perform(get("/v1/notifications/unread-count")
                        .header("Authorization", staffAlpha1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(0));
    }

    // 16. Duplicate event does not create duplicate notification
    @Test
    void test16_duplicateEventDoesNotCreateDuplicateNotification() {
        UUID refId = UUID.randomUUID();

        var first = notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "You are scheduled",
                ReferenceType.SHIFT,
                refId
        );
        assertThat(first).isPresent();

        var second = notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "You are scheduled",
                ReferenceType.SHIFT,
                refId
        );
        assertThat(second).isEmpty();

        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    // 17. Transaction rollback does not create false notification
    @Test
    void test17_transactionRollbackDoesNotCreateFalseNotification() {
        try {
            rollbackTestService.emitEventAndRollback(staffAlpha1.getId(), UUID.randomUUID());
        } catch (RuntimeException ignored) {
            // Expected rollback
        }

        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).isEmpty();
    }

    // 18. Shift reminder created
    @Test
    void test18_shiftReminderCreated() {
        // Current clock is BASE_TIME (08:00:00Z). Create published shift starting at 08:30:00Z (+30 min)
        Instant shiftStart = BASE_TIME.plus(Duration.ofMinutes(30));
        Instant shiftEnd = BASE_TIME.plus(Duration.ofHours(8));
        Shift shift = createPublishedShiftWithTimes(branchAlpha, staffAlpha1, shiftStart, shiftEnd);

        int sent = shiftReminderScheduler.sendShiftReminders();
        assertThat(sent).isEqualTo(1);

        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotificationType.SHIFT_REMINDER);
        assertThat(notifications.get(0).getReferenceId()).isEqualTo(shift.getId());
    }

    // 19. Shift reminder idempotency
    @Test
    void test19_shiftReminderIdempotency() {
        Instant shiftStart = BASE_TIME.plus(Duration.ofMinutes(30));
        Instant shiftEnd = BASE_TIME.plus(Duration.ofHours(8));
        createPublishedShiftWithTimes(branchAlpha, staffAlpha1, shiftStart, shiftEnd);

        int firstRun = shiftReminderScheduler.sendShiftReminders();
        assertThat(firstRun).isEqualTo(1);

        int secondRun = shiftReminderScheduler.sendShiftReminders();
        assertThat(secondRun).isEqualTo(0);

        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    // 20. Overnight shift reminder
    @Test
    void test20_overnightShiftReminder() {
        // Shift starts at 22:30 UTC and ends at 06:30 UTC next day
        Instant clockTime = Instant.parse("2026-10-15T22:00:00Z");
        mutableClock.setInstant(clockTime);

        Instant shiftStart = clockTime.plus(Duration.ofMinutes(30)); // 22:30
        Instant shiftEnd = clockTime.plus(Duration.ofHours(8));      // 06:00 next day
        Shift overnightShift = createPublishedShiftWithTimes(branchAlpha, staffAlpha1, shiftStart, shiftEnd);

        int sent = shiftReminderScheduler.sendShiftReminders();
        assertThat(sent).isEqualTo(1);

        List<Notification> notifications = notificationRepository.findAll().stream()
                .filter(n -> n.getRecipient().getId().equals(staffAlpha1.getId()))
                .toList();

        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotificationType.SHIFT_REMINDER);
        assertThat(notifications.get(0).getReferenceId()).isEqualTo(overnightShift.getId());
    }

    // 21. Inactive user behavior
    @Test
    void test21_inactiveUserBehavior() {
        // Try creating notification directly for inactive staff
        var result = notificationService.createNotification(
                inactiveStaff.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Title",
                "Msg",
                ReferenceType.SHIFT,
                UUID.randomUUID()
        );
        assertThat(result).isEmpty();

        // Also assign inactive staff to a shift starting in 30 mins -> scheduler must skip
        Instant shiftStart = BASE_TIME.plus(Duration.ofMinutes(30));
        Instant shiftEnd = BASE_TIME.plus(Duration.ofHours(8));
        createPublishedShiftWithTimes(branchAlpha, inactiveStaff, shiftStart, shiftEnd);

        int sent = shiftReminderScheduler.sendShiftReminders();
        assertThat(sent).isEqualTo(0);

        assertThat(notificationRepository.count()).isEqualTo(0);
    }

    // 22. Authorization
    @Test
    void test22_authorization() throws Exception {
        // Unauthenticated access to /my notifications returns 401
        mockMvc.perform(get("/v1/notifications/my"))
                .andExpect(status().isUnauthorized());

        // Create a notification belonging to staffAlpha1
        Notification n = notificationService.createNotification(
                staffAlpha1.getId(),
                NotificationType.TASK_ASSIGNED,
                "Secret Task",
                "Private",
                ReferenceType.TASK,
                UUID.randomUUID()
        ).orElseThrow();

        // staffBeta attempts to mark staffAlpha1's notification as read -> 403 Forbidden
        mockMvc.perform(patch("/v1/notifications/{id}/read", n.getId())
                        .header("Authorization", staffBetaToken))
                .andExpect(status().isForbidden());
    }

    // Helper methods
    private Shift createPublishedShiftWithStaff(Branch branch, User staff) {
        Instant start = BASE_TIME.plus(Duration.ofHours(1));
        Instant end = BASE_TIME.plus(Duration.ofHours(9));
        return createPublishedShiftWithTimes(branch, staff, start, end);
    }

    private Shift createPublishedShiftWithTimes(Branch branch, User staff, Instant start, Instant end) {
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branch)
                .name("Morning Shift")
                .startTime(start)
                .endTime(end)
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment assignment = ShiftAssignment.builder()
                .shift(shift)
                .user(staff)
                .assignedBy(managerAlpha)
                .assignedAt(BASE_TIME)
                .build();

        shiftAssignmentRepository.save(assignment);
        shift.getAssignments().add(assignment);
        return shiftRepository.save(shift);
    }
}
