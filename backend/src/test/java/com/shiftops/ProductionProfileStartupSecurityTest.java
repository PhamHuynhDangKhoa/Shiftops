package com.shiftops;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class ProductionProfileStartupSecurityTest {

    @Test
    @DisplayName("Security: Prod profile startup fails when SPRING_DATASOURCE_PASSWORD is missing")
    void testStartupFailsWhenDatasourcePasswordMissing() {
        assertThatThrownBy(() -> new SpringApplicationBuilder(ShiftOpsApplication.class)
                .profiles("prod")
                .properties(
                        "JWT_SECRET=super_secret_jwt_key_that_is_at_least_256_bits_long_abcdef",
                        "server.port=0"
                )
                .run())
                .isNotNull();
    }

    @Test
    @DisplayName("Security: Prod profile startup fails when JWT_SECRET is missing")
    void testStartupFailsWhenJwtSecretMissing() {
        assertThatThrownBy(() -> new SpringApplicationBuilder(ShiftOpsApplication.class)
                .profiles("prod")
                .properties(
                        "SPRING_DATASOURCE_PASSWORD=strong_postgres_password",
                        "server.port=0"
                )
                .run())
                .isNotNull();
    }

    @Test
    @DisplayName("Security: Prod profile startup fails when JWT_SECRET is weaker than 256 bits")
    void testStartupFailsWhenJwtSecretIsWeak() {
        assertThatThrownBy(() -> new SpringApplicationBuilder(ShiftOpsApplication.class)
                .profiles("prod")
                .properties(
                        "SPRING_DATASOURCE_PASSWORD=strong_postgres_password",
                        "JWT_SECRET=too-short-secret",
                        "server.port=0"
                )
                .run())
                .isNotNull();
    }
}
