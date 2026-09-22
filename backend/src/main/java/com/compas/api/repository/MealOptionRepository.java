package com.compas.api.repository;

import com.compas.api.model.MealOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealOptionRepository extends JpaRepository<MealOption, UUID> {

    List<MealOption> findByMealSlotIdOrderBySortOrder(UUID mealSlotId);

    void deleteAllByMealSlotId(UUID mealSlotId);

    @Query("""
            select o
            from MealOption o
            join MealSlot s on s.id = o.mealSlotId
            join MealPlan p on p.id = s.planId
            where s.planId = :planId
              and p.nutritionistId = :nutritionistId
            order by o.mealSlotId asc, o.sortOrder asc
            """)
    List<MealOption> findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(
            @Param("planId") UUID planId,
            @Param("nutritionistId") UUID nutritionistId);
}
