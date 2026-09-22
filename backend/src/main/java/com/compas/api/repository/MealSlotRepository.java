package com.compas.api.repository;

import com.compas.api.model.MealSlot;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealSlotRepository extends JpaRepository<MealSlot, UUID> {

    /**
     * Find meal slots for a plan, ordered by sort order.
     */
    List<MealSlot> findByPlanIdOrderBySortOrder(UUID planId);

    /**
     * Find meal slots for a plan scoped by nutritionist, ordered by sort order.
     */
    @Query("""
            select s
            from MealSlot s
            join MealPlan p on p.id = s.planId
            where s.planId = :planId
              and p.nutritionistId = :nutritionistId
            order by s.sortOrder asc
            """)
    List<MealSlot> findByPlanIdAndNutritionistIdOrderBySortOrder(
            @Param("planId") UUID planId,
            @Param("nutritionistId") UUID nutritionistId);
}
