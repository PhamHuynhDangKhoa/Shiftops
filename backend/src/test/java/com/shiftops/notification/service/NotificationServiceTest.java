package com.shiftops.notification.service;

import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.notification.dto.UnreadCountResponse;
import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Clock clock;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private NotificationService notificationService;

    private User recipient;
    private User otherUser;
    private UserPrincipal recipientPrincipal;
    private UserPrincipal otherPrincipal;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2026-10-10T10:00:00Z");
        lenient().when(clock.instant()).thenReturn(now);
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));

        UUID recipientId = UUID.randomUUID();
        recipient = User.builder()
                .email("staff@shiftops.com")
                .fullName("Staff One")
                .role(Role.STAFF)
                .isActive(true)
                .build();
        recipient.setId(recipientId);
        recipientPrincipal = UserPrincipal.create(recipient);

        UUID otherId = UUID.randomUUID();
        otherUser = User.builder()
                .email("other@shiftops.com")
                .fullName("Other User")
                .role(Role.STAFF)
                .isActive(true)
                .build();
        otherUser.setId(otherId);
        otherPrincipal = UserPrincipal.create(otherUser);
    }

    @Test
    void createNotification_Success() {
        UUID shiftId = UUID.randomUUID();
        when(notificationRepository.existsByRecipientIdAndTypeAndReferenceId(recipient.getId(), NotificationType.SHIFT_PUBLISHED, shiftId))
                .thenReturn(false);
        when(userRepository.findById(recipient.getId())).thenReturn(Optional.of(recipient));
        when(notificationRepository.saveAndFlush(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        Optional<Notification> result = notificationService.createNotification(
                recipient.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "You are scheduled",
                ReferenceType.SHIFT,
                shiftId
        );

        assertThat(result).isPresent();
        Notification n = result.get();
        assertThat(n.getRecipient()).isEqualTo(recipient);
        assertThat(n.getType()).isEqualTo(NotificationType.SHIFT_PUBLISHED);
        assertThat(n.getTitle()).isEqualTo("Shift Published");
        assertThat(n.getMessage()).isEqualTo("You are scheduled");
        assertThat(n.getReferenceType()).isEqualTo(ReferenceType.SHIFT);
        assertThat(n.getReferenceId()).isEqualTo(shiftId);
        verify(notificationRepository).saveAndFlush(any(Notification.class));
    }

    @Test
    void createNotification_Deduplication() {
        UUID shiftId = UUID.randomUUID();
        when(notificationRepository.existsByRecipientIdAndTypeAndReferenceId(recipient.getId(), NotificationType.SHIFT_PUBLISHED, shiftId))
                .thenReturn(true);

        Optional<Notification> result = notificationService.createNotification(
                recipient.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "You are scheduled",
                ReferenceType.SHIFT,
                shiftId
        );

        assertThat(result).isEmpty();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createNotification_InactiveUser() {
        UUID shiftId = UUID.randomUUID();
        recipient.setActive(false);
        when(notificationRepository.existsByRecipientIdAndTypeAndReferenceId(recipient.getId(), NotificationType.SHIFT_PUBLISHED, shiftId))
                .thenReturn(false);
        when(userRepository.findById(recipient.getId())).thenReturn(Optional.of(recipient));

        Optional<Notification> result = notificationService.createNotification(
                recipient.getId(),
                NotificationType.SHIFT_PUBLISHED,
                "Shift Published",
                "You are scheduled",
                ReferenceType.SHIFT,
                shiftId
        );

        assertThat(result).isEmpty();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createNotification_NullRecipient() {
        Optional<Notification> result = notificationService.createNotification(
                null,
                NotificationType.SHIFT_PUBLISHED,
                "Title",
                "Message",
                ReferenceType.SHIFT,
                UUID.randomUUID()
        );

        assertThat(result).isEmpty();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void getMyNotifications_ReturnsPagedList() {
        Notification n = Notification.builder()
                .recipient(recipient)
                .type(NotificationType.TASK_ASSIGNED)
                .title("Task Assigned")
                .message("Check floor")
                .build();
        n.setId(UUID.randomUUID());

        Pageable pageable = PageRequest.of(0, 10);
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipient.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(n)));

        Page<NotificationResponse> page = notificationService.getMyNotifications(recipientPrincipal, pageable);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).title()).isEqualTo("Task Assigned");
    }

    @Test
    void getUnreadCount_ReturnsCount() {
        when(notificationRepository.countByRecipientIdAndReadAtIsNull(recipient.getId())).thenReturn(3L);

        UnreadCountResponse response = notificationService.getUnreadCount(recipientPrincipal);

        assertThat(response.count()).isEqualTo(3L);
    }

    @Test
    void markAsRead_Success() {
        UUID notificationId = UUID.randomUUID();
        Notification n = Notification.builder()
                .recipient(recipient)
                .type(NotificationType.TASK_ASSIGNED)
                .title("Task")
                .message("Msg")
                .build();
        n.setId(notificationId);

        when(notificationRepository.findByIdWithRecipient(notificationId)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(notificationId, recipientPrincipal);

        assertThat(response.read()).isTrue();
        assertThat(response.readAt()).isEqualTo(now);
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsRead_OtherUser_ThrowsAccessDenied() {
        UUID notificationId = UUID.randomUUID();
        Notification n = Notification.builder()
                .recipient(recipient)
                .type(NotificationType.TASK_ASSIGNED)
                .title("Task")
                .message("Msg")
                .build();
        n.setId(notificationId);

        when(notificationRepository.findByIdWithRecipient(notificationId)).thenReturn(Optional.of(n));

        assertThatThrownBy(() -> notificationService.markAsRead(notificationId, otherPrincipal))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission");
    }

    @Test
    void markAllAsRead_Success() {
        when(notificationRepository.markAllAsRead(recipient.getId(), now)).thenReturn(5);

        int updated = notificationService.markAllAsRead(recipientPrincipal);

        assertThat(updated).isEqualTo(5);
        verify(notificationRepository).markAllAsRead(recipient.getId(), now);
    }
}
