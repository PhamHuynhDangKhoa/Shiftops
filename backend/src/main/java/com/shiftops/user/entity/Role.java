package com.shiftops.user.entity;

public enum Role {
    OWNER,
    MANAGER,
    STAFF;

    public String toAuthority() {
        return "ROLE_" + this.name();
    }
}
