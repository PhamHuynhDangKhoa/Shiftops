package com.shiftops.common.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.modulith.events.IncompleteEventPublications;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Manages transactional event publications backed by the Spring Modulith Event Publication Registry.
 *
 * 1. Resubmission / Retry: Incomplete events older than 30 seconds (e.g. from server restart or transient failure)
 *    are automatically resubmitted to guarantee at-least-once transactional delivery.
 * 2. Purging: Completed publications older than 14 days are cleaned up on a nightly schedule to prevent table bloat.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublicationRegistryService {

    private final IncompleteEventPublications incompletePublications;
    private final CompletedEventPublications completedPublications;

    @Scheduled(fixedDelayString = "${app.events.republish-delay-ms:30000}")
    public void retryIncompleteEvents() {
        try {
            incompletePublications.resubmitIncompletePublicationsOlderThan(Duration.ofSeconds(30));
        } catch (Exception ex) {
            log.warn("Error checking or resubmitting incomplete event publications: {}", ex.getMessage());
        }
    }

    @Scheduled(cron = "${app.events.purge-cron:0 0 3 * * *}")
    public void purgeOldCompletedEvents() {
        try {
            completedPublications.deletePublicationsOlderThan(Duration.ofDays(14));
            log.info("Purged completed Spring Modulith event publications older than 14 days");
        } catch (Exception ex) {
            log.warn("Error purging completed event publications: {}", ex.getMessage());
        }
    }
}
