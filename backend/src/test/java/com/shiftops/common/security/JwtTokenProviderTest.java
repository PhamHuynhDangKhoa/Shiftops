package com.shiftops.common.security;

import com.shiftops.user.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, expirationMs);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        UUID userId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();

        UserPrincipal principal = UserPrincipal.builder()
                .id(userId)
                .email("owner@shiftops.com")
                .role(Role.OWNER)
                .primaryBranchId(branchId)
                .active(true)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")))
                .build();

        String token = tokenProvider.generateToken(principal);
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        assertEquals(userId, tokenProvider.getUserIdFromToken(token));
        assertEquals("owner@shiftops.com", tokenProvider.getEmailFromToken(token));
        assertEquals("OWNER", tokenProvider.getRoleFromToken(token));
        assertEquals(branchId, tokenProvider.getBranchIdFromToken(token));
    }

    @Test
    void shouldHandleNullBranchIdInToken() {
        UUID userId = UUID.randomUUID();

        UserPrincipal principal = UserPrincipal.builder()
                .id(userId)
                .email("globalowner@shiftops.com")
                .role(Role.OWNER)
                .primaryBranchId(null)
                .active(true)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")))
                .build();

        String token = tokenProvider.generateToken(principal);
        assertTrue(tokenProvider.validateToken(token));
        assertNull(tokenProvider.getBranchIdFromToken(token));
    }

    @Test
    void shouldRejectInvalidToken() {
        assertFalse(tokenProvider.validateToken("invalid.token.here"));
    }
}
