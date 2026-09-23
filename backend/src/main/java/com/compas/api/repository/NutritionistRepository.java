package com.compas.api.repository;

import com.compas.api.model.Nutritionist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NutritionistRepository extends JpaRepository<Nutritionist, UUID> {
    Optional<Nutritionist> findByEmail(String email);
    Optional<Nutritionist> findByEmailVerificationToken(String token);
    boolean existsByEmail(String email);
}