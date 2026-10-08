package com.shiftops.common.outbox;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Canonical configuration properties for the Transactional Outbox worker.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.outbox")
public class OutboxProperties {

    private Scheduler scheduler = new Scheduler();
    private long fixedDelayMs = 3000;
    private long baseBackoffSeconds = 5;
    private long leaseDurationMs = 60000;
    private int maxRetries = 3;
    private int batchSize = 25;
    private long staleThresholdSeconds = 300;

    @Getter
    @Setter
    public static class Scheduler {
        private boolean enabled = true;
    }
}
