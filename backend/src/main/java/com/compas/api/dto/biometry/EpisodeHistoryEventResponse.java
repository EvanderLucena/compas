package com.compas.api.dto.biometry;

import java.time.LocalDateTime;
import java.util.UUID;

public record EpisodeHistoryEventResponse(
        UUID id,
        String eventType,
        LocalDateTime eventAt,
        String title,
        String description,
        String sourceRef
) {}