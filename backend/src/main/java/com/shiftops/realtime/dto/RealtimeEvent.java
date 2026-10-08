package com.shiftops.realtime.dto;

import java.time.Instant;
import java.util.UUID;

public record RealtimeEvent<T>(
        String eventType,
        UUID branchId,
        Instant timestamp,
        T payload
) {
    public static <T> RealtimeEvent<T> of(String eventType, UUID branchId, T payload) {
        return new RealtimeEvent<>(eventType, branchId, Instant.now(), payload);
    }
}
