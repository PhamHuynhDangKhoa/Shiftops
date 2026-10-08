package com.shiftops.realtime.security;

import com.shiftops.common.security.CustomUserDetailsService;
import com.shiftops.common.security.JwtTokenProvider;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.realtime.service.WebSocketMetrics;
import com.shiftops.user.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private WebSocketMetrics metrics;

    @Mock
    private MessageChannel channel;

    @InjectMocks
    private StompAuthChannelInterceptor interceptor;

    private UUID userId;
    private UUID branchId1;
    private UUID branchId2;
    private UserPrincipal managerPrincipal;
    private UserPrincipal ownerPrincipal;
    private UserPrincipal staffPrincipal;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        branchId1 = UUID.randomUUID();
        branchId2 = UUID.randomUUID();

        managerPrincipal = UserPrincipal.builder()
                .id(userId)
                .email("manager@shiftops.com")
                .role(Role.MANAGER)
                .primaryBranchId(branchId1)
                .active(true)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_MANAGER")))
                .build();

        ownerPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("owner@shiftops.com")
                .role(Role.OWNER)
                .primaryBranchId(null)
                .active(true)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")))
                .build();

        staffPrincipal = UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("staff@shiftops.com")
                .role(Role.STAFF)
                .primaryBranchId(branchId1)
                .active(true)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_STAFF")))
                .build();
    }

    @Test
    void preSend_ValidConnect_AuthenticatesAndSetsPrincipal() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer valid-token");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(jwtTokenProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("valid-token")).thenReturn(userId);
        when(customUserDetailsService.loadUserById(userId)).thenReturn(managerPrincipal);

        Message<?> result = interceptor.preSend(message, channel);

        assertThat(result).isNotNull();
        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        Authentication auth = (Authentication) resultAccessor.getUser();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo(userId.toString());
        assertThat(auth.getPrincipal()).isEqualTo(managerPrincipal);
    }

    @Test
    void preSend_MissingTokenConnect_ThrowsBadCredentialsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid or missing WebSocket authentication token");

        verify(metrics).recordConnectionFailure();
    }

    @Test
    void preSend_InvalidTokenConnect_ThrowsBadCredentialsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer invalid-token");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(jwtTokenProvider.validateToken("invalid-token")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid or missing WebSocket authentication token");

        verify(metrics).recordConnectionFailure();
    }

    @Test
    void preSend_InactiveUserConnect_ThrowsBadCredentialsException() {
        UserPrincipal inactivePrincipal = UserPrincipal.builder()
                .id(userId)
                .email("inactive@shiftops.com")
                .role(Role.STAFF)
                .active(false)
                .build();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer token");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(jwtTokenProvider.validateToken("token")).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken("token")).thenReturn(userId);
        when(customUserDetailsService.loadUserById(userId)).thenReturn(inactivePrincipal);

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("User account is inactive");

        verify(metrics).recordConnectionFailure();
    }

    @Test
    void preSend_ManagerSubscribesToOwnBranch_Allowed() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/branches/" + branchId1 + "/operations");
        accessor.setUser(new UsernamePasswordAuthenticationToken(managerPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, channel);
        assertThat(result).isNotNull();
    }

    @Test
    void preSend_ManagerSubscribesToForeignBranch_ThrowsAccessDeniedException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/branches/" + branchId2 + "/operations");
        accessor.setUser(new UsernamePasswordAuthenticationToken(managerPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Manager cannot subscribe to another branch's operational channel");
    }

    @Test
    void preSend_OwnerSubscribesToAnyBranch_Allowed() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/branches/" + branchId2 + "/operations");
        accessor.setUser(new UsernamePasswordAuthenticationToken(ownerPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, channel);
        assertThat(result).isNotNull();
    }

    @Test
    void preSend_StaffSubscribesToBranchOperations_ThrowsAccessDeniedException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/branches/" + branchId1 + "/operations");
        accessor.setUser(new UsernamePasswordAuthenticationToken(staffPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff cannot subscribe to branch operational channels");
    }

    @Test
    void preSend_StaffSubscribesToUserQueue_Allowed() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/queue/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(staffPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, channel);
        assertThat(result).isNotNull();
    }

    @Test
    void preSend_DirectQueueSubscription_ThrowsAccessDeniedException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/queue/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(staffPrincipal, null));
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Direct subscription to /queue without /user prefix is not allowed");
    }

    @Test
    void preSend_UnauthenticatedSubscribe_ThrowsAccessDeniedException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/queue/notifications");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Unauthenticated subscription");
    }
}
