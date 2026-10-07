package com.shiftops.branch.service;

import com.shiftops.branch.dto.BranchResponse;
import com.shiftops.branch.dto.BranchSummaryResponse;
import com.shiftops.branch.dto.CreateBranchRequest;
import com.shiftops.branch.dto.UpdateBranchRequest;
import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.common.exception.ConflictException;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import com.shiftops.user.service.BranchAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BranchServiceTest {

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchAccessService branchAccessService;

    @InjectMocks
    private BranchService branchService;

    private UUID branchId;
    private Branch branch;

    @BeforeEach
    void setUp() {
        branchId = UUID.randomUUID();
        branch = Branch.builder()
                .name("Main Branch")
                .address("123 Main St")
                .timezone("UTC")
                .isActive(true)
                .build();
        branch.setId(branchId);
    }

    @Test
    void createBranch_Success() {
        CreateBranchRequest request = CreateBranchRequest.builder()
                .name("New Branch")
                .address("456 New St")
                .timezone("America/New_York")
                .build();

        when(branchRepository.existsByNameIgnoreCase("New Branch")).thenReturn(false);
        when(branchRepository.save(any(Branch.class))).thenAnswer(i -> {
            Branch b = i.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BranchResponse response = branchService.createBranch(request);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("New Branch");
        assertThat(response.getTimezone()).isEqualTo("America/New_York");
        assertThat(response.isActive()).isTrue();
    }

    @Test
    void createBranch_DuplicateName_ThrowsConflictException() {
        CreateBranchRequest request = CreateBranchRequest.builder()
                .name("Existing Branch")
                .build();

        when(branchRepository.existsByNameIgnoreCase("Existing Branch")).thenReturn(true);

        assertThatThrownBy(() -> branchService.createBranch(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void updateBranchStatus_Success() {
        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branch));
        when(branchRepository.save(any(Branch.class))).thenAnswer(i -> i.getArgument(0));

        BranchResponse response = branchService.updateBranchStatus(branchId, false);

        assertThat(response.isActive()).isFalse();
        verify(branchRepository).save(branch);
    }

    @Test
    void getBranchSummary_Success() {
        User ownerUser = User.builder()
                .email("owner@shiftops.com")
                .role(Role.OWNER)
                .isActive(true)
                .build();
        ownerUser.setId(UUID.randomUUID());
        UserPrincipal ownerPrincipal = UserPrincipal.create(ownerUser);

        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branch));
        when(userRepository.countByPrimaryBranchId(branchId)).thenReturn(10L);
        when(userRepository.countByPrimaryBranchIdAndIsActiveTrue(branchId)).thenReturn(8L);
        when(userRepository.countByPrimaryBranchIdAndRole(branchId, Role.MANAGER)).thenReturn(2L);

        BranchSummaryResponse summary = branchService.getBranchSummary(branchId, ownerPrincipal);

        verify(branchAccessService).validateBranchAccess(ownerPrincipal, branchId);
        assertThat(summary.getBranchId()).isEqualTo(branchId);
        assertThat(summary.getBranchName()).isEqualTo("Main Branch");
        assertThat(summary.getTotalStaff()).isEqualTo(10L);
        assertThat(summary.getActiveStaff()).isEqualTo(8L);
        assertThat(summary.getManagerCount()).isEqualTo(2L);
    }

    @Test
    void updateBranch_Success() {
        UpdateBranchRequest request = UpdateBranchRequest.builder()
                .name("Renamed Branch")
                .address("New Address")
                .timezone("Asia/Tokyo")
                .active(true)
                .build();

        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branch));
        when(branchRepository.existsByNameIgnoreCase("Renamed Branch")).thenReturn(false);
        when(branchRepository.save(any(Branch.class))).thenAnswer(i -> i.getArgument(0));

        BranchResponse response = branchService.updateBranch(branchId, request);

        assertThat(response.getName()).isEqualTo("Renamed Branch");
        assertThat(response.getAddress()).isEqualTo("New Address");
        assertThat(response.getTimezone()).isEqualTo("Asia/Tokyo");
    }
}
