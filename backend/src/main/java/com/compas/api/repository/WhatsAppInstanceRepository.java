package com.compas.api.repository;

import com.compas.api.model.WhatsAppInstance;
import com.compas.api.model.WhatsAppInstanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhatsAppInstanceRepository extends JpaRepository<WhatsAppInstance, UUID> {

    Optional<WhatsAppInstance> findByName(String name);

    List<WhatsAppInstance> findAllByOrderByCreatedAtDesc();

    List<WhatsAppInstance> findByActiveTrueOrderByCreatedAtAsc();

    Optional<WhatsAppInstance> findFirstByActiveTrueAndStatusOrderByCreatedAtAsc(WhatsAppInstanceStatus status);
}
