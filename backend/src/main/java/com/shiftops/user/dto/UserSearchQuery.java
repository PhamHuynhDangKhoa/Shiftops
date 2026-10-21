package com.shiftops.user.dto;

import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.entity.Role;
import lombok.Builder;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Builder
public record UserSearchQuery(
        UUID branchId,
        Role role,
        Boolean active,
        String search,
        Pageable pageable,
        UserPrincipal principal
) {}
