package com.shiftops.auth.service;

import com.shiftops.auth.dto.AuthResponse;
import com.shiftops.auth.dto.LoginRequest;
import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.user.dto.UserResponse;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCaseWithBranch(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String token = jwtTokenProvider.generateToken(principal);

        return AuthResponse.of(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(UserPrincipal principal) {
        User user = userRepository.findByEmailIgnoreCaseWithBranch(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        return UserResponse.fromEntity(user);
    }
}
