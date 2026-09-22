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
 * Read-model event backing closed-episode cycle history snapshots.
 * Stored as immutable records for chronological timeline queries.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "episode_history_event")
public class EpisodeHistoryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "episode_id", nullable = false)
    private UUID episodeId;

    @NotNull
    @Column(name = "nutritionist_id", nullable = false)
    private UUID nutritionistId;

    @NotNull
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @NotNull
    @Column(name = "event_at", nullable = false)
    private LocalDateTime eventAt;

    @NotNull
    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_ref", length = 200)
    private String sourceRef;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
