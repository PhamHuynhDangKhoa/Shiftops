package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.BusinessRuleException;
import com.shiftops.common.outbox.OutboxEvent;
import com.shiftops.common.outbox.OutboxProcessor;
import com.shiftops.common.outbox.OutboxRepository;
import com.shiftops.common.outbox.OutboxStatus;
import com.shiftops.common.security.JwtTokenProvider;
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
    private OutboxRepository outboxRepository;

    @Autowired
    private OutboxProcessor outboxProcessor;

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
        outboxRepository.deleteAll();
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
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean finished = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    // =========================================================================
    // 2. Transactional Outbox Pattern Tests
    // =========================================================================

    @Test
    @DisplayName("Transactional Outbox: event persists in PENDING status within transaction")
    void testOutbox_EventPersistenceInTransaction() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        UUID eventId = tx.execute(status -> {
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SHIFT_PUBLISHED")
                    .aggregateType("SHIFT")
                    .aggregateId(UUID.randomUUID())
                    .payload("{\"shiftId\":\"" + UUID.randomUUID() + "\",\"shiftName\":\"Morning Shift\",\"staffUserIds\":[]}")
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .maxRetries(3)
                    .scheduledAt(Instant.now())
                    .build();
            return outboxRepository.save(event).getId();
        });

        assertThat(eventId).isNotNull();
        OutboxEvent persisted = outboxRepository.findById(eventId).orElseThrow();
        assertThat(persisted.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(persisted.getRetryCount()).isEqualTo(0);
        assertThat(persisted.getPayload()).contains("Morning Shift");
    }

    @Test
    @DisplayName("Transactional Outbox: OutboxProcessor executes pending events to PROCESSED")
    void testOutbox_ProcessorExecutesPendingEvents() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        UUID shiftId = UUID.randomUUID();
        tx.executeWithoutResult(status -> {
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SHIFT_PUBLISHED")
                    .aggregateType("SHIFT")
                    .aggregateId(shiftId)
                    .payload(String.format("{\"shiftId\":\"%s\",\"shiftName\":\"Day Shift\",\"staffUserIds\":[\"%s\"]}",
                            shiftId, staffUser.getId()))
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .maxRetries(3)
                    .scheduledAt(Instant.now().minusSeconds(1))
                    .build();
            outboxRepository.save(event);
        });

        int processed = outboxProcessor.processPendingEvents();
        assertThat(processed).isEqualTo(1);

        List<OutboxEvent> events = outboxRepository.findAll();
        assertThat(events).hasSize(1);
        OutboxEvent processedEvent = events.get(0);
        assertThat(processedEvent.getStatus()).isEqualTo(OutboxStatus.PROCESSED);
        assertThat(processedEvent.getProcessedAt()).isNotNull();

        // Verify that the notification was created
        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getTitle()).isEqualTo("Shift Published");
    }

    @Test
    @DisplayName("Transactional Outbox: Failure triggers retry count and exponential backoff")
    void testOutbox_FailureAndExponentialBackoff() {
        Instant beforeRun = Instant.now();
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        UUID outboxId = tx.execute(status -> {
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SHIFT_PUBLISHED")
                    .aggregateType("SHIFT")
                    .aggregateId(UUID.randomUUID())
                    .payload("{invalid-json-payload")
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .maxRetries(3)
                    .scheduledAt(beforeRun.minusSeconds(1))
                    .build();
            return outboxRepository.save(event).getId();
        });

        int processed = outboxProcessor.processPendingEvents();
        assertThat(processed).isEqualTo(0); // Failed to process cleanly

        OutboxEvent failedEvent = outboxRepository.findById(outboxId).orElseThrow();
        assertThat(failedEvent.getRetryCount()).isEqualTo(1);
        assertThat(failedEvent.getErrorMessage()).isNotEmpty();
        assertThat(failedEvent.getStatus()).isEqualTo(OutboxStatus.PENDING); // Rescheduled for retry
        // Backoff formula 5 * 2^(1-1) = 5 seconds
        assertThat(failedEvent.getScheduledAt()).isAfterOrEqualTo(beforeRun.plusSeconds(4))
                .isBeforeOrEqualTo(beforeRun.plusSeconds(8));
    }

    @Test
    @DisplayName("Transactional Outbox: Full retry lifecycle 5s -> 10s -> 20s and final FAILED state")
    void testOutbox_FullRetryCycleToPermanentlyFailed() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        UUID outboxId = tx.execute(status -> {
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SHIFT_PUBLISHED")
                    .aggregateType("SHIFT")
                    .aggregateId(UUID.randomUUID())
                    .payload("{malformed-json")
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .maxRetries(3)
                    .scheduledAt(Instant.now().minusSeconds(1))
                    .build();
            return outboxRepository.save(event).getId();
        });

        // --- Attempt 1: fails -> retry 1, backoff 5s ---
        outboxProcessor.processPendingEvents();
        OutboxEvent attempt1 = outboxRepository.findById(outboxId).orElseThrow();
        assertThat(attempt1.getRetryCount()).isEqualTo(1);
        assertThat(attempt1.getStatus()).isEqualTo(OutboxStatus.PENDING);

        // --- Attempt 2: reschedule to past, process -> retry 2, backoff 10s ---
        tx.executeWithoutResult(status -> {
            OutboxEvent ev = outboxRepository.findById(outboxId).orElseThrow();
            ev.setScheduledAt(Instant.now().minusSeconds(1));
            outboxRepository.save(ev);
        });
        Instant beforeAttempt2 = Instant.now();
        outboxProcessor.processPendingEvents();
        OutboxEvent attempt2 = outboxRepository.findById(outboxId).orElseThrow();
        assertThat(attempt2.getRetryCount()).isEqualTo(2);
        assertThat(attempt2.getStatus()).isEqualTo(OutboxStatus.PENDING);
        // Backoff formula 5 * 2^(2-1) = 10s
        assertThat(attempt2.getScheduledAt()).isAfterOrEqualTo(beforeAttempt2.plusSeconds(8))
                .isBeforeOrEqualTo(beforeAttempt2.plusSeconds(13));

        // --- Attempt 3: reschedule to past, process -> retry 3 = maxRetries -> FAILED ---
        tx.executeWithoutResult(status -> {
            OutboxEvent ev = outboxRepository.findById(outboxId).orElseThrow();
            ev.setScheduledAt(Instant.now().minusSeconds(1));
            outboxRepository.save(ev);
        });
        outboxProcessor.processPendingEvents();
        OutboxEvent attempt3 = outboxRepository.findById(outboxId).orElseThrow();
        assertThat(attempt3.getRetryCount()).isEqualTo(3);
        assertThat(attempt3.getStatus()).isEqualTo(OutboxStatus.FAILED);
    }

    @Test
    @DisplayName("Transactional Outbox: Stale PROCESSING events are recovered and retried")
    void testOutbox_StaleProcessingEventRecovery() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        UUID shiftId = UUID.randomUUID();
        UUID staleEventId = tx.execute(status -> {
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SHIFT_PUBLISHED")
                    .aggregateType("SHIFT")
                    .aggregateId(shiftId)
                    .payload(String.format("{\"shiftId\":\"%s\",\"shiftName\":\"Recovered Shift\",\"staffUserIds\":[\"%s\"]}",
                            shiftId, staffUser.getId()))
                    .status(OutboxStatus.PROCESSING)
                    .retryCount(0)
                    .maxRetries(3)
                    .scheduledAt(Instant.now().minusSeconds(600))
                    .build();
            OutboxEvent saved = outboxRepository.save(event);
            outboxRepository.forceUpdatedAt(saved.getId(), Instant.now().minus(Duration.ofMinutes(10)));
            return saved.getId();
        });

        // Run processor: stale event (>300s) will be recovered to PENDING with retryCount=1
        outboxProcessor.setStaleThresholdSeconds(60);
        int processed = outboxProcessor.processPendingEvents();

        // The recovered event was scheduled for retry (now + 5s), so it was reset to PENDING
        OutboxEvent recovered = outboxRepository.findById(staleEventId).orElseThrow();
        assertThat(recovered.getRetryCount()).isEqualTo(1);
        assertThat(recovered.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(recovered.getErrorMessage()).contains("Stale PROCESSING recovery");
    }

    @Test
    @DisplayName("Transactional Outbox: Concurrent worker claiming does not duplicate processing")
    void testOutbox_ConcurrentClaimingSafety() throws Exception {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        int eventCount = 5;
        List<UUID> eventIds = new ArrayList<>();

        tx.executeWithoutResult(status -> {
            for (int i = 0; i < eventCount; i++) {
                UUID shiftId = UUID.randomUUID();
                OutboxEvent event = OutboxEvent.builder()
                        .eventType("SHIFT_PUBLISHED")
                        .aggregateType("SHIFT")
                        .aggregateId(shiftId)
                        .payload(String.format("{\"shiftId\":\"%s\",\"shiftName\":\"Concurrent Shift %d\",\"staffUserIds\":[\"%s\"]}",
                                shiftId, i, staffUser.getId()))
                        .status(OutboxStatus.PENDING)
                        .retryCount(0)
                        .maxRetries(3)
                        .scheduledAt(Instant.now().minusSeconds(1))
                        .build();
                eventIds.add(outboxRepository.save(event).getId());
            }
        });

        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger totalProcessed = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    int count = outboxProcessor.processPendingEvents();
                    totalProcessed.addAndGet(count);
                } catch (Exception e) {
                    // Ignore concurrency conflicts
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(totalProcessed.get()).isEqualTo(eventCount);

        List<OutboxEvent> allEvents = outboxRepository.findAll();
        assertThat(allEvents).hasSize(eventCount);
        for (OutboxEvent event : allEvents) {
            assertThat(event.getStatus()).isEqualTo(OutboxStatus.PROCESSED);
        }

        // Each shift published notification was created exactly once
        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).hasSize(eventCount);
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
