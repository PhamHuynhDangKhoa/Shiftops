package com.shiftops.user.service;

import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.branch.entity.Branch;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class BranchAccessServiceTest {

    private BranchAccessService branchAccessService;
    private UUID branchA;
    private UUID branchB;

    @BeforeEach
    void setUp() {
        branchAccessService = new BranchAccessService();
        branchA = UUID.randomUUID();
        branchB = UUID.randomUUID();
    }

    @Test
    void ownerShouldHaveGlobalBranchAccess() {
        UserPrincipal owner = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(Role.OWNER)
                .primaryBranchId(null)
                .authorities(Collections.emptyList())
                .build();

        assertTrue(branchAccessService.hasBranchAccess(owner, branchA));
        assertTrue(branchAccessService.hasBranchAccess(owner, branchB));
        assertDoesNotThrow(() -> branchAccessService.validateBranchAccess(owner, branchA));
    }

    @Test
    void managerShouldOnlyAccessAssignedBranch() {
        UserPrincipal manager = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(Role.MANAGER)
                .primaryBranchId(branchA)
                .authorities(Collections.emptyList())
                .build();

        assertTrue(branchAccessService.hasBranchAccess(manager, branchA));
        assertFalse(branchAccessService.hasBranchAccess(manager, branchB));
        assertThrows(AccessDeniedException.class, () -> branchAccessService.validateBranchAccess(manager, branchB));
    }

    @Test
    void staffShouldOnlyAccessAssignedBranch() {
        UserPrincipal staff = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(Role.STAFF)
                .primaryBranchId(branchA)
                .authorities(Collections.emptyList())
                .build();

        assertTrue(branchAccessService.hasBranchAccess(staff, branchA));
        assertFalse(branchAccessService.hasBranchAccess(staff, branchB));
        assertThrows(AccessDeniedException.class, () -> branchAccessService.validateBranchAccess(staff, branchB));
    }

    @Test
    void managerCanManageStaffInOwnBranchOnly() {
        UserPrincipal manager = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .role(Role.MANAGER)
                .primaryBranchId(branchA)
                .authorities(Collections.emptyList())
                .build();

        Branch bA = Branch.builder().name("Branch A").build();
        bA.setId(branchA);

        Branch bB = Branch.builder().name("Branch B").build();
        bB.setId(branchB);

        User staffInBranchA = User.builder()
                .role(Role.STAFF)
                .primaryBranch(bA)
                .build();
        staffInBranchA.setId(UUID.randomUUID());

        User staffInBranchB = User.builder()
                .role(Role.STAFF)
                .primaryBranch(bB)
                .build();
        staffInBranchB.setId(UUID.randomUUID());

        User managerInBranchA = User.builder()
                .role(Role.MANAGER)
                .primaryBranch(bA)
                .build();
        managerInBranchA.setId(UUID.randomUUID());

        assertTrue(branchAccessService.canManageUser(manager, staffInBranchA));
        assertFalse(branchAccessService.canManageUser(manager, staffInBranchB));
        assertFalse(branchAccessService.canManageUser(manager, managerInBranchA));
    }
}
