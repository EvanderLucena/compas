package com.compas.api.dto.biometry;

import java.time.LocalDateTime;
import java.util.UUID;

public record PatientTimelineEventResponse(
        UUID id,
        UUID episodeId,
        String episodeTitle,
        boolean currentEpisode,
        String eventType,
        LocalDateTime eventAt,
        String title,
        String description,
        String sourceRef,
        String metadataJson
) {}
