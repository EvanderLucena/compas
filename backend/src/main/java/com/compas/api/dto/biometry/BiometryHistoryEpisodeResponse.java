package com.compas.api.dto.biometry;

import java.time.LocalDateTime;
import java.util.UUID;

public record BiometryHistoryEpisodeResponse(
        UUID episodeId,
        LocalDateTime startDate,
        LocalDateTime endDate,
        boolean hasBiometry,
        int assessmentCount,
        int durationDays
) {}