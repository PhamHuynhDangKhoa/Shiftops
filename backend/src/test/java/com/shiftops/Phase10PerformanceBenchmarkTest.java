package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.auth.dto.LoginRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase10PerformanceBenchmarkTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private Branch testBranch;
    private String userToken;
    private static final String PLAIN_PASSWORD = "Password123!";

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();

        testBranch = branchRepository.save(Branch.builder()
                .name("Benchmark Branch")
                .address("100 Performance Way")
                .timezone("UTC")
                .isActive(true)
                .build());

        testUser = userRepository.save(User.builder()
                .email("benchmark.user@shiftops.com")
                .fullName("Benchmark User")
                .passwordHash(passwordEncoder.encode(PLAIN_PASSWORD))
                .role(Role.MANAGER)
                .primaryBranch(testBranch)
                .isActive(true)
                .build());

        userToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(testUser));

        // Populate sample notifications for query benchmarking
        for (int i = 0; i < 20; i++) {
            notificationRepository.save(Notification.builder()
                    .recipient(testUser)
                    .type(NotificationType.TASK_ASSIGNED)
                    .title("Benchmark Task " + i)
                    .message("Task message content #" + i)
                    .referenceType(ReferenceType.TASK)
                    .referenceId(UUID.randomUUID())
                    .idempotencyKey("bench-" + testUser.getId() + "-" + i)
                    .build());
        }
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();
    }

    private static class BenchmarkResult {
        final String name;
        final int iterations;
        final double minMs;
        final double maxMs;
        final double avgMs;
        final double p50Ms;
        final double p95Ms;
        final double p99Ms;
        final double throughputRps;

        BenchmarkResult(String name, List<Double> latenciesMs, long totalDurationNanos) {
            this.name = name;
            this.iterations = latenciesMs.size();
            Collections.sort(latenciesMs);
            this.minMs = latenciesMs.get(0);
            this.maxMs = latenciesMs.get(latenciesMs.size() - 1);
            this.avgMs = latenciesMs.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            this.p50Ms = latenciesMs.get((int) (latenciesMs.size() * 0.50));
            this.p95Ms = latenciesMs.get((int) (latenciesMs.size() * 0.95));
            this.p99Ms = latenciesMs.get((int) (latenciesMs.size() * 0.99));
            double totalSeconds = totalDurationNanos / 1_000_000_000.0;
            this.throughputRps = totalSeconds > 0 ? (iterations / totalSeconds) : 0.0;
        }

        @Override
        public String toString() {
            return String.format("| %-32s | %6d | %8.2f | %8.2f | %8.2f | %8.2f | %8.2f | %8.2f | %10.1f |",
                    name, iterations, minMs, p50Ms, p95Ms, p99Ms, maxMs, avgMs, throughputRps);
        }
    }

    @Test
    @DisplayName("Execute Phase 10 Performance & Latency Benchmark Suite")
    void executePerformanceBenchmark() throws Exception {
        int iterations = 50;
        List<BenchmarkResult> results = new ArrayList<>();

        // 1. Actuator Health Probe (Lightweight endpoint)
        results.add(benchmarkScenario("Actuator Health (/actuator/health)", iterations, () -> {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk());
        }));

        // 2. Authentication Login (BCrypt verification + JWT signing)
        LoginRequest loginRequest = new LoginRequest("benchmark.user@shiftops.com", PLAIN_PASSWORD);
        String loginJson = objectMapper.writeValueAsString(loginRequest);
        results.add(benchmarkScenario("Auth Login (/v1/auth/login)", iterations, () -> {
            mockMvc.perform(post("/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson))
                    .andExpect(status().isOk());
        }));

        // 3. Paged Notification Listing
        results.add(benchmarkScenario("Get My Notifications (/v1/notifications/my)", iterations, () -> {
            mockMvc.perform(get("/v1/notifications/my")
                            .header("Authorization", userToken))
                    .andExpect(status().isOk());
        }));

        // 4. Unread Notification Count Aggregation
        results.add(benchmarkScenario("Get Unread Count (/v1/notifications/unread-count)", iterations, () -> {
            mockMvc.perform(get("/v1/notifications/unread-count")
                            .header("Authorization", userToken))
                    .andExpect(status().isOk());
        }));

        // 5. Branch Listing
        results.add(benchmarkScenario("List Branches (/v1/branches)", iterations, () -> {
            mockMvc.perform(get("/v1/branches")
                            .header("Authorization", userToken))
                    .andExpect(status().isOk());
        }));

        // Print Formatted Markdown Table for Production Documentation
        System.out.println("\n=========================================================================================================");
        System.out.println("                                  SHIFTOPS PHASE 10 BENCHMARK REPORT                                     ");
        System.out.println("=========================================================================================================");
        System.out.println("| Scenario                         | Passes | Min (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Avg (ms) | Throughput |");
        System.out.println("|----------------------------------|--------|----------|----------|----------|----------|----------|----------|------------|");
        for (BenchmarkResult res : results) {
            System.out.println(res);
        }
        System.out.println("=========================================================================================================\n");

        // Basic latency assertions
        for (BenchmarkResult res : results) {
            assertThat(res.avgMs).isLessThan(500.0);
        }
    }

    private BenchmarkResult benchmarkScenario(String name, int iterations, ThrowingRunnable task) throws Exception {
        // Warmup: 5 passes
        for (int i = 0; i < 5; i++) {
            task.run();
        }

        List<Double> latencies = new ArrayList<>(iterations);
        long startTotal = System.nanoTime();

        for (int i = 0; i < iterations; i++) {
            long startNanos = System.nanoTime();
            task.run();
            long elapsedNanos = System.nanoTime() - startNanos;
            latencies.add(elapsedNanos / 1_000_000.0);
        }

        long endTotal = System.nanoTime();
        return new BenchmarkResult(name, latencies, endTotal - startTotal);
    }

    @FunctionalInterface
    private interface ThrowingRunnable {
        void run() throws Exception;
    }
}
