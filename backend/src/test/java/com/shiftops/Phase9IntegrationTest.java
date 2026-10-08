package com.shiftops;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.shiftops.announcement.repository.AnnouncementRepository;
import com.shiftops.attendance.dto.AttendanceResponse;
import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.attendance.service.AttendanceService;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.handover.entity.HandoverStatus;
import com.shiftops.handover.entity.ShiftHandover;
import com.shiftops.handover.repository.HandoverItemRepository;
import com.shiftops.handover.repository.ShiftHandoverRepository;
import com.shiftops.handover.service.ShiftHandoverService;
import com.shiftops.issue.dto.UpdateIssueStatusRequest;
import com.shiftops.issue.entity.Issue;
import com.shiftops.issue.entity.IssueCategory;
import com.shiftops.issue.entity.IssuePriority;
import com.shiftops.issue.entity.IssueStatus;
import com.shiftops.issue.repository.IssueAttachmentRepository;
import com.shiftops.issue.repository.IssueCommentRepository;
import com.shiftops.issue.repository.IssueRepository;
import com.shiftops.issue.service.IssueService;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.notification.service.NotificationService;
import com.shiftops.realtime.dto.RealtimeEvent;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.task.dto.UpdateTaskStatusRequest;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class Phase9IntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskTemplateRepository taskTemplateRepository;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private IssueCommentRepository issueCommentRepository;

    @Autowired
    private IssueAttachmentRepository issueAttachmentRepository;

    @Autowired
    private ShiftHandoverRepository shiftHandoverRepository;

    @Autowired
    private HandoverItemRepository handoverItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private IssueService issueService;

    @Autowired
    private ShiftHandoverService handoverService;

    @Autowired
    private NotificationService notificationService;

    private Branch branch1;
    private Branch branch2;
    private User managerUser;
    private User staffUser;
    private User ownerUser;
    private User otherManagerUser;

    private String managerToken;
    private String staffToken;
    private String ownerToken;
    private String otherManagerToken;

    private UserPrincipal managerPrincipal;
    private UserPrincipal staffPrincipal;
    private UserPrincipal ownerPrincipal;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        tearDown();

        branch1 = branchRepository.save(Branch.builder()
                .name("Branch Alpha")
                .timezone("UTC")
                .isActive(true)
                .build());

        branch2 = branchRepository.save(Branch.builder()
                .name("Branch Beta")
                .timezone("UTC")
                .isActive(true)
                .build());

        managerUser = userRepository.save(User.builder()
                .email("manager9@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branch1)
                .isActive(true)
                .build());

        otherManagerUser = userRepository.save(User.builder()
                .email("managerbeta9@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Beta")
                .role(Role.MANAGER)
                .primaryBranch(branch2)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .email("staff9@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Alpha")
                .role(Role.STAFF)
                .primaryBranch(branch1)
                .isActive(true)
                .build());

        ownerUser = userRepository.save(User.builder()
                .email("owner9@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Owner All")
                .role(Role.OWNER)
                .primaryBranch(null)
                .isActive(true)
                .build());

        managerPrincipal = UserPrincipal.create(managerUser);
        staffPrincipal = UserPrincipal.create(staffUser);
        ownerPrincipal = UserPrincipal.create(ownerUser);

        managerToken = jwtTokenProvider.generateToken(managerPrincipal);
        otherManagerToken = jwtTokenProvider.generateToken(UserPrincipal.create(otherManagerUser));
        staffToken = jwtTokenProvider.generateToken(staffPrincipal);
        ownerToken = jwtTokenProvider.generateToken(ownerPrincipal);

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(mapper);
        stompClient.setMessageConverter(converter);
    }

    @AfterEach
    void tearDown() {
        if (stompClient != null && stompClient.isRunning()) {
            stompClient.stop();
        }
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
        handoverItemRepository.deleteAll();
        shiftHandoverRepository.deleteAll();
        issueCommentRepository.deleteAll();
        issueAttachmentRepository.deleteAll();
        issueRepository.deleteAll();
        taskRepository.deleteAll();
        taskTemplateRepository.deleteAll();
        attendanceRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/api/ws";
    }

    private CompletableFuture<StompSession> connectStomp(String token) {
        StompHeaders connectHeaders = new StompHeaders();
        if (token != null) {
            connectHeaders.add("Authorization", "Bearer " + token);
        }

        CompletableFuture<StompSession> future = new CompletableFuture<>();
        stompClient.connectAsync(getWsUrl(), (WebSocketHttpHeaders) null, connectHeaders, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                future.complete(session);
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                future.completeExceptionally(exception);
            }
        });
        return future;
    }

    // ==========================================
    // 1. Authenticated Connection
    // ==========================================
    @Test
    void test1_AuthenticatedConnection_Succeeds() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        assertThat(session.isConnected()).isTrue();
        session.disconnect();
    }

    // ==========================================
    // 2. Unauthenticated Connection Rejected
    // ==========================================
    @Test
    void test2_UnauthenticatedConnection_Rejected() {
        CompletableFuture<StompSession> future = connectStomp(null);
        assertThat(future).failsWithin(5, TimeUnit.SECONDS);
    }

    @Test
    void test2b_InvalidTokenConnection_Rejected() {
        CompletableFuture<StompSession> future = connectStomp("invalid.jwt.token");
        assertThat(future).failsWithin(5, TimeUnit.SECONDS);
    }

    // ==========================================
    // 3. Branch Authorization
    // ==========================================
    @Test
    void test3_BranchAuthorization_ManagerSubscribesToOwnBranch_Succeeds() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        CompletableFuture<StompHeaders> subFuture = new CompletableFuture<>();

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                subFuture.complete(headers);
            }
        });

        Thread.sleep(300);
        assertThat(session.isConnected()).isTrue();
        session.disconnect();
    }

    @Test
    void test4_BranchAuthorization_ManagerSubscribesToForeignBranch_Rejected() throws Exception {
        BlockingQueue<String> errors = new LinkedBlockingQueue<>();
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + managerToken);

        CompletableFuture<StompSession> future = new CompletableFuture<>();
        stompClient.connectAsync(getWsUrl(), (WebSocketHttpHeaders) null, connectHeaders, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                future.complete(session);
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if ("ERROR".equals(headers.get("command"))) {
                    errors.add("ERROR_FRAME");
                }
            }

            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                errors.add(exception.getMessage());
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                errors.add("TRANSPORT_ERROR: " + exception.getMessage());
            }
        });

        StompSession session = future.get(5, TimeUnit.SECONDS);

        // Subscribe to foreign branch2 (manager belongs to branch1)
        session.subscribe("/topic/branches/" + branch2.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {}
        });

        // Error frame or transport disconnect occurs within 3 seconds
        String error = errors.poll(3, TimeUnit.SECONDS);
        assertThat(error).isNotNull();
    }

    @Test
    void test5_BranchAuthorization_StaffSubscribesToBranchOperations_Rejected() throws Exception {
        BlockingQueue<String> errors = new LinkedBlockingQueue<>();
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + staffToken);

        CompletableFuture<StompSession> future = new CompletableFuture<>();
        stompClient.connectAsync(getWsUrl(), (WebSocketHttpHeaders) null, connectHeaders, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                future.complete(session);
            }

            @Override
            public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                errors.add(exception.getMessage());
            }

            @Override
            public void handleTransportError(StompSession session, Throwable exception) {
                errors.add("TRANSPORT_ERROR: " + exception.getMessage());
            }
        });

        StompSession session = future.get(5, TimeUnit.SECONDS);

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {}
        });

        String error = errors.poll(3, TimeUnit.SECONDS);
        assertThat(error).isNotNull();
    }

    // ==========================================
    // 4. User-Specific Notification Delivery & Unread Count Update
    // ==========================================
    @Test
    void test6_UserSpecificNotificationDelivery_And_UnreadCount() throws Exception {
        StompSession session = connectStomp(staffToken).get(5, TimeUnit.SECONDS);
        BlockingQueue<RealtimeEvent<?>> receivedNotifications = new LinkedBlockingQueue<>();

        session.subscribe("/user/queue/notifications", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealtimeEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof RealtimeEvent<?> re) {
                    receivedNotifications.add(re);
                }
            }
        });

        // Give subscription a moment to register on broker
        Thread.sleep(300);

        // Trigger a notification for staffUser
        notificationService.createNotification(
                staffUser.getId(),
                NotificationType.TASK_ASSIGNED,
                "New Task Assigned",
                "Please clean the counter",
                ReferenceType.TASK,
                UUID.randomUUID()
        );

        RealtimeEvent<?> event = receivedNotifications.poll(5, TimeUnit.SECONDS);
        assertThat(event).isNotNull();
        assertThat(event.eventType()).isEqualTo("NOTIFICATION_CREATED");

        // The payload map contains the notification and unreadCount
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) event.payload();
        assertThat(payload.containsKey("notification")).isTrue();
        assertThat(payload.containsKey("unreadCount")).isTrue();
        assertThat(((Number) payload.get("unreadCount")).intValue()).isGreaterThanOrEqualTo(1);

        session.disconnect();
    }

    // ==========================================
    // 5. Staff Check-In & Check-Out Events Delivered to Branch Dashboard
    // ==========================================
    @Test
    void test8_StaffCheckInAndCheckOutEvents_DeliveredToBranchDashboard() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        BlockingQueue<RealtimeEvent<?>> receivedOperations = new LinkedBlockingQueue<>();

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealtimeEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof RealtimeEvent<?> re) {
                    receivedOperations.add(re);
                }
            }
        });

        Thread.sleep(300);

        // Create shift starting now
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branch1)
                .name("Morning Shift")
                .startTime(now)
                .endTime(now.plus(8, ChronoUnit.HOURS))
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment sa = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffUser)
                .assignedBy(managerUser)
                .assignedAt(now)
                .build());

        // Perform staff check-in
        attendanceService.checkIn(sa.getId(), staffPrincipal);

        RealtimeEvent<?> checkInEvent = receivedOperations.poll(5, TimeUnit.SECONDS);
        assertThat(checkInEvent).isNotNull();
        assertThat(checkInEvent.eventType()).isEqualTo("STAFF_CHECKED_IN");
        assertThat(checkInEvent.branchId()).isEqualTo(branch1.getId());

        // Perform staff check-out
        attendanceService.checkOut(sa.getId(), staffPrincipal);

        RealtimeEvent<?> checkOutEvent = receivedOperations.poll(5, TimeUnit.SECONDS);
        assertThat(checkOutEvent).isNotNull();
        assertThat(checkOutEvent.eventType()).isEqualTo("STAFF_CHECKED_OUT");
        assertThat(checkOutEvent.branchId()).isEqualTo(branch1.getId());

        session.disconnect();
    }

    // ==========================================
    // 6. Task Completion Event Delivered to Branch Dashboard
    // ==========================================
    @Test
    void test10_TaskCompletionEvent_DeliveredToBranchDashboard() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        BlockingQueue<RealtimeEvent<?>> receivedOperations = new LinkedBlockingQueue<>();

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealtimeEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof RealtimeEvent<?> re) {
                    receivedOperations.add(re);
                }
            }
        });

        Thread.sleep(300);

        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branch1)
                .name("Task Shift")
                .startTime(now)
                .endTime(now.plus(8, ChronoUnit.HOURS))
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment sa = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffUser)
                .assignedBy(managerUser)
                .assignedAt(now)
                .build());

        Task task = taskRepository.save(Task.builder()
                .shiftAssignment(sa)
                .title("Clean espresso machine")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .build());

        // Complete the task
        taskService.updateTaskStatus(task.getId(), new UpdateTaskStatusRequest(TaskStatus.COMPLETED), staffPrincipal);

        RealtimeEvent<?> event = receivedOperations.poll(5, TimeUnit.SECONDS);
        assertThat(event).isNotNull();
        assertThat(event.eventType()).isEqualTo("TASK_COMPLETED");
        assertThat(event.branchId()).isEqualTo(branch1.getId());

        session.disconnect();
    }

    // ==========================================
    // 7. Issue Status Update Event Delivered to Branch Dashboard
    // ==========================================
    @Test
    void test11_IssueStatusChangedEvent_DeliveredToBranchDashboard() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        BlockingQueue<RealtimeEvent<?>> receivedOperations = new LinkedBlockingQueue<>();

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealtimeEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof RealtimeEvent<?> re) {
                    receivedOperations.add(re);
                }
            }
        });

        Thread.sleep(300);

        Issue issue = issueRepository.save(Issue.builder()
                .branch(branch1)
                .reportedBy(staffUser)
                .title("Freezer temperature high")
                .description("Temperature reading is +5C")
                .category(IssueCategory.EQUIPMENT)
                .priority(IssuePriority.HIGH)
                .status(IssueStatus.OPEN)
                .build());

        // Change status to IN_PROGRESS
        issueService.updateIssueStatus(issue.getId(), new UpdateIssueStatusRequest(IssueStatus.IN_PROGRESS, null), managerPrincipal);

        RealtimeEvent<?> event = receivedOperations.poll(5, TimeUnit.SECONDS);
        assertThat(event).isNotNull();
        assertThat(event.eventType()).isEqualTo("ISSUE_STATUS_CHANGED");
        assertThat(event.branchId()).isEqualTo(branch1.getId());

        session.disconnect();
    }

    // ==========================================
    // 8. Handover Submission Event Delivered to Branch Dashboard
    // ==========================================
    @Test
    void test12_HandoverSubmittedEvent_DeliveredToBranchDashboard() throws Exception {
        StompSession session = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        BlockingQueue<RealtimeEvent<?>> receivedOperations = new LinkedBlockingQueue<>();

        session.subscribe("/topic/branches/" + branch1.getId() + "/operations", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RealtimeEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof RealtimeEvent<?> re) {
                    receivedOperations.add(re);
                }
            }
        });

        Thread.sleep(300);

        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branch1)
                .name("Outgoing Shift")
                .startTime(now.minus(8, ChronoUnit.HOURS))
                .endTime(now)
                .status(ShiftStatus.PUBLISHED)
                .build());

        shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffUser)
                .assignedBy(managerUser)
                .assignedAt(now)
                .build());

        ShiftHandover handover = shiftHandoverRepository.save(ShiftHandover.builder()
                .shift(shift)
                .branch(branch1)
                .status(HandoverStatus.DRAFT)
                .notes("Shift debrief notes")
                .build());

        // Submit handover
        handoverService.submitHandover(handover.getId(), staffPrincipal);

        RealtimeEvent<?> event = receivedOperations.poll(5, TimeUnit.SECONDS);
        assertThat(event).isNotNull();
        assertThat(event.eventType()).isEqualTo("HANDOVER_SUBMITTED");
        assertThat(event.branchId()).isEqualTo(branch1.getId());

        session.disconnect();
    }

    // ==========================================
    // 9. Disconnect and Reconnect
    // ==========================================
    @Test
    void test13_DisconnectAndReconnect_Succeeds() throws Exception {
        StompSession session1 = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        assertThat(session1.isConnected()).isTrue();
        session1.disconnect();
        assertThat(session1.isConnected()).isFalse();

        // Reconnect with new session
        StompSession session2 = connectStomp(managerToken).get(5, TimeUnit.SECONDS);
        assertThat(session2.isConnected()).isTrue();
        session2.disconnect();
    }

    // ==========================================
    // 10. REST API Functions Normally When WebSocket Disconnected / Unavailable
    // ==========================================
    @Test
    void test14_RestApiFunctionsNormally_WithoutWebSocket() {
        // Perform attendance, task, and notification creation without any active WebSocket connections
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branch1)
                .name("REST Shift")
                .startTime(now.plus(5, ChronoUnit.MINUTES))
                .endTime(now.plus(8, ChronoUnit.HOURS))
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment sa = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffUser)
                .assignedBy(managerUser)
                .assignedAt(now)
                .build());

        AttendanceResponse attRes = attendanceService.checkIn(sa.getId(), staffPrincipal);
        assertThat(attRes).isNotNull();
        assertThat(attRes.status()).isEqualTo(AttendanceStatus.PRESENT);

        AttendanceResponse checkOutRes = attendanceService.checkOut(sa.getId(), staffPrincipal);
        assertThat(checkOutRes.status()).isEqualTo(AttendanceStatus.COMPLETED);

        // Verification: Database persisted accurately regardless of WebSocket status
        assertThat(attendanceRepository.findByShiftAssignmentId(sa.getId())).isPresent();
    }
}
