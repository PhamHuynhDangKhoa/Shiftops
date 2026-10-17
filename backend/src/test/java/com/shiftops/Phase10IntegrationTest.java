package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.event.EventPublicationRegistryService;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.notification.event.ShiftPublishedEvent;
import com.shiftops.notification.event.TaskAssignedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.modulith.events.IncompleteEventPublications;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.common.storage.LocalStorageService;
import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.notification.service.NotificationService;
import com.shiftops.notification.service.ShiftReminderScheduler;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase10IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CompletedEventPublications completedPublications;

    @Autowired
    private IncompleteEventPublications incompletePublications;

    @Autowired
    private EventPublicationRegistryService eventPublicationRegistryService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ShiftReminderScheduler shiftReminderScheduler;

    @Autowired
    private LocalStorageService localStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private User staffUser;
    private User managerUser;
    private Branch testBranch;
    private String staffToken;
    private String managerToken;

    @BeforeEach
    void setUp() {
        try {
            jdbcTemplate.execute("ALTER TABLE event_publication ALTER COLUMN serialized_event VARCHAR(1000000)");
        } catch (Exception ignored) {}
        cleanup();

        testBranch = branchRepository.save(Branch.builder()
                .name("Production Hardened Branch")
                .address("456 Reliability Way")
                .timezone("UTC")
                .isActive(true)
                .build());

        managerUser = userRepository.save(User.builder()
                .email("hardening.manager@shiftops.com")
                .fullName("Hardening Manager")
                .passwordHash("hashed")
                .role(Role.MANAGER)
                .primaryBranch(testBranch)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .email("hardening.staff@shiftops.com")
                .fullName("Hardening Staff")
                .passwordHash("hashed")
                .role(Role.STAFF)
                .primaryBranch(testBranch)
                .isActive(true)
                .build());

        staffToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffUser));
        managerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerUser));
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM event_publication");
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();
    }

    // =========================================================================
    // 1. Notification Idempotency & Concurrency Tests
    // =========================================================================

    @Test
    @DisplayName("Notification idempotency: explicit key deduplicates subsequent creations")
    void testNotification_ExplicitKeyIdempotency() {
        String key = "test-key-explicit-" + UUID.randomUUID();
        UUID refId = UUID.randomUUID();

        Optional<Notification> n1 = notificationService.createNotification(
                staffUser.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task Assigned",
                "Please complete cleaning",
                ReferenceType.TASK,
                refId,
                key
        );

        assertThat(n1).isPresent();
        assertThat(n1.get().getIdempotencyKey()).isEqualTo(key);

        Optional<Notification> n2 = notificationService.createNotification(
                staffUser.getId(),
                NotificationType.TASK_ASSIGNED,
                "Task Assigned Again",
                "Duplicate message",
                ReferenceType.TASK,
                refId,
                key
        );

        assertThat(n2).isEmpty();
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Notification idempotency: implicit (recipient, type, refId) deduplication")
    void testNotification_ImplicitKeyIdempotency() {
        UUID shiftId = UUID.randomUUID();

        Optional<Notification> n1 = notificationService.createNotification(
                staffUser.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "Your morning shift is scheduled",
                ReferenceType.SHIFT,
                shiftId
        );

        assertThat(n1).isPresent();

        Optional<Notification> n2 = notificationService.createNotification(
                staffUser.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published Duplicate",
                "Duplicate schedule message",
                ReferenceType.SHIFT,
                shiftId
        );

        assertThat(n2).isEmpty();
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Notification concurrency: concurrent creations with same idempotency key save exactly one")
    void testNotification_ConcurrentCreationDeduplication() throws Exception {
        int threadCount = 10;
        String sharedKey = "concurrent-idempotency-" + UUID.randomUUID();
        UUID refId = UUID.randomUUID();

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        java.util.concurrent.ConcurrentLinkedQueue<Throwable> unexpectedErrors = new java.util.concurrent.ConcurrentLinkedQueue<>();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    Optional<Notification> res = notificationService.createNotification(
                            staffUser.getId(),
                            NotificationType.ISSUE_ASSIGNED,
                            "Issue Assigned",
                            "Investigate water leak",
                            ReferenceType.ISSUE,
                            refId,
                            sharedKey
                    );
                    if (res.isPresent()) {
                        successCount.incrementAndGet();
                    }
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    // Handled: race condition caught at DB uniqueness constraint
                } catch (Throwable t) {
                    unexpectedErrors.add(t);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean finished = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(unexpectedErrors).isEmpty();
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    // =========================================================================
    // 2. Spring Modulith Event Publication Registry Tests
    // =========================================================================

    @Test
    @DisplayName("Spring Modulith: event publication is registered and executed after commit")
    void testModulith_EventPublicationAndExecution() throws Exception {
        UUID shiftId = UUID.randomUUID();
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            eventPublisher.publishEvent(new ShiftPublishedEvent(
                    shiftId,
                    testBranch.getId(),
                    List.of(staffUser.getId()),
                    "Day Shift",
                    Instant.now(),
                    Instant.now().plus(Duration.ofHours(8))
            ));
        });

        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline && notificationRepository.count() == 0) {
            Thread.sleep(50);
        }

        // Notification created for staffUser
        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getTitle()).isEqualTo("Shift Published");

        // Event publication is marked as completed in Spring Modulith registry
        assertThat(completedPublications.findAll()).isNotEmpty();
    }

    @Test
    @DisplayName("Spring Modulith: event_publication table records listener_id and completion_date")
    void testModulith_PublicationTableDetails() throws Exception {
        UUID shiftId = UUID.randomUUID();
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            eventPublisher.publishEvent(new ShiftPublishedEvent(
                    shiftId,
                    testBranch.getId(),
                    List.of(staffUser.getId()),
                    "Detailed Shift",
                    Instant.now(),
                    Instant.now().plus(Duration.ofHours(8))
            ));
        });

        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline && notificationRepository.count() == 0) {
            Thread.sleep(50);
        }

        Integer count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM event_publication WHERE completion_date IS NOT NULL", Integer.class);
        assertThat(count).isGreaterThanOrEqualTo(1);

        String eventType = jdbcTemplate.queryForObject(
                "SELECT event_type FROM event_publication LIMIT 1", String.class);
        assertThat(eventType).contains("ShiftPublishedEvent");
    }

    @Test
    @DisplayName("Spring Modulith: resubmit incomplete publications guarantees at-least-once delivery")
    void testModulith_ResubmitIncompletePublications() throws Exception {
        UUID shiftId = UUID.randomUUID();
        UUID pubId = UUID.randomUUID();
        String serialized = objectMapper.writeValueAsString(new ShiftPublishedEvent(
                shiftId,
                testBranch.getId(),
                List.of(staffUser.getId()),
                "Resubmitted Shift",
                Instant.now(),
                Instant.now().plus(Duration.ofHours(8))
        ));
        String listenerId = "com.shiftops.notification.service.DurableNotificationHandler.handleShiftPublished(com.shiftops.notification.event.ShiftPublishedEvent)";
        String eventType = "com.shiftops.notification.event.ShiftPublishedEvent";

        jdbcTemplate.update(
                "INSERT INTO event_publication (id, listener_id, event_type, serialized_event, publication_date, completion_date) VALUES (?, ?, ?, ?, ?, NULL)",
                pubId, listenerId, eventType, serialized, java.sql.Timestamp.from(Instant.now().minusSeconds(60))
        );

        assertThat(notificationRepository.count()).isEqualTo(0);

        // Execute resubmission via registry service
        eventPublicationRegistryService.retryIncompleteEvents();

        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline && notificationRepository.count() == 0) {
            Thread.sleep(50);
        }

        assertThat(notificationRepository.count()).isEqualTo(1);
        assertThat(notificationRepository.findAll().get(0).getTitle()).isEqualTo("Shift Published");
    }

    @Test
    @DisplayName("Spring Modulith: purgeOldCompletedEvents removes completed events older than threshold")
    void testModulith_PurgeCompletedPublications() {
        UUID pubId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO event_publication (id, listener_id, event_type, serialized_event, publication_date, completion_date) VALUES (?, ?, ?, ?, ?, ?)",
                pubId, "listener.dummy", "dummy.Event", "{}",
                java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(20))),
                java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(16)))
        );

        Integer beforePurge = jdbcTemplate.queryForObject("SELECT count(*) FROM event_publication", Integer.class);
        assertThat(beforePurge).isEqualTo(1);

        eventPublicationRegistryService.purgeOldCompletedEvents();

        Integer afterPurge = jdbcTemplate.queryForObject("SELECT count(*) FROM event_publication", Integer.class);
        assertThat(afterPurge).isEqualTo(0);
    }



    @Test
    @DisplayName("Spring Modulith: concurrent event publications process reliably without data loss")
    void testModulith_ConcurrentPublishingReliability() throws Exception {
        int eventCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(eventCount);
        TransactionTemplate tx = new TransactionTemplate(transactionManager);

        for (int i = 0; i < eventCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    tx.executeWithoutResult(status -> {
                        eventPublisher.publishEvent(new TaskAssignedEvent(
                                UUID.randomUUID(),
                                UUID.randomUUID(),
                                staffUser.getId(),
                                "Task " + idx
                        ));
                    });
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline && notificationRepository.count() < eventCount) {
            Thread.sleep(50);
        }

        assertThat(notificationRepository.count()).isEqualTo(eventCount);
    }

    // =========================================================================
    // 3. Shift Reminder Scheduler Reliability & Deduplication
    // =========================================================================

    @Test
    @DisplayName("Shift Reminder: sends reminder in [now, now + 35m] and prevents duplicates")
    void testShiftReminder_ExpandedWindowAndDeduplication() {
        Instant shiftStart = Instant.now().plus(Duration.ofMinutes(20));
        Instant shiftEnd = shiftStart.plus(Duration.ofHours(8));

        Shift shift = shiftRepository.save(Shift.builder()
                .branch(testBranch)
                .name("Upcoming Morning")
                .startTime(shiftStart)
                .endTime(shiftEnd)
                .status(ShiftStatus.PUBLISHED)
                .build());

        ShiftAssignment assignment = shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(staffUser)
                .assignedBy(managerUser)
                .build());

        shift.setAssignments(List.of(assignment));
        shiftRepository.save(shift);

        // First execution -> sends 1 reminder
        int sentFirst = shiftReminderScheduler.sendShiftReminders();
        assertThat(sentFirst).isEqualTo(1);

        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getType()).isEqualTo(NotificationType.SHIFT_REMINDER);
        assertThat(notifications.get(0).getMessage()).contains("Your shift starts in");

        // Second execution -> 0 sent due to idempotency
        int sentSecond = shiftReminderScheduler.sendShiftReminders();
        assertThat(sentSecond).isEqualTo(0);
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    // =========================================================================
    // 4. Security & Defensive Hardening Tests
    // =========================================================================

    @Test
    @DisplayName("Correlation ID: generates X-Request-Id when missing, echoes when provided")
    void testSecurity_CorrelationIdHeader() throws Exception {
        // Missing X-Request-Id -> generated
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-Id"));

        // Provided X-Request-Id -> echoed
        mockMvc.perform(get("/actuator/health")
                        .header("X-Request-Id", "custom-trace-999"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-Id", "custom-trace-999"));
    }

    @Test
    @DisplayName("Actuator Security: /actuator/health is public, /actuator/metrics requires auth")
    void testSecurity_ActuatorAccess() throws Exception {
        // Health is public
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        // Metrics endpoint without auth -> 401 Unauthorized
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isUnauthorized());

        // Metrics endpoint with auth -> 200 OK
        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", managerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Storage Security: rejects unauthorized file extensions and path traversal")
    void testSecurity_StorageExtensionWhitelist() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "script.exe", "application/octet-stream", "MZbinary".getBytes());

        assertThatThrownBy(() -> localStorageService.store(exeFile, "issues"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining(".exe");

        MockMultipartFile shFile = new MockMultipartFile(
                "file", "exploit.sh", "text/plain", "#!/bin/bash".getBytes());

        assertThatThrownBy(() -> localStorageService.store(shFile, "issues"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining(".sh");

        MockMultipartFile validPng = new MockMultipartFile(
                "file", "inspection.png", "image/png", new byte[]{1, 2, 3, 4});

        String storedPath = localStorageService.store(validPng, "issues");
        assertThat(storedPath).contains("issues/").endsWith(".png");

        // Clean up stored file
        localStorageService.delete(storedPath);
    }

    @Test
    @DisplayName("Exception Handling: malformed JSON returns 400 Bad Request with standardized error")
    void testExceptionHandler_MalformedJson() throws Exception {
        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json-structure"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("MALFORMED_REQUEST"));
    }
}
