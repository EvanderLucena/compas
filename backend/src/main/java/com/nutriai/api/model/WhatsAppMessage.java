package com.nutriai.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Inbound WhatsApp message from Evolution API webhook.
 * Persisted before async processing to guarantee durability.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "whatsapp_message")
public class WhatsAppMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "message_id", nullable = false, unique = true, length = 100)
    private String messageId;

    @NotNull
    @Column(name = "instance_id", nullable = false, length = 100)
    private String instanceId;

    @NotNull
    @Column(name = "sender_phone", nullable = false, length = 30)
    private String senderPhone;

    @NotNull
    @Column(name = "sender_phone_normalized", nullable = false, length = 20)
    private String senderPhoneNormalized;

    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "nutritionist_id")
    private UUID nutritionistId;

    @NotNull
    @Builder.Default
    @Column(name = "message_type", nullable = false, length = 20)
    private String messageType = "text";

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "media_url", columnDefinition = "TEXT")
    private String mediaUrl;

    @NotNull
    @Builder.Default
    @Column(nullable = false)
    private Boolean processed = false;

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "last_retry_at")
    private LocalDateTime lastRetryAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (processed == null) {
            processed = false;
        }
        if (messageType == null) {
            messageType = "text";
        }
    }
}