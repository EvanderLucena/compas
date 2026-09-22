package com.compas.api.model;

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
 * AI response sent back to a patient via WhatsApp.
 * One WhatsAppMessage can have multiple responses (e.g., meal extraction + acknowledgment).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "whatsapp_response")
public class WhatsAppResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @NotNull
    @Column(name = "response_type", nullable = false, length = 30)
    private String responseType;

    @NotNull
    @Column(name = "response_content", nullable = false, columnDefinition = "TEXT")
    private String responseContent;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}