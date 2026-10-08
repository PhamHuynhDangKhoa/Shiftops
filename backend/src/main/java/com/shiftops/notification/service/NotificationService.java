package com.shiftops.notification.service;

import com.shiftops.common.exception.ResourceNotFoundException;
import com.shiftops.common.security.UserPrincipal;
import com.shiftops.notification.dto.NotificationResponse;
import com.shiftops.notification.dto.UnreadCountResponse;
import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.shiftops.notification.event.NotificationCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final Clock clock;

    public Optional<Notification> createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            ReferenceType referenceType,
            UUID referenceId) {
        return createNotification(recipientId, type, title, message, referenceType, referenceId, null);
    }

    public Optional<Notification> createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            ReferenceType referenceType,
            UUID referenceId,
            String idempotencyKey) {

        if (recipientId == null) {
            return Optional.empty();
        }

        String effectiveKey = idempotencyKey;
        if (effectiveKey == null && referenceId != null) {
            effectiveKey = recipientId + ":" + type + ":" + referenceId;
        }

        // Fast application-level deduplication check
        if (effectiveKey != null && notificationRepository.existsByIdempotencyKey(effectiveKey)) {
            log.debug("Skipping duplicate notification for idempotencyKey {}", effectiveKey);
            return Optional.empty();
        }
        if (referenceId != null && notificationRepository.existsByRecipientIdAndTypeAndReferenceId(recipientId, type, referenceId)) {
            log.debug("Skipping duplicate notification for user {}, type {}, refId {}", recipientId, type, referenceId);
            return Optional.empty();
        }

        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null || !recipient.isActive()) {
            log.debug("Skipping notification for missing or inactive user {}", recipientId);
            return Optional.empty();
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .idempotencyKey(effectiveKey)
                .build();

        if (transactionManager != null) {
            org.springframework.transaction.support.TransactionTemplate tx =
                    new org.springframework.transaction.support.TransactionTemplate(transactionManager);
            tx.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);

            try {
                return tx.execute(status -> Optional.of(doSaveAndPublish(notification, recipientId)));
            } catch (org.springframework.dao.DataIntegrityViolationException
                    | org.springframework.transaction.UnexpectedRollbackException
                    | org.springframework.transaction.TransactionSystemException ex) {
                log.info("Concurrent duplicate notification suppressed by DB constraint: user={}, type={}, ref={}, key={}",
                        recipientId, type, referenceId, effectiveKey);
                return Optional.empty();
            }
        } else {
            try {
                return Optional.of(doSaveAndPublish(notification, recipientId));
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                return Optional.empty();
            }
        }
    }

    private Notification doSaveAndPublish(Notification notification, UUID recipientId) {
        Notification saved = notificationRepository.saveAndFlush(notification);
        long unreadCount = notificationRepository.countByRecipientIdAndReadAtIsNull(recipientId);
        eventPublisher.publishEvent(new NotificationCreatedEvent(NotificationResponse.fromEntity(saved), unreadCount));
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UserPrincipal principal, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(principal.getId(), pageable)
                .map(NotificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UserPrincipal principal) {
        long count = notificationRepository.countByRecipientIdAndReadAtIsNull(principal.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id, UserPrincipal principal) {
        Notification notification = notificationRepository.findByIdWithRecipient(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));

        if (!notification.getRecipient().getId().equals(principal.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this notification");
        }

        if (!notification.isRead()) {
            notification.markAsRead(clock.instant());
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllAsRead(UserPrincipal principal) {
        return notificationRepository.markAllAsRead(principal.getId(), clock.instant());
    }
}
