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
           "  AND ((o.leaseExpiresAt IS NOT NULL AND o.leaseExpiresAt <= :now) " +
           "       OR (o.leaseExpiresAt IS NULL AND o.updatedAt <= :staleThreshold) " +
           "       OR o.updatedAt <= :staleThreshold) " +
           "ORDER BY o.updatedAt ASC")
    List<OutboxEvent> findStaleProcessingEvents(@Param("now") Instant now,
                                                @Param("staleThreshold") Instant staleThreshold,
                                                Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING, " +
           "o.claimToken = :claimToken, " +
           "o.leaseExpiresAt = :leaseExpiresAt, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND (" +
           "   o.status = com.shiftops.common.outbox.OutboxStatus.PENDING " +
           "   OR (o.status = com.shiftops.common.outbox.OutboxStatus.FAILED AND o.retryCount < o.maxRetries)" +
           ")")
    int claimEventAtomically(@Param("id") UUID id,
                             @Param("claimToken") UUID claimToken,
                             @Param("leaseExpiresAt") Instant leaseExpiresAt,
                             @Param("now") Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSED, " +
           "o.processedAt = :now, " +
           "o.claimToken = null, " +
           "o.leaseExpiresAt = null, " +
           "o.errorMessage = null, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND o.claimToken = :claimToken")
    int markProcessedAtomically(@Param("id") UUID id,
                                @Param("claimToken") UUID claimToken,
                                @Param("now") Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.PENDING, " +
           "o.retryCount = o.retryCount + 1, " +
           "o.scheduledAt = :scheduledAt, " +
           "o.claimToken = null, " +
           "o.leaseExpiresAt = null, " +
           "o.errorMessage = :errorMessage, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND o.claimToken = :claimToken")
    int markFailedAndRescheduled(@Param("id") UUID id,
                                 @Param("claimToken") UUID claimToken,
                                 @Param("scheduledAt") Instant scheduledAt,
                                 @Param("errorMessage") String errorMessage,
                                 @Param("now") Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.FAILED, " +
           "o.retryCount = o.retryCount + 1, " +
           "o.claimToken = null, " +
           "o.leaseExpiresAt = null, " +
           "o.errorMessage = :errorMessage, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND o.claimToken = :claimToken")
    int markPermanentlyFailed(@Param("id") UUID id,
                              @Param("claimToken") UUID claimToken,
                              @Param("errorMessage") String errorMessage,
                              @Param("now") Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.PENDING, " +
           "o.retryCount = o.retryCount + 1, " +
           "o.scheduledAt = :scheduledAt, " +
           "o.claimToken = null, " +
           "o.leaseExpiresAt = null, " +
           "o.errorMessage = :errorMessage, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND (o.claimToken = :claimToken OR (o.claimToken IS NULL AND :claimToken IS NULL)) " +
           "  AND ((o.leaseExpiresAt IS NOT NULL AND o.leaseExpiresAt <= :now) " +
           "       OR (o.leaseExpiresAt IS NULL AND o.updatedAt <= :staleThreshold) " +
           "       OR o.updatedAt <= :staleThreshold)")
    int recoverStaleEventToPending(@Param("id") UUID id,
                                   @Param("claimToken") UUID claimToken,
                                   @Param("scheduledAt") Instant scheduledAt,
                                   @Param("errorMessage") String errorMessage,
                                   @Param("now") Instant now,
                                   @Param("staleThreshold") Instant staleThreshold);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.status = com.shiftops.common.outbox.OutboxStatus.FAILED, " +
           "o.retryCount = o.retryCount + 1, " +
           "o.claimToken = null, " +
           "o.leaseExpiresAt = null, " +
           "o.errorMessage = :errorMessage, " +
           "o.updatedAt = :now, " +
           "o.version = o.version + 1 " +
           "WHERE o.id = :id AND o.status = com.shiftops.common.outbox.OutboxStatus.PROCESSING " +
           "  AND (o.claimToken = :claimToken OR (o.claimToken IS NULL AND :claimToken IS NULL)) " +
           "  AND ((o.leaseExpiresAt IS NOT NULL AND o.leaseExpiresAt <= :now) " +
           "       OR (o.leaseExpiresAt IS NULL AND o.updatedAt <= :staleThreshold) " +
           "       OR o.updatedAt <= :staleThreshold)")
    int recoverStaleEventToFailed(@Param("id") UUID id,
                                  @Param("claimToken") UUID claimToken,
                                  @Param("errorMessage") String errorMessage,
                                  @Param("now") Instant now,
                                  @Param("staleThreshold") Instant staleThreshold);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("UPDATE OutboxEvent o SET o.updatedAt = :updatedAt, o.leaseExpiresAt = :leaseExpiresAt WHERE o.id = :id")
    void forceProcessingState(@Param("id") UUID id,
                              @Param("updatedAt") Instant updatedAt,
                              @Param("leaseExpiresAt") Instant leaseExpiresAt);

    long countByStatus(OutboxStatus status);
}
