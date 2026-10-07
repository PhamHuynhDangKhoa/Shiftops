package com.shiftops.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiftops.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ApiResponse<Void> apiResponse = ApiResponse.error(
                "Unauthorized: Authentication token is missing or invalid",
                ApiResponse.ErrorDetail.builder()
                        .code("UNAUTHORIZED")
                        .message(authException.getMessage())
                        .build()
        );

        response.getOutputStream().println(objectMapper.writeValueAsString(apiResponse));
    }
}
