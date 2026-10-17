package com.shiftops;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Widens the H2 in-memory event_publication.serialized_event column from Hibernate's
 * default VARCHAR(255) to VARCHAR(1000000) so that large serialized JSON event payloads
 * fit during integration tests.
 */
@Slf4j
@Component
@Profile("test")
@RequiredArgsConstructor
public class TestModulithDatabaseInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void widenEventPublicationColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE event_publication ALTER COLUMN serialized_event VARCHAR(1000000)");
            log.info("Widened event_publication.serialized_event column for H2 test database");
        } catch (Exception ex) {
            log.warn("Could not alter event_publication column in test: {}", ex.getMessage());
        }
    }
}
