package com.compas.api.dto.intelligence;

import java.util.List;

public record ClinicalRadarDTO(
        RadarSummaryDTO summary,
        List<AttentionItemDTO> attentionQueue,
        SentimentDistributionDTO sentimentDistribution
) {}
