package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.attendance.entity.Attendance;
import com.shiftops.attendance.entity.AttendanceStatus;
import com.shiftops.attendance.repository.AttendanceRepository;
import com.shiftops.attendance.service.AttendanceService;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.entity.ShiftStatus;
import com.shiftops.shift.repository.ShiftAssignmentRepository;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase4IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private com.shiftops.task.repository.TaskRepository taskRepository;

    @Autowired
    private com.shiftops.task.repository.TaskTemplateRepository taskTemplateRepository;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private static final AtomicReference<Instant> currentClockTime = new AtomicReference<>(Instant.parse("2026-10-10T08:00:00Z"));

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        public Clock testClock() {
            return new Clock() {
                @Override
                public java.time.ZoneId getZone() {
                    return ZoneOffset.UTC;
                }

                @Override
                public Clock withZone(java.time.ZoneId zone) {
                    return this;
                }

                @Override
                public Instant instant() {
                    return currentClockTime.get();
                }
            };
        }
    }

    private Branch branchA;
    private Branch branchB;
    private User owner;
    private User managerA;
    private User managerB;
    private User staffA;
    private User staffB;
    private String ownerToken;
    private String managerAToken;
    private String managerBToken;
    private String staffAToken;
    private String staffBToken;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        taskTemplateRepository.deleteAll();
        attendanceRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();

        branchA = branchRepository.save(Branch.builder()
                .name("Alpha Branch")
                .address("100 Alpha St")
                .timezone("UTC")
                .isActive(true)
                .build());

        branchB = branchRepository.save(Branch.builder()
                .name("Beta Branch")
                .address("200 Beta St")
                .timezone("UTC")
                .isActive(true)
                .build());

        owner = userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("System Owner")
                .role(Role.OWNER)
                .primaryBranch(null)
                .isActive(true)
                .build());

        managerA = userRepository.save(User.builder()
                .email("manager.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Alpha")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        managerB = userRepository.save(User.builder()
                .email("manager.b@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Beta")
                .role(Role.MANAGER)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        staffA = userRepository.save(User.builder()
                .email("staff.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Alice")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffB = userRepository.save(User.builder()
                .email("staff.b@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Bob")
                .role(Role.STAFF)
                .primaryBranch(branchB)
                .isActive(true)
                .build());

        ownerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerA));
        managerBToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerB));
        staffAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffA));
        staffBToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffB));
    }

    private Shift createPublishedShift(Branch branch, Instant start, Instant end) {
        return shiftRepository.save(Shift.builder()
                .branch(branch)
                .name("Test Shift")
                .startTime(start)
                .endTime(end)
                .status(ShiftStatus.PUBLISHED)
                .build());
    }

    private ShiftAssignment assignStaff(Shift shift, User user, User assignedBy) {
        return shiftAssignmentRepository.save(ShiftAssignment.builder()
                .shift(shift)
                .user(user)
                .assignedBy(assignedBy)
                .assignedAt(Instant.now())
                .build());
    }

    // 1. Valid on-time check-in
    @Test
    void testCheckIn_NormalOnTime_Success() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PRESENT")))
                .andExpect(jsonPath("$.data.late", is(false)))
                .andExpect(jsonPath("$.data.checkInAt", notNullValue()));
    }

    // 2. Early check-in within 15-minute window
    @Test
    void testCheckIn_EarlyWithin15Minutes_Success() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T07:50:00Z")); // 10 min early

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PRESENT")))
                .andExpect(jsonPath("$.data.late", is(false)));
    }

    // 3. Too-early check-in rejected
    @Test
    void testCheckIn_TooEarly_Rejected() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T07:44:00Z")); // 16 min early

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("EARLY_CHECKIN_PROHIBITED")));
    }

    // 4. Late check-in
    @Test
    void testCheckIn_Late_MarkedLate() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:15:00Z")); // 15 min late

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("LATE")))
                .andExpect(jsonPath("$.data.late", is(true)));
    }

    // 5. Check-in after shift ended rejected
    @Test
    void testCheckIn_AfterShiftEnded_Rejected() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T16:01:00Z")); // 1 min after end

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("SHIFT_ALREADY_ENDED")));
    }

    // 6. Duplicate check-in rejected
    @Test
    void testCheckIn_Duplicate_Rejected() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));

        // First check-in -> 200 OK
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        // Second check-in -> 409 Conflict
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isConflict());
    }

    // 7. Check-out after check-in
    @Test
    void testCheckOut_AfterCheckIn_Success() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        currentClockTime.set(Instant.parse("2026-10-10T16:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-out")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.checkOutAt", notNullValue()));
    }

    // 8. Check-out before check-in rejected
    @Test
    void testCheckOut_WithoutCheckIn_Rejected() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-out")
                        .header("Authorization", staffAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("CHECKOUT_WITHOUT_CHECKIN")));
    }

    // 9. Duplicate check-out rejected
    @Test
    void testCheckOut_Duplicate_Rejected() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        currentClockTime.set(Instant.parse("2026-10-10T16:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-out")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        // Second check-out -> 422 ATTENDANCE_ALREADY_COMPLETED
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-out")
                        .header("Authorization", staffAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("ATTENDANCE_ALREADY_COMPLETED")));
    }

    // 10. Staff cannot check into another staff's shift
    @Test
    void testCheckIn_AnotherStaffAssignment_Forbidden() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));

        // Staff B tries to check into Staff A's shift
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffBToken))
                .andExpect(status().isForbidden());
    }

    // 11. Staff cannot access another staff member's attendance
    @Test
    void testStaffCannotAccessOtherStaffAttendance() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        Attendance att = attendanceRepository.findByShiftAssignmentId(sa.getId()).orElseThrow();

        // Staff B tries to GET Staff A's attendance by ID
        mockMvc.perform(get("/v1/attendance/" + att.getId())
                        .header("Authorization", staffBToken))
                .andExpect(status().isForbidden());
    }

    // 12. Manager can view own branch attendance
    @Test
    void testManagerCanViewOwnBranchAttendance() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/branches/" + branchA.getId() + "/attendance")
                        .header("Authorization", managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].userName", is("Staff Alice")));
    }

    // 13. Manager cannot view other branch attendance
    @Test
    void testManagerCannotViewOtherBranchAttendance() throws Exception {
        mockMvc.perform(get("/v1/branches/" + branchB.getId() + "/attendance")
                        .header("Authorization", managerAToken))
                .andExpect(status().isForbidden());
    }

    // 14. Owner cross-branch attendance access
    @Test
    void testOwnerCrossBranchAttendanceAccess() throws Exception {
        mockMvc.perform(get("/v1/branches/" + branchB.getId() + "/attendance")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());
    }

    // 15. Check-in to cancelled shift rejected
    @Test
    void testCheckIn_CancelledShift_Rejected() throws Exception {
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Cancelled Shift")
                .startTime(Instant.parse("2026-10-10T08:00:00Z"))
                .endTime(Instant.parse("2026-10-10T16:00:00Z"))
                .status(ShiftStatus.CANCELLED)
                .build());
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        currentClockTime.set(Instant.parse("2026-10-10T08:00:00Z"));

        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("SHIFT_CANCELLED")));
    }

    // 16. Overnight shift attendance (22:00 -> 06:00 next day)
    @Test
    void testOvernightShiftAttendance_Success() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T22:00:00Z"), Instant.parse("2026-10-11T06:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        // Check in at 21:50 UTC (on-time within 15 min window)
        currentClockTime.set(Instant.parse("2026-10-10T21:50:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-in")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PRESENT")))
                .andExpect(jsonPath("$.data.overnight", is(true)));

        // Check out next day at 06:05 UTC
        currentClockTime.set(Instant.parse("2026-10-11T06:05:00Z"));
        mockMvc.perform(post("/v1/attendance/" + sa.getId() + "/check-out")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.overnight", is(true)));
    }

    // 17. Absence Detection: Unchecked past shifts marked ABSENT
    @Test
    void testAbsenceDetection_MarksAbsent() throws Exception {
        Shift shift = createPublishedShift(branchA, Instant.parse("2026-10-10T08:00:00Z"), Instant.parse("2026-10-10T16:00:00Z"));
        ShiftAssignment sa = assignStaff(shift, staffA, managerA);

        // Current time is past shift end (17:00 UTC), staff never checked in
        Instant pastShiftEnd = Instant.parse("2026-10-10T17:00:00Z");
        currentClockTime.set(pastShiftEnd);

        int marked = attendanceService.markAbsentShifts(pastShiftEnd);
        assertThat(marked).isEqualTo(1);

        Attendance att = attendanceRepository.findByShiftAssignmentId(sa.getId()).orElseThrow();
        assertThat(att.getStatus()).isEqualTo(AttendanceStatus.ABSENT);
        assertThat(att.getCheckInAt()).isNull();
        assertThat(att.getCheckOutAt()).isNull();

        // Idempotent: running again marks 0
        int secondRun = attendanceService.markAbsentShifts(pastShiftEnd);
        assertThat(secondRun).isEqualTo(0);
    }
}
