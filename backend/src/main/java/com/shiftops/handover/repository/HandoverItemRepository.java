package com.shiftops.handover.repository;

import com.shiftops.handover.entity.HandoverItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HandoverItemRepository extends JpaRepository<HandoverItem, UUID> {

    List<HandoverItem> findByHandoverIdOrderByOrderIndexAscCreatedAtAsc(UUID handoverId);
}
