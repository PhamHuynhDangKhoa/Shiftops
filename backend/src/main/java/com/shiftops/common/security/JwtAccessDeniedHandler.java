package com.shiftops.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        ApiResponse<Void> apiResponse = ApiResponse.error(
                "Access denied: You do not have permission to access this resource",
                ApiResponse.ErrorDetail.builder()
                        .code("FORBIDDEN")
                        .message(accessDeniedException.getMessage())
                        .build()
        );

        response.getOutputStream().println(objectMapper.writeValueAsString(apiResponse));
    }
}
