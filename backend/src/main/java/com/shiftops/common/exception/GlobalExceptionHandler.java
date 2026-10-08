package com.shiftops.common.exception;

import com.shiftops.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(),
                        ApiResponse.ErrorDetail.builder()
                                .code("RESOURCE_NOT_FOUND")
                                .message(ex.getMessage())
                                .build()));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleException ex) {
        log.warn("Business rule violation [{}]: {}", ex.getRuleCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ApiResponse.error(ex.getMessage(),
                        ApiResponse.ErrorDetail.builder()
                                .code(ex.getRuleCode())
                                .message(ex.getMessage())
                                .build()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        log.warn("Conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(),
                        ApiResponse.ErrorDetail.builder()
                                .code("CONFLICT")
                                .message(ex.getMessage())
                                .build()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed",
                        ApiResponse.ErrorDetail.builder()
                                .code("VALIDATION_ERROR")
                                .message("One or more fields have validation errors")
                                .fieldErrors(fieldErrors)
                                .build()));
    }

    @ExceptionHandler({
            org.springframework.security.access.AccessDeniedException.class,
            com.shiftops.common.exception.AccessDeniedException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(Exception ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(),
                        ApiResponse.ErrorDetail.builder()
                                .code("FORBIDDEN")
                                .message(ex.getMessage())
                                .build()));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(org.springframework.security.core.AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication failed: " + ex.getMessage(),
                        ApiResponse.ErrorDetail.builder()
                                .code("UNAUTHORIZED")
                                .message(ex.getMessage())
                                .build()));
    }

    @ExceptionHandler({
            ObjectOptimisticLockingFailureException.class,
            OptimisticLockException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLockingFailure(Exception ex) {
        log.warn("Optimistic locking conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Concurrent update conflict. The resource was modified by another transaction.",
                        ApiResponse.ErrorDetail.builder()
                                .code("CONCURRENT_MODIFICATION")
                                .message("The resource was updated concurrently by another request. Please reload and try again.")
                                .build()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("A database conflict or constraint violation occurred.",
                        ApiResponse.ErrorDetail.builder()
                                .code("DATA_INTEGRITY_VIOLATION")
                                .message("The requested operation violates a database constraint or unique constraint.")
                                .build()));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed JSON payload: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Malformed request payload.",
                        ApiResponse.ErrorDetail.builder()
                                .code("MALFORMED_REQUEST")
                                .message("Could not parse request body. Please verify JSON formatting and field types.")
                                .build()));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        log.warn("Upload size exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("File upload exceeds maximum permitted size.",
                        ApiResponse.ErrorDetail.builder()
                                .code("FILE_TOO_LARGE")
                                .message("The uploaded file exceeds the configured maximum upload size limit.")
                                .build()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred",
                        ApiResponse.ErrorDetail.builder()
                                .code("INTERNAL_ERROR")
                                .message("An unexpected error occurred. Please try again later.")
                                .build()));
    }
}
