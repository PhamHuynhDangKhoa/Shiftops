package com.shiftops.realtime.security;

import com.shiftops.common.security.CustomUserDetailsService;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.realtime.service.WebSocketMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final WebSocketMetrics metrics;

    private static final Pattern BRANCH_TOPIC_PATTERN = Pattern.compile("^/topic/branches/([0-9a-fA-F-]+)(/.*)?$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String token = resolveToken(accessor);
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            metrics.recordConnectionFailure();
            log.warn("STOMP CONNECT rejected: invalid or missing authentication token");
            throw new BadCredentialsException("Invalid or missing WebSocket authentication token");
        }

        try {
            UUID userId = jwtTokenProvider.getUserIdFromToken(token);
            UserPrincipal principal = (UserPrincipal) customUserDetailsService.loadUserById(userId);

            if (!principal.isEnabled()) {
                metrics.recordConnectionFailure();
                log.warn("STOMP CONNECT rejected: user account {} is inactive", userId);
                throw new BadCredentialsException("User account is inactive");
            }

            Authentication auth = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities()
            ) {
                @Override
                public String getName() {
                    return principal.getId().toString();
                }
            };

            accessor.setUser(auth);
            log.info("STOMP CONNECT authenticated for user {} ({}) with role {}",
                    principal.getId(), principal.getUsername(), principal.getRole());
        } catch (BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            metrics.recordConnectionFailure();
            log.warn("STOMP CONNECT authentication failed: {}", e.getMessage());
            throw new BadCredentialsException("Failed to authenticate STOMP connection: " + e.getMessage());
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            log.warn("STOMP SUBSCRIBE rejected: unauthenticated user");
            throw new AccessDeniedException("Unauthenticated subscription");
        }

        UserPrincipal principal;
        if (user instanceof Authentication auth && auth.getPrincipal() instanceof UserPrincipal up) {
            principal = up;
        } else {
            log.warn("STOMP SUBSCRIBE rejected: unexpected principal type {}", user.getClass().getName());
            throw new AccessDeniedException("Invalid authentication principal");
        }

        String destination = accessor.getDestination();
        if (destination == null) {
            log.warn("STOMP SUBSCRIBE rejected: destination is null");
            throw new AccessDeniedException("Destination cannot be null");
        }

        validateSubscriptionDestination(principal, destination);
    }

    private void validateSubscriptionDestination(UserPrincipal principal, String destination) {
        Matcher matcher = BRANCH_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            UUID branchId;
            try {
                branchId = UUID.fromString(matcher.group(1));
            } catch (IllegalArgumentException e) {
                throw new AccessDeniedException("Invalid branch ID format in destination: " + destination);
            }

            if (principal.isOwner()) {
                // Owners can monitor operations across all branches
                log.debug("Owner {} subscribed to branch topic {}", principal.getId(), destination);
                return;
            }

            if (principal.isManager()) {
                if (principal.getPrimaryBranchId() == null || !principal.getPrimaryBranchId().equals(branchId)) {
                    log.warn("Manager {} attempted unauthorized subscription to foreign branch topic {}",
                            principal.getId(), destination);
                    throw new AccessDeniedException("Manager cannot subscribe to another branch's operational channel");
                }
                log.debug("Manager {} subscribed to own branch topic {}", principal.getId(), destination);
                return;
            }

            // Staff members are prohibited from subscribing to manager operational channels
            log.warn("Staff {} attempted unauthorized subscription to manager branch topic {}",
                    principal.getId(), destination);
            throw new AccessDeniedException("Staff cannot subscribe to branch operational channels");
        }

        if (destination.startsWith("/queue/") && !destination.startsWith("/user/queue/")) {
            log.warn("User {} attempted direct subscription to /queue destination: {}", principal.getId(), destination);
            throw new AccessDeniedException("Direct subscription to /queue without /user prefix is not allowed");
        }

        log.debug("User {} subscribed to destination {}", principal.getId(), destination);
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        String token = accessor.getFirstNativeHeader("access_token");
        if (token == null) {
            token = accessor.getFirstNativeHeader("token");
        }
        return token;
    }
}
