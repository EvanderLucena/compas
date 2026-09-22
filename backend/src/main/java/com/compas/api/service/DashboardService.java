package com.compas.api.service;

import com.compas.api.dto.dashboard.DashboardResponse;
import com.compas.api.model.BiometryAssessment;
import com.compas.api.model.Episode;
import com.compas.api.model.Patient;
import com.compas.api.model.PatientStatus;
import com.compas.api.repository.BiometryAssessmentRepository;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final BiometryAssessmentRepository assessmentRepository;

    public DashboardService(PatientRepository patientRepository,
                            EpisodeRepository episodeRepository,
                            BiometryAssessmentRepository assessmentRepository) {
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID nutritionistId) {
        List<Patient> allPatients = patientRepository.findAllByNutritionistId(nutritionistId);

        long activePatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive())).count();
        long onTrackPatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getStatus() == PatientStatus.ONTRACK).count();
        long attentionPatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getStatus() == PatientStatus.WARNING).count();
        long criticalPatients = allPatients.stream().filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getStatus() == PatientStatus.DANGER).count();

        BigDecimal averageAdherence = null;
        List<Integer> adherenceValues = allPatients.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()) && p.getAdherence() != null)
                .map(Patient::getAdherence)
                .toList();
        if (!adherenceValues.isEmpty()) {
            int adherenceSum = adherenceValues.stream().mapToInt(Integer::intValue).sum();
            averageAdherence = BigDecimal.valueOf(adherenceSum)
                    .divide(BigDecimal.valueOf(adherenceValues.size()), 1, RoundingMode.HALF_UP);
        }

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        int assessedInLast30Days = 0;
        int pendingAssessmentCount = 0;

        List<DashboardResponse.RecentEvaluation> recentEvals = new ArrayList<>();
        List<Patient> activePatientList = allPatients.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .toList();
        List<UUID> activePatientIds = activePatientList.stream().map(Patient::getId).toList();
        List<Episode> activeEpisodes = activePatientIds.isEmpty()
                ? List.of()
                : episodeRepository.findActiveByPatientIdsAndNutritionistId(activePatientIds, nutritionistId);
        Map<UUID, Episode> activeEpisodeByPatientId = activeEpisodes.stream()
                .collect(Collectors.toMap(Episode::getPatientId, e -> e, (first, ignored) -> first));
        List<UUID> activeEpisodeIds = activeEpisodes.stream().map(Episode::getId).toList();
        List<BiometryAssessment> activeAssessments = activeEpisodeIds.isEmpty()
                ? List.of()
                : assessmentRepository.findByEpisodeIdInAndNutritionistIdOrderByAssessmentDateAsc(
                        activeEpisodeIds, nutritionistId);
        Map<UUID, List<BiometryAssessment>> assessmentsByEpisodeId = activeAssessments.stream()
                .collect(Collectors.groupingBy(BiometryAssessment::getEpisodeId));

        for (Patient patient : activePatientList) {
            Episode activeEpisode = activeEpisodeByPatientId.get(patient.getId());
            if (activeEpisode == null) {
                pendingAssessmentCount++;
                continue;
            }

            List<BiometryAssessment> assessments = assessmentsByEpisodeId.getOrDefault(
                    activeEpisode.getId(), List.of());

            if (!assessments.isEmpty()) {
                BiometryAssessment latest = assessments.get(assessments.size() - 1);
                boolean hasRecent = !latest.getAssessmentDate().isBefore(thirtyDaysAgo);
                if (hasRecent) {
                    assessedInLast30Days++;
                } else {
                    pendingAssessmentCount++;
                }
                recentEvals.add(new DashboardResponse.RecentEvaluation(
                        patient.getId(),
                        patient.getName(),
                        patient.getInitials(),
                        patient.getStatus().name(),
                        latest.getAssessmentDate(),
                        latest.getWeight(),
                        latest.getBodyFatPercent()
                ));
            } else {
                pendingAssessmentCount++;
            }
        }

        recentEvals.sort(Comparator.comparing(DashboardResponse.RecentEvaluation::assessmentDate).reversed());
        if (recentEvals.size() > 5) {
            recentEvals = recentEvals.subList(0, 5);
        }

        DashboardResponse.Kpis kpis = new DashboardResponse.Kpis(
                activePatients, onTrackPatients, attentionPatients, criticalPatients, averageAdherence,
                assessedInLast30Days, pendingAssessmentCount);

        return new DashboardResponse(kpis, recentEvals);
    }
}
