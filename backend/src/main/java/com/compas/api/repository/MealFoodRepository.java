package com.compas.api.repository;

import com.compas.api.model.MealFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MealFoodRepository extends JpaRepository<MealFood, UUID> {

    List<MealFood> findByOptionIdOrderBySortOrder(UUID optionId);

    void deleteAllByOptionId(UUID optionId);

    @Query("SELECT f FROM MealFood f WHERE f.optionId IN :optionIds ORDER BY f.optionId, f.sortOrder")
    List<MealFood> findAllByOptionIds(@Param("optionIds") List<UUID> optionIds);
}