package com.shiftops.notification.repository;

import com.shiftops.notification.entity.Notification;
import com.shiftops.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);

    boolean existsByRecipientIdAndTypeAndReferenceId(UUID recipientId, NotificationType type, UUID referenceId);

    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT n FROM Notification n JOIN FETCH n.recipient WHERE n.id = :id")
    Optional<Notification> findByIdWithRecipient(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :readAt WHERE n.recipient.id = :recipientId AND n.readAt IS NULL")
    int markAllAsRead(@Param("recipientId") UUID recipientId, @Param("readAt") Instant readAt);
}
