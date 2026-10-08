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

    long countByStatus(OutboxStatus status);
}
