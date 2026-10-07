package com.shiftops;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.auth.dto.LoginRequest;
import com.shiftops.branch.dto.CreateBranchRequest;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.CreateUserRequest;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase1IntegrationTest {

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
    private User staffA;
    private String ownerToken;
    private String managerAToken;
    private String staffAToken;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        shiftAssignmentRepository.deleteAll();
        shiftRepository.deleteAll();
        userRepository.deleteAll();
        branchRepository.deleteAll();

        // Create branches
        branchA = branchRepository.save(Branch.builder()
                .name("Branch Alpha")
                .address("123 Alpha St")
                .timezone("UTC")
                .isActive(true)
                .build());

        branchB = branchRepository.save(Branch.builder()
                .name("Branch Beta")
                .address("456 Beta St")
                .timezone("UTC")
                .isActive(true)
                .build());

        // Create users
        owner = userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Alice Owner")
                .role(Role.OWNER)
                .primaryBranch(null)
                .isActive(true)
                .build());

        managerA = userRepository.save(User.builder()
                .email("manager.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Bob Manager")
                .role(Role.MANAGER)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        staffA = userRepository.save(User.builder()
                .email("staff.a@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Charlie Staff")
                .role(Role.STAFF)
                .primaryBranch(branchA)
                .isActive(true)
                .build());

        ownerToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(owner));
        managerAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(managerA));
        staffAToken = "Bearer " + jwtTokenProvider.generateToken(UserPrincipal.create(staffA));
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("owner@shiftops.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("owner@shiftops.com")))
                .andExpect(jsonPath("$.data.user.role", is("OWNER")));
    }

    @Test
    void shouldReturn401OnInvalidPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("owner@shiftops.com")
                .password("WrongPassword")
                .build();

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("UNAUTHORIZED")));
    }

    @Test
    void shouldReturn401WhenAccessingProtectedWithoutToken() throws Exception {
        mockMvc.perform(get("/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("UNAUTHORIZED")));
    }

    @Test
    void shouldReturn200OnAuthMeWithToken() throws Exception {
        mockMvc.perform(get("/v1/auth/me")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("owner@shiftops.com")));
    }

    @Test
    void ownerCanCreateBranch() throws Exception {
        CreateBranchRequest request = CreateBranchRequest.builder()
                .name("Branch Gamma")
                .address("789 Gamma Rd")
                .timezone("UTC")
                .build();

        mockMvc.perform(post("/v1/branches")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Branch Gamma")));
    }

    @Test
    void managerCannotCreateBranch() throws Exception {
        CreateBranchRequest request = CreateBranchRequest.builder()
                .name("Branch Unauthorized")
                .build();

        mockMvc.perform(post("/v1/branches")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void managerCanAccessOwnBranch() throws Exception {
        mockMvc.perform(get("/v1/branches/" + branchA.getId())
                        .header("Authorization", managerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Branch Alpha")));
    }

    @Test
    void managerCannotAccessOtherBranch() throws Exception {
        mockMvc.perform(get("/v1/branches/" + branchB.getId())
                        .header("Authorization", managerAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void ownerCanAccessAnyBranch() throws Exception {
        mockMvc.perform(get("/v1/branches/" + branchB.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Branch Beta")));
    }

    @Test
    void managerCanCreateStaffInOwnBranch() throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("newstaff@shiftops.com")
                .password("Password123!")
                .fullName("New Staff")
                .role(Role.STAFF)
                .primaryBranchId(branchA.getId())
                .build();

        mockMvc.perform(post("/v1/users")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("newstaff@shiftops.com")));
    }

    @Test
    void managerCannotCreateStaffInOtherBranch() throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("otherstaff@shiftops.com")
                .password("Password123!")
                .fullName("Other Staff")
                .role(Role.STAFF)
                .primaryBranchId(branchB.getId())
                .build();

        mockMvc.perform(post("/v1/users")
                        .header("Authorization", managerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void staffCannotListUsers() throws Exception {
        mockMvc.perform(get("/v1/users")
                        .header("Authorization", staffAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void staffCanViewSelfProfile() throws Exception {
        mockMvc.perform(get("/v1/users/" + staffA.getId())
                        .header("Authorization", staffAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("staff.a@shiftops.com")));
    }

    @Test
    void staffCannotViewOtherUserProfile() throws Exception {
        mockMvc.perform(get("/v1/users/" + managerA.getId())
                        .header("Authorization", staffAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }
}
