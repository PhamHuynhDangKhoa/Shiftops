package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.shift.dto.AssignStaffRequest;
import com.shiftops.shift.dto.CreateShiftRequest;
import com.shiftops.shift.dto.UpdateShiftStatusRequest;
import com.shiftops.shift.entity.Shift;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase3IntegrationTest {

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
    private com.shiftops.attendance.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private Branch branchA;
    private Branch branchB;
    private Branch inactiveBranch;
    private User owner;
    private User managerA;
    private User managerB;
    private User staffA;
    private String ownerToken;
    private String managerAToken;
    private String managerBToken;
    private String staffAToken;

    @BeforeEach
    void setUp() {
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

        inactiveBranch = branchRepository.save(Branch.builder()
                .name("Inactive Branch")
                .address("999 Closed Ave")
                .timezone("UTC")
                .isActive(false)
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

        ownerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerA));
        managerBToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerB));
        staffAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffA));
    }

    // 1. Normal shift creation
    @Test
    void managerCanCreateNormalShiftInOwnBranch() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Morning Shift")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .notes("Open register and check inventory")
                .build();

        mockMvc.perform(post("/v1/branches/" + branchA.getId() + "/shifts")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Morning Shift")))
                .andExpect(jsonPath("$.data.overnight", is(false)))
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }

    // 2. Overnight shift creation (22:00 -> 06:00)
    @Test
    void ownerCanCreateOvernightShift() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Overnight Security")
                .startTime(Instant.parse("2026-10-08T22:00:00Z"))
                .endTime(Instant.parse("2026-10-09T06:00:00Z"))
                .build();

        mockMvc.perform(post("/v1/branches/" + branchA.getId() + "/shifts")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Overnight Security")))
                .andExpect(jsonPath("$.data.overnight", is(true)));
    }

    // 3. Invalid time range (start >= end)
    @Test
    void rejectInvalidTimeRange() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .startTime(Instant.parse("2026-10-08T16:00:00Z"))
                .endTime(Instant.parse("2026-10-08T08:00:00Z"))
                .build();

        mockMvc.perform(post("/v1/branches/" + branchA.getId() + "/shifts")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("INVALID_TIME_RANGE")));
    }

    // 4. Inactive branch rejection
    @Test
    void rejectShiftCreationOnInactiveBranch() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .build();

        mockMvc.perform(post("/v1/branches/" + inactiveBranch.getId() + "/shifts")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("BRANCH_INACTIVE")));
    }

    // 5. OWNER cross-branch access
    @Test
    void ownerCanManageShiftsAcrossBranches() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Beta Evening Shift")
                .startTime(Instant.parse("2026-10-08T16:00:00Z"))
                .endTime(Instant.parse("2026-10-08T23:00:00Z"))
                .build();

        mockMvc.perform(post("/v1/branches/" + branchB.getId() + "/shifts")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.branchName", is("Beta Branch")));
    }

    // 6. MANAGER cross-branch rejection
    @Test
    void managerCannotCreateShiftInOtherBranch() throws Exception {
        CreateShiftRequest request = CreateShiftRequest.builder()
                .name("Unauthorized Shift")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .build();

        mockMvc.perform(post("/v1/branches/" + branchB.getId() + "/shifts")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    // 7. Non-overlapping assignments vs Overlapping assignments
    @Test
    void testAssignmentOverlapDetection() throws Exception {
        // Create Shift 1: [08:00, 16:00]
        Shift shift1 = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Shift 1")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // Assign Staff A to Shift 1 -> SUCCESS
        mockMvc.perform(post("/v1/shifts/" + shift1.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignments", hasSize(1)));

        // Create Shift 2: [16:00, 22:00] (back-to-back, touching at 16:00, non-overlapping)
        Shift shift2 = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Shift 2")
                .startTime(Instant.parse("2026-10-08T16:00:00Z"))
                .endTime(Instant.parse("2026-10-08T22:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // Assign Staff A to Shift 2 -> SUCCESS (touching points do NOT overlap)
        mockMvc.perform(post("/v1/shifts/" + shift2.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignments", hasSize(1)));

        // Create Shift 3: [14:00, 20:00] (overlaps with Shift 1 [08:00, 16:00] and Shift 2 [16:00, 22:00])
        Shift shift3 = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Shift 3 (Conflict)")
                .startTime(Instant.parse("2026-10-08T14:00:00Z"))
                .endTime(Instant.parse("2026-10-08T20:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // Assign Staff A to Shift 3 -> REJECTED with 422 SHIFT_OVERLAP_CONFLICT
        mockMvc.perform(post("/v1/shifts/" + shift3.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("SHIFT_OVERLAP_CONFLICT")));
    }

    // 8. Duplicate assignment rejection
    @Test
    void rejectDuplicateAssignmentToSameShift() throws Exception {
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Shift Single")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // First assignment -> 200 OK
        mockMvc.perform(post("/v1/shifts/" + shift.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isOk());

        // Duplicate assignment -> 409 Conflict
        mockMvc.perform(post("/v1/shifts/" + shift.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code", is("CONFLICT")));
    }

    // 9. State transitions: DRAFT -> PUBLISHED -> COMPLETED
    @Test
    void testShiftLifecycleTransitions() throws Exception {
        Shift shift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Lifecycle Shift")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // Transition: DRAFT -> PUBLISHED
        mockMvc.perform(patch("/v1/shifts/" + shift.getId() + "/status")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateShiftStatusRequest(ShiftStatus.PUBLISHED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));

        // Transition: PUBLISHED -> COMPLETED
        mockMvc.perform(patch("/v1/shifts/" + shift.getId() + "/status")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateShiftStatusRequest(ShiftStatus.COMPLETED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

        // Invalid Transition: COMPLETED -> DRAFT
        mockMvc.perform(patch("/v1/shifts/" + shift.getId() + "/status")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateShiftStatusRequest(ShiftStatus.DRAFT))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("INVALID_STATE_TRANSITION")));
    }

    // 10. STAFF visibility rules: only published and assigned shifts
    @Test
    void staffCanOnlyViewPublishedAssignedShifts() throws Exception {
        // Draft shift assigned to staffA
        Shift draftShift = shiftRepository.save(Shift.builder()
                .branch(branchA)
                .name("Draft Shift")
                .startTime(Instant.parse("2026-10-08T08:00:00Z"))
                .endTime(Instant.parse("2026-10-08T16:00:00Z"))
                .status(ShiftStatus.DRAFT)
                .build());

        // Assign Staff A to draft shift
        mockMvc.perform(post("/v1/shifts/" + draftShift.getId() + "/assignments")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignStaffRequest(staffA.getId()))))
                .andExpect(status().isOk());

        // Staff A accesses Draft shift -> 403 Forbidden
        mockMvc.perform(get("/v1/shifts/" + draftShift.getId())
                        .header("Authorization", staffAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));

        // Publish the shift
        mockMvc.perform(patch("/v1/shifts/" + draftShift.getId() + "/status")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateShiftStatusRequest(ShiftStatus.PUBLISHED))))
                .andExpect(status().isOk());

        // Staff A accesses Published shift -> 200 OK
        mockMvc.perform(get("/v1/shifts/" + draftShift.getId())
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Draft Shift")));

        // Staff A calls /my-shifts -> includes the published shift
        mockMvc.perform(get("/v1/shifts/my-shifts")
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(draftShift.getId().toString())));

        // Staff cannot create shift -> 403 Forbidden
        CreateShiftRequest newReq = CreateShiftRequest.builder()
                .startTime(Instant.now())
                .endTime(Instant.now().plusSeconds(3600))
                .build();
        mockMvc.perform(post("/v1/branches/" + branchA.getId() + "/shifts")
                        .header("Authorization", staffAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newReq)))
                .andExpect(status().isForbidden());
    }
}
