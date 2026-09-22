package com.compas.api.dto.biometry;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BiometryHistorySnapshotResponse(
        UUID episodeId,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String episodeObjective,
        int mealSlotCount,
        int foodItemCount,
        List<BiometryAssessmentResponse> assessments,
        List<EpisodeHistoryEventResponse> timelineEvents
) {}