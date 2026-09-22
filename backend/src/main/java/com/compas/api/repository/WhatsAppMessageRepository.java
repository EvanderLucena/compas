package com.compas.api.repository;

import com.compas.api.model.WhatsAppMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhatsAppMessageRepository extends JpaRepository<WhatsAppMessage, UUID> {

    /**
     * Find unprocessed messages by normalized sender phone (for phone lookup / D-16).
     */
    List<WhatsAppMessage> findBySenderPhoneNormalizedAndProcessedFalse(String phone);

    /**
     * Find messages for a patient scoped by nutritionist (tenant isolation, D-14).
     */
    List<WhatsAppMessage> findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(UUID patientId, UUID nutritionistId);

    /**
     * Find top 6 most recent messages for a patient scoped by nutritionist (for conversation context).
     */
    List<WhatsAppMessage> findTop6ByPatientIdAndNutritionistIdOrderByCreatedAtDesc(UUID patientId, UUID nutritionistId);

    /**
     * Find by Evolution API message ID for dedup (D-05).
     */
    Optional<WhatsAppMessage> findByMessageId(String messageId);

    /**
     * Check if a patient has any previously processed messages (for first-message detection, D-17).
     */
    boolean existsByPatientIdAndProcessedTrue(UUID patientId);

    /**
     * Count messages for a patient (for first-message detection, D-17).
     */
    long countByPatientId(UUID patientId);

    /**
     * Find the most recent message for a nutritionist (for status endpoint, D-23).
     */
    Optional<WhatsAppMessage> findTopByNutritionistIdOrderByCreatedAtDesc(UUID nutritionistId);

    /**
     * Count distinct patients with at least one processed message for a nutritionist (D-23).
     */
    @Query("SELECT COUNT(DISTINCT m.patientId) FROM WhatsAppMessage m WHERE m.nutritionistId = :nutritionistId AND m.processed = true")
    long countDistinctPatientIdByNutritionistIdAndProcessedTrue(@Param("nutritionistId") UUID nutritionistId);

    /**
     * Check if there are any messages in the last N hours for a nutritionist (D-23 connectivity check).
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM WhatsAppMessage m "
            + "WHERE m.nutritionistId = :nutritionistId AND m.createdAt > :since")
    boolean existsByNutritionistIdAndCreatedAtAfter(@Param("nutritionistId") UUID nutritionistId,
                                                   @Param("since") LocalDateTime since);

    /**
     * Check if an unknown sender (patientId is null) was already received recently (anti-spam debounce).
     */
    boolean existsBySenderPhoneNormalizedAndPatientIdIsNullAndCreatedAtAfter(
            String senderPhoneNormalized,
            LocalDateTime since
    );

    /**
     * Find failed messages eligible for retry (processed=false, retries < max).
     * Returns paginated results to prevent OOM with large failure volumes.
     */
    Page<WhatsAppMessage> findByProcessedFalseAndRetryCountLessThanOrderByCreatedAtAsc(
            int maxRetryCount,
            Pageable pageable
    );

    /**
     * Find messages flagged as requiring human attention or emergency that are unresolved for a nutritionist, newest first.
     */
    @Query("SELECT m FROM WhatsAppMessage m WHERE m.nutritionistId = :nutritionistId "
            + "AND (m.jevRequiresAttention = true OR m.jevIntent = 'emergency') "
            + "AND m.jevAttentionResolved = false ORDER BY m.createdAt DESC")
    List<WhatsAppMessage> findUnresolvedAttentionMessages(@Param("nutritionistId") UUID nutritionistId);

    /**
     * Count unresolved messages flagged as requiring human attention or emergency for a nutritionist.
     */
    @Query("SELECT COUNT(m) FROM WhatsAppMessage m WHERE m.nutritionistId = :nutritionistId "
            + "AND (m.jevRequiresAttention = true OR m.jevIntent = 'emergency') "
            + "AND m.jevAttentionResolved = false")
    long countUnresolvedAttentionMessages(@Param("nutritionistId") UUID nutritionistId);

    /**
     * Find message by id and nutritionistId for tenant-isolated updates.
     */
    Optional<WhatsAppMessage> findByIdAndNutritionistId(UUID id, UUID nutritionistId);

    /**
     * Find recent messages by sentiment for a nutritionist.
     */
    List<WhatsAppMessage> findByNutritionistIdAndJevSentimentOrderByCreatedAtDesc(
            UUID nutritionistId, String jevSentiment);

    /**
     * Aggregate sentiment distribution for messages since a given date.
     */
    @Query("SELECT m.jevSentiment, COUNT(m) FROM WhatsAppMessage m "
            + "WHERE m.nutritionistId = :nutritionistId AND m.jevSentiment IS NOT NULL "
            + "AND m.createdAt >= :since GROUP BY m.jevSentiment")
    List<Object[]> countSentimentDistribution(
            @Param("nutritionistId") UUID nutritionistId,
            @Param("since") LocalDateTime since);
}