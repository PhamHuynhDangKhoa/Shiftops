package com.shiftops.realtime.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Getter
@Component
public class WebSocketMetrics {

    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final AtomicLong connectionFailures = new AtomicLong(0);
    private final AtomicLong eventBroadcastFailures = new AtomicLong(0);
    private final AtomicLong totalConnections = new AtomicLong(0);

    @EventListener
    public void onSessionConnected(SessionConnectedEvent event) {
        int current = activeConnections.incrementAndGet();
        long total = totalConnections.incrementAndGet();
        log.info("WebSocket client connected. Active connections: {}, Total: {}", current, total);
    }

    @EventListener
    public void onSessionDisconnected(SessionDisconnectEvent event) {
        int current = activeConnections.decrementAndGet();
        if (current < 0) {
            activeConnections.set(0);
            current = 0;
        }
        log.info("WebSocket client disconnected. Active connections: {}", current);
    }

    public void recordConnectionFailure() {
        long failures = connectionFailures.incrementAndGet();
        log.warn("WebSocket connection failure recorded. Total failures: {}", failures);
    }

    public void recordBroadcastFailure() {
        long failures = eventBroadcastFailures.incrementAndGet();
        log.error("WebSocket event broadcast failure recorded. Total failures: {}", failures);
    }
}
