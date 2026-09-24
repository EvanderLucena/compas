package com.compas.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Individual supplement, vitamin or phytotherapy item within a prescription.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prescription_item")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "prescription_id", nullable = false)
    private UUID prescriptionId;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(nullable = false, length = 120)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PrescriptionCategory category = PrescriptionCategory.SUPPLEMENT;

    @NotNull
    @Column(nullable = false, length = 80)
    private String dosage;

    @NotNull
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String form = "Pó";

    @NotNull
    @Column(nullable = false, length = 150)
    private String timing;

    @NotNull
    @Column(nullable = false, length = 60)
    @Builder.Default
    private String duration = "Uso contínuo";

    @NotNull
    @Column(name = "is_continuous", nullable = false)
    @Builder.Default
    private Boolean isContinuous = true;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @NotNull
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.category == null) {
            this.category = PrescriptionCategory.SUPPLEMENT;
        }
        if (this.form == null || this.form.isBlank()) {
            this.form = "Pó";
        }
        if (this.duration == null || this.duration.isBlank()) {
            this.duration = "Uso contínuo";
        }
        if (this.isContinuous == null) {
            this.isContinuous = true;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }
}
