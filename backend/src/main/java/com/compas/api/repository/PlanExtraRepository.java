package com.compas.api.repository;

import com.compas.api.model.PlanExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanExtraRepository extends JpaRepository<PlanExtra, UUID> {

    /**
     * Find extras for a plan, ordered by sort order.
     */
    List<PlanExtra> findByPlanIdOrderBySortOrder(UUID planId);

    /**
     * Delete all extras for a given plan (service-layer cascade).
     */
    void deleteAllByPlanId(UUID planId);
}