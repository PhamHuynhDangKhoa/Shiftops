package com.shiftops.notification.dto;

import lombok.Builder;

@Builder
public record UnreadCountResponse(long count) {
    public long getCount() {
        return count();
    }
}
