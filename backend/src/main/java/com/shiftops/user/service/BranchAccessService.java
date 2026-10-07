package com.shiftops.user.service;

import com.shiftops.common.exception.AccessDeniedException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class BranchAccessService {

    public boolean hasBranchAccess(UserPrincipal principal, UUID branchId) {
        if (principal == null || branchId == null) {
            return false;
        }
        if (principal.isOwner()) {
            return true;
        }
        return branchId.equals(principal.getPrimaryBranchId());
    }

    public void validateBranchAccess(UserPrincipal principal, UUID branchId) {
        if (!hasBranchAccess(principal, branchId)) {
            throw new AccessDeniedException("You do not have access to branch: " + branchId);
        }
    }

    public boolean canManageUser(UserPrincipal principal, User targetUser) {
        if (principal == null || targetUser == null) {
            return false;
        }
        if (principal.isOwner()) {
            return true;
        }
        if (principal.isManager()) {
            UUID targetBranchId = targetUser.getPrimaryBranch() != null
                    ? targetUser.getPrimaryBranch().getId()
                    : null;
            return targetUser.getRole() == Role.STAFF
                    && principal.getPrimaryBranchId() != null
                    && principal.getPrimaryBranchId().equals(targetBranchId);
        }
        return false;
    }

    public void validateCanManageUser(UserPrincipal principal, User targetUser) {
        if (!canManageUser(principal, targetUser)) {
            throw new AccessDeniedException("You do not have permission to manage this user");
        }
    }
}
