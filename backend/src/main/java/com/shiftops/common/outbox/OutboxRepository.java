package com.shiftops.common.outbox;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {

    @Query("SELECT o FROM OutboxEvent o " +
           "WHERE (o.status = com.shiftops.common.outbox.OutboxStatus.PENDING " +
           "   OR (o.status = com.shiftops.common.outbox.OutboxStatus.FAILED AND o.retryCount < o.maxRetries)) " +
           "  AND o.scheduledAt <= :now " +
           "ORDER BY o.scheduledAt ASC")
    List<OutboxEvent> findEligibleEvents(@Param("now") Instant now, Pageable pageable);

    @Query("SELECT o FROM OutboxEvent o " +
           "WHERE o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND o.updatedAt <= :staleThreshold " +
           "ORDER BY o.updatedAt ASC")
    List<OutboxEvent> findStaleProcessingEvents(@Param("staleThreshold") Instant staleThreshold, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING, o.updatedAt = :now " +
           "WHERE o.id = :id AND (o.status = com.shiftops.common.outbox.OutboxStatus.PENDING " +
           "   OR (o.status = com.shiftops.common.outbox.OutboxStatus.FAILED AND o.retryCount < o.maxRetries))")
    int claimEventAtomically(@Param("id") UUID id, @Param("now") Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.updatedAt = :updatedAt WHERE o.id = :id")
    void forceUpdatedAt(@Param("id") UUID id, @Param("updatedAt") Instant updatedAt);

    long countByStatus(OutboxStatus status);
}
