package com.nutriai.api.dto.intelligence;

public record SentimentDistributionDTO(
        long motivated,
        long neutral,
        long struggling,
        long anxious
) {}
