package com.shiftops.common.exception;

import com.shiftops.common.dto.ApiResponse;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleOptimisticLockingFailure_SpringException_Returns409Conflict() {
        ObjectOptimisticLockingFailureException ex =
                new ObjectOptimisticLockingFailureException("Shift", "123");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleOptimisticLockingFailure(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Concurrent update conflict");
        assertThat(response.getBody().getError()).isNotNull();
        assertThat(response.getBody().getError().getCode()).isEqualTo("CONCURRENT_MODIFICATION");
    }

    @Test
    void handleOptimisticLockingFailure_JpaException_Returns409Conflict() {
        OptimisticLockException ex = new OptimisticLockException("Row updated or deleted by another transaction");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleOptimisticLockingFailure(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("CONCURRENT_MODIFICATION");
    }
}
