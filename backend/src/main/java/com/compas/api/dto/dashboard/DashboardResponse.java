package com.compas.api.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DashboardResponse(
        Kpis kpis,
        List<RecentEvaluation> recentEvaluations
) {
    public record Kpis(
            long activePatients,
            long onTrackPatients,
            long attentionPatients,
            long criticalPatients,
            BigDecimal averageAdherence,
            int assessedInLast30Days,
            int pendingAssessmentCount
    ) {}

    public record RecentEvaluation(
            UUID patientId,
            String patientName,
            String initials,
            String status,
            LocalDate assessmentDate,
            BigDecimal weight,
            BigDecimal bodyFatPercent
    ) {}
}
