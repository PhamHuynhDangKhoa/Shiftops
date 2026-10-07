package com.shiftops.auth.service;

import com.shiftops.auth.dto.AuthResponse;
import com.shiftops.auth.dto.LoginRequest;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .email("test@shiftops.com")
                .passwordHash("hashed_password")
                .fullName("Test User")
                .role(Role.OWNER)
                .isActive(true)
                .build();
        activeUser.setId(UUID.randomUUID());
    }

    @Test
    void shouldLoginSuccessfullyWithValidCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("test@shiftops.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailIgnoreCaseWithBranch("test@shiftops.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(any())).thenReturn("valid.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("valid.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("test@shiftops.com", response.getUser().getEmail());
    }

    @Test
    void shouldRejectWhenUserNotFound() {
        LoginRequest request = LoginRequest.builder()
                .email("unknown@shiftops.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailIgnoreCaseWithBranch("unknown@shiftops.com"))
                .thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void shouldRejectWhenPasswordMismatch() {
        LoginRequest request = LoginRequest.builder()
                .email("test@shiftops.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findByEmailIgnoreCaseWithBranch("test@shiftops.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongpassword", "hashed_password")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void shouldRejectWhenUserInactive() {
        activeUser.setActive(false);
        LoginRequest request = LoginRequest.builder()
                .email("test@shiftops.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailIgnoreCaseWithBranch("test@shiftops.com"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("password123", "hashed_password")).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
