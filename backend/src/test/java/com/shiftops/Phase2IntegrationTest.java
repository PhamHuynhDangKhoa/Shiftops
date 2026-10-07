package com.shiftops;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.auth.dto.LoginRequest;
import com.shiftops.branch.dto.UpdateBranchStatusRequest;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.*;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase2IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private com.shiftops.shift.repository.ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private com.shiftops.task.repository.TaskRepository taskRepository;

    @Autowired
    private com.shiftops.task.repository.TaskTemplateRepository taskTemplateRepository;

    @Autowired
    private com.shiftops.attendance.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private com.shiftops.shift.repository.ShiftRepository shiftRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

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
                .address("100 Alpha Ave")
                .timezone("UTC")
                .isActive(true)
                .build());

        branchB = branchRepository.save(Branch.builder()
                .name("Beta Branch")
                .address("200 Beta Blvd")
                .timezone("UTC")
                .isActive(true)
                .build());

        owner = userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("System Owner")
                .phone("111222333")
                .role(Role.OWNER)
                .primaryBranch(null)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        managerA = userRepository.save(User.builder()
                .email("manager.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Alpha")
                .phone("222333444")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        managerB = userRepository.save(User.builder()
                .email("manager.b@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Manager Beta")
                .phone("333444555")
                .role(Role.MANAGER)
                .primaryBranch(branchB)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        staffA = userRepository.save(User.builder()
                .email("staff.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Alice")
                .phone("444555666")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        staffB = userRepository.save(User.builder()
                .email("staff.b@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Staff Bob")
                .phone("555666777")
                .role(Role.STAFF)
                .primaryBranch(branchB)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        ownerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerA));
        managerBToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerB));
        staffAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffA));
    }

    // --- Branch Status & Summary ---

    @Test
    void ownerCanToggleBranchStatus() throws Exception {
        UpdateBranchStatusRequest request = new UpdateBranchStatusRequest(false);

        mockMvc.perform(patch("/v1/branches/" + branchA.getId() + "/status")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.active", is(false)));
    }

    @Test
    void managerCannotToggleBranchStatus() throws Exception {
        UpdateBranchStatusRequest request = new UpdateBranchStatusRequest(false);

        mockMvc.perform(patch("/v1/branches/" + branchA.getId() + "/status")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void ownerAndManagerCanViewBranchSummary() throws Exception {
        // Owner gets summary of Branch A
        mockMvc.perform(get("/v1/branches/" + branchA.getId() + "/summary")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.branchName", is("Alpha Branch")))
                .andExpect(jsonPath("$.data.totalStaff", is(2))) // managerA + staffA
                .andExpect(jsonPath("$.data.activeStaff", is(2)))
                .andExpect(jsonPath("$.data.managerCount", is(1)));

        // Manager A gets summary of Branch A
        mockMvc.perform(get("/v1/branches/" + branchA.getId() + "/summary")
                        .header("Authorization", managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.branchName", is("Alpha Branch")));

        // Manager A cannot get summary of Branch B
        mockMvc.perform(get("/v1/branches/" + branchB.getId() + "/summary")
                        .header("Authorization", managerAToken))
                .andExpect(status().isForbidden());
    }

    // --- Staff Listing & Filtering ---

    @Test
    void ownerCanFilterAndPaginateUsers() throws Exception {
        mockMvc.perform(get("/v1/users")
                        .header("Authorization", ownerToken)
                        .param("branchId", branchA.getId().toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.page", is(0)));

        mockMvc.perform(get("/v1/users")
                        .header("Authorization", ownerToken)
                        .param("search", "Alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email", is("staff.a@shiftops.com")));
    }

    @Test
    void managerCanOnlyListOwnBranchUsers() throws Exception {
        // Manager A listing users (auto-filtered to branch A)
        mockMvc.perform(get("/v1/users")
                        .header("Authorization", managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)));

        // Manager A attempting to request Branch B explicitly
        mockMvc.perform(get("/v1/users")
                        .header("Authorization", managerAToken)
                        .param("branchId", branchB.getId().toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    // --- Staff Updating ---

    @Test
    void managerCanUpdateStaffInSameBranch() throws Exception {
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Staff Alice Modified")
                .phone("999111222")
                .build();

        mockMvc.perform(put("/v1/users/" + staffA.getId())
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Staff Alice Modified")))
                .andExpect(jsonPath("$.data.phone", is("999111222")));
    }

    @Test
    void managerCannotUpdateStaffInDifferentBranch() throws Exception {
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Illegal Update")
                .build();

        mockMvc.perform(put("/v1/users/" + staffB.getId())
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotPromoteStaffToManager() throws Exception {
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Staff Alice")
                .role(Role.MANAGER)
                .build();

        mockMvc.perform(put("/v1/users/" + staffA.getId())
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // --- Branch Transfer ---

    @Test
    void ownerCanTransferBranch() throws Exception {
        TransferBranchRequest request = new TransferBranchRequest(branchB.getId());

        mockMvc.perform(post("/v1/users/" + staffA.getId() + "/transfer-branch")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.primaryBranchId", is(branchB.getId().toString())))
                .andExpect(jsonPath("$.data.primaryBranchName", is("Beta Branch")));
    }

    @Test
    void managerCannotTransferBranch() throws Exception {
        TransferBranchRequest request = new TransferBranchRequest(branchB.getId());

        mockMvc.perform(post("/v1/users/" + staffA.getId() + "/transfer-branch")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // --- Password Reset & Change Password ---

    @Test
    void managerCanResetStaffPasswordAndStaffCanChangeIt() throws Exception {
        // Manager A resets Staff A's password
        MvcResult resetResult = mockMvc.perform(post("/v1/users/" + staffA.getId() + "/reset-password")
                        .header("Authorization", managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.temporaryPassword", notNullValue()))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(resetResult.getResponse().getContentAsString());
        String tempPassword = jsonNode.get("data").get("temporaryPassword").asText();

        // Staff A logs in with temporary password
        LoginRequest loginRequest = LoginRequest.builder()
                .email("staff.a@shiftops.com")
                .password(tempPassword)
                .build();

        MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.mustChangePassword", is(true)))
                .andReturn();

        JsonNode loginNode = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String staffNewToken = "Bearer " + loginNode.get("data").get("accessToken").asText();

        // Staff A changes password
        ChangePasswordRequest changeReq = ChangePasswordRequest.builder()
                .oldPassword(tempPassword)
                .newPassword("MySecurePermanentPass999!")
                .build();

        mockMvc.perform(post("/v1/auth/change-password")
                        .header("Authorization", staffNewToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.mustChangePassword", is(false)));

        // Staff A logs in with new permanent password
        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder()
                                .email("staff.a@shiftops.com")
                                .password("MySecurePermanentPass999!")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.mustChangePassword", is(false)));
    }

    @Test
    void cannotChangePasswordWithInvalidOldPassword() throws Exception {
        ChangePasswordRequest changeReq = ChangePasswordRequest.builder()
                .oldPassword("WrongOldPass")
                .newPassword("BrandNewPassword123!")
                .build();

        mockMvc.perform(post("/v1/auth/change-password")
                        .header("Authorization", staffAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code", is("INVALID_CREDENTIALS")));
    }

    @Test
    void staffCanUpdateOwnProfile() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Alice New Surname")
                .phone("777888999")
                .build();

        mockMvc.perform(put("/v1/auth/profile")
                        .header("Authorization", staffAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("Alice New Surname")))
                .andExpect(jsonPath("$.data.phone", is("777888999")));
    }
}
