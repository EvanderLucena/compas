package com.compas.api.service;

import com.compas.api.dto.biometry.BiometryAssessmentResponse;
import com.compas.api.dto.biometry.BiometryEvolutionSummaryResponse;
import com.compas.api.dto.biometry.BiometryHistoryEpisodeResponse;
import com.compas.api.dto.biometry.BiometryHistorySnapshotResponse;
import com.compas.api.dto.biometry.CreateBiometryAssessmentRequest;
import com.compas.api.dto.biometry.EpisodeHistoryEventResponse;
import com.compas.api.dto.biometry.PerimetryDeltaResponse;
import com.compas.api.dto.biometry.UpdateBiometryAssessmentRequest;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.BiometryAssessment;
import com.compas.api.model.BiometryPerimetry;
import com.compas.api.model.BiometrySkinfold;
import com.compas.api.model.Episode;
import com.compas.api.model.EpisodeHistoryEvent;
import com.compas.api.model.MealOption;
import com.compas.api.model.MealPlan;
import com.compas.api.model.MealSlot;
import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.repository.BiometryAssessmentRepository;
import com.compas.api.repository.BiometryPerimetryRepository;
import com.compas.api.repository.BiometrySkinfoldRepository;
import com.compas.api.repository.EpisodeHistoryEventRepository;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.MealOptionRepository;
import com.compas.api.repository.MealPlanRepository;
import com.compas.api.repository.MealSlotRepository;
import com.compas.api.repository.PatientRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BiometryService {

    private static final Logger logger = LoggerFactory.getLogger(BiometryService.class);
    private static final Pattern OBJECTIVE_METADATA_PATTERN =
            Pattern.compile("\"objective\"\\s*:\\s*\"([A-Z_]+)\"");
    private static final Map<String, String> PERIMETRY_LABELS = Map.ofEntries(
            Map.entry("cintura", "Cintura"),
            Map.entry("abdomen", "Abdômen"),
            Map.entry("quadril", "Quadril"),
            Map.entry("braco_d", "Braço Direito"),
            Map.entry("braco_e", "Braço Esquerdo"),
            Map.entry("coxa_d", "Coxa Direita"),
            Map.entry("coxa_e", "Coxa Esquerda"),
            Map.entry("panturrilha_d", "Panturrilha Direita"),
            Map.entry("panturrilha_e", "Panturrilha Esquerda"),
            Map.entry("torax", "Tórax")
    );

    private final BiometryAssessmentRepository assessmentRepository;
    private final BiometrySkinfoldRepository skinfoldRepository;
    private final BiometryPerimetryRepository perimetryRepository;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;

    public BiometryService(BiometryAssessmentRepository assessmentRepository,
                           BiometrySkinfoldRepository skinfoldRepository,
                           BiometryPerimetryRepository perimetryRepository,
                           EpisodeHistoryEventRepository historyEventRepository,
                           PatientRepository patientRepository,
                           EpisodeRepository episodeRepository,
                           MealPlanRepository mealPlanRepository,
                           MealSlotRepository mealSlotRepository,
                           MealOptionRepository mealOptionRepository) {
        this.assessmentRepository = assessmentRepository;
        this.skinfoldRepository = skinfoldRepository;
        this.perimetryRepository = perimetryRepository;
        this.historyEventRepository = historyEventRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
    }

    @Transactional
    public BiometryAssessmentResponse createAssessment(UUID nutritionistId, UUID patientId, CreateBiometryAssessmentRequest request) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        BiometryAssessment assessment = BiometryAssessment.builder()
                .patientId(patientId)
                .episodeId(activeEpisode.getId())
                .nutritionistId(nutritionistId)
                .assessmentDate(request.assessmentDate())
                .weight(request.weight())
                .bodyFatPercent(request.bodyFatPercent())
                .leanMassKg(request.leanMassKg())
                .waterPercent(request.waterPercent())
                .visceralFatLevel(request.visceralFatLevel())
                .bmrKcal(request.bmrKcal())
                .notes(request.notes())
                .build();

        if (request.skinfolds() != null && !request.skinfolds().isEmpty()) {
            List<BiometrySkinfold> skinfolds = request.skinfolds().stream()
                    .map(s -> BiometrySkinfold.builder()
                            .assessment(assessment)
                            .nutritionistId(nutritionistId)
                            .measureKey(s.measureKey())
                            .valueMm(s.valueMm())
                            .sortOrder(s.sortOrder())
                            .build())
                    .toList();
            assessment.setSkinfolds(skinfolds);
        }

        if (request.perimetry() != null && !request.perimetry().isEmpty()) {
            List<BiometryPerimetry> perimetries = request.perimetry().stream()
                    .map(p -> BiometryPerimetry.builder()
                            .assessment(assessment)
                            .nutritionistId(nutritionistId)
                            .measureKey(p.measureKey())
                            .valueCm(p.valueCm())
                            .sortOrder(p.sortOrder())
                            .build())
                    .toList();
            assessment.setPerimetries(perimetries);
        }

        BiometryAssessment saved = assessmentRepository.save(assessment);
        logger.info("Biometry assessment created: id={}, episodeId={}, nutritionistId={}", saved.getId(), activeEpisode.getId(), nutritionistId);

        emitHistoryEvent(activeEpisode.getId(), nutritionistId, "EPISODE_BIOMETRY_CREATED",
                "Avaliação biométrica criada", "BiometryAssessment", saved.getId());

        return toResponse(saved, nutritionistId);
    }

    @Transactional
    public BiometryAssessmentResponse updateAssessment(UUID nutritionistId, UUID patientId, UUID assessmentId, UpdateBiometryAssessmentRequest request) {
        BiometryAssessment assessment = assessmentRepository.findByIdAndPatientIdAndNutritionistId(
                        assessmentId, patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Avaliação biométrica", assessmentId));

        if (request.assessmentDate() != null) assessment.setAssessmentDate(request.assessmentDate());
        if (request.weight() != null) assessment.setWeight(request.weight());
        if (request.bodyFatPercent() != null) assessment.setBodyFatPercent(request.bodyFatPercent());
        if (request.leanMassKg() != null) assessment.setLeanMassKg(request.leanMassKg());
        if (request.waterPercent() != null) assessment.setWaterPercent(request.waterPercent());
        if (request.visceralFatLevel() != null) assessment.setVisceralFatLevel(request.visceralFatLevel());
        if (request.bmrKcal() != null) assessment.setBmrKcal(request.bmrKcal());
        if (request.notes() != null) assessment.setNotes(request.notes());

        if (request.skinfolds() != null) {
            List<BiometrySkinfold> mergedSkinfolds = mergeSkinfolds(assessment, nutritionistId, request.skinfolds());
            assessment.getSkinfolds().clear();
            assessment.getSkinfolds().addAll(mergedSkinfolds);
        }

        if (request.perimetry() != null) {
            List<BiometryPerimetry> mergedPerimetries = mergePerimetries(assessment, nutritionistId, request.perimetry());
            assessment.getPerimetries().clear();
            assessment.getPerimetries().addAll(mergedPerimetries);
        }

        BiometryAssessment updated = assessmentRepository.save(assessment);
        logger.info("Biometry assessment updated: id={}, nutritionistId={}", updated.getId(), nutritionistId);

        emitHistoryEvent(updated.getEpisodeId(), nutritionistId, "EPISODE_BIOMETRY_UPDATED",
                "Avaliação biométrica atualizada", "BiometryAssessment", updated.getId());

        return toResponse(updated, nutritionistId);
    }

    @Transactional(readOnly = true)
    public List<BiometryAssessmentResponse> listAssessments(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode activeEpisode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Paciente não possui episódio ativo"));

        List<BiometryAssessment> assessments = assessmentRepository.findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                activeEpisode.getId(), patientId, nutritionistId);
        return toResponses(assessments, nutritionistId);
    }

    @Transactional(readOnly = true)
    public List<BiometryHistoryEpisodeResponse> listHistoryEpisodes(UUID nutritionistId, UUID patientId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        List<Episode> closedEpisodes = episodeRepository
                .findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(patientId, nutritionistId);

        List<UUID> episodeIds = closedEpisodes.stream().map(Episode::getId).toList();
        List<BiometryAssessment> allAssessments = episodeIds.isEmpty()
                ? List.of()
                : assessmentRepository.findByEpisodeIdInAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                        episodeIds, patientId, nutritionistId);

        return closedEpisodes.stream().map(episode -> {
            long assessmentCount = allAssessments.stream()
                    .filter(a -> episode.getId().equals(a.getEpisodeId()))
                    .count();
            int durationDays = (int) ChronoUnit.DAYS.between(
                    episode.getStartDate().toLocalDate(),
                    episode.getEndDate().toLocalDate());
            return new BiometryHistoryEpisodeResponse(
                    episode.getId(),
                    episode.getStartDate(),
                    episode.getEndDate(),
                    assessmentCount > 0,
                    (int) assessmentCount,
                    durationDays
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public BiometryHistorySnapshotResponse getHistorySnapshot(UUID nutritionistId, UUID patientId, UUID episodeId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode episode = episodeRepository.findByIdAndPatientIdAndNutritionistId(
                        episodeId, patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio", episodeId));

        if (episode.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episódio ativo não possui histórico");
        }

        List<BiometryAssessment> assessments = assessmentRepository
                .findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId, patientId, nutritionistId);
        List<EpisodeHistoryEvent> timelineEvents = historyEventRepository
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episodeId, nutritionistId);

        MealPlan plan = mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId).orElse(null);
        int mealSlotCount = 0;
        int foodItemCount = 0;
        if (plan != null) {
            List<MealSlot> slots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(plan.getId(), nutritionistId);
            mealSlotCount = slots.size();
            List<MealOption> options = mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(plan.getId(), nutritionistId);
            foodItemCount = options.size();
        }

        List<BiometryAssessmentResponse> assessmentResponses = toResponses(assessments, nutritionistId);
        List<EpisodeHistoryEventResponse> eventResponses = timelineEvents.stream()
                .map(e -> new EpisodeHistoryEventResponse(e.getId(), e.getEventType(), e.getEventAt(),
                        e.getTitle(), e.getDescription(), e.getSourceRef())).toList();

        return new BiometryHistorySnapshotResponse(
                episodeId, episode.getStartDate(), episode.getEndDate(),
                resolveEpisodeObjective(timelineEvents, patient),
                mealSlotCount, foodItemCount, assessmentResponses, eventResponses);
    }

    private String resolveEpisodeObjective(List<EpisodeHistoryEvent> timelineEvents, Patient patient) {
        for (int i = timelineEvents.size() - 1; i >= 0; i--) {
            String label = extractObjectiveLabel(timelineEvents.get(i).getMetadataJson());
            if (label != null) {
                return label;
            }
        }
        return patient.getObjective() != null ? patient.getObjective().getPortugueseLabel() : null;
    }

    private String extractObjectiveLabel(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return null;
        }

        Matcher matcher = OBJECTIVE_METADATA_PATTERN.matcher(metadataJson);
        if (!matcher.find()) {
            return null;
        }

        try {
            return PatientObjective.valueOf(matcher.group(1)).getPortugueseLabel();
        } catch (IllegalArgumentException ex) {
            logger.warn("Ignoring invalid episode objective metadata: {}", metadataJson);
            return null;
        }
    }

    private BiometryAssessmentResponse toResponse(BiometryAssessment assessment, UUID nutritionistId) {
        return toResponses(List.of(assessment), nutritionistId).get(0);
    }

    private List<BiometryAssessmentResponse> toResponses(List<BiometryAssessment> assessments, UUID nutritionistId) {
        if (assessments.isEmpty()) {
            return List.of();
        }

        List<UUID> assessmentIds = assessments.stream()
                .map(BiometryAssessment::getId)
                .toList();
        Map<UUID, List<BiometrySkinfold>> skinfoldsByAssessmentId = Optional.ofNullable(
                skinfoldRepository.findByAssessmentIdInAndNutritionistIdOrderByAssessmentIdAscSortOrderAsc(
                        assessmentIds, nutritionistId))
                .orElse(List.of())
                .stream()
                .collect(Collectors.groupingBy(skinfold -> skinfold.getAssessment().getId()));
        Map<UUID, List<BiometryPerimetry>> perimetriesByAssessmentId = Optional.ofNullable(
                perimetryRepository.findByAssessmentIdInAndNutritionistIdOrderByAssessmentIdAscSortOrderAsc(
                        assessmentIds, nutritionistId))
                .orElse(List.of())
                .stream()
                .collect(Collectors.groupingBy(perimetry -> perimetry.getAssessment().getId()));

        return assessments.stream()
                .map(assessment -> BiometryAssessmentResponse.from(
                        assessment,
                        skinfoldsByAssessmentId.getOrDefault(assessment.getId(), List.of()),
                        perimetriesByAssessmentId.getOrDefault(assessment.getId(), List.of())))
                .toList();
    }

    private List<BiometrySkinfold> mergeSkinfolds(BiometryAssessment assessment, UUID nutritionistId,
                                                  List<UpdateBiometryAssessmentRequest.SkinfoldEntry> entries) {
        Map<UUID, BiometrySkinfold> existingById = new HashMap<>();
        for (BiometrySkinfold skinfold : assessment.getSkinfolds()) {
            if (skinfold.getId() != null) {
                existingById.put(skinfold.getId(), skinfold);
            }
        }

        List<BiometrySkinfold> merged = new ArrayList<>(entries.size());
        for (UpdateBiometryAssessmentRequest.SkinfoldEntry entry : entries) {
            BiometrySkinfold skinfold;
            if (entry.id() != null) {
                skinfold = existingById.get(entry.id());
                if (skinfold == null) {
                    throw new ResourceNotFoundException("Dobra cutânea", entry.id());
                }
            } else {
                skinfold = BiometrySkinfold.builder()
                        .assessment(assessment)
                        .nutritionistId(nutritionistId)
                        .build();
            }
            skinfold.setAssessment(assessment);
            skinfold.setNutritionistId(nutritionistId);
            skinfold.setMeasureKey(entry.measureKey());
            skinfold.setValueMm(entry.valueMm());
            skinfold.setSortOrder(entry.sortOrder());
            merged.add(skinfold);
        }
        return merged;
    }

    private List<BiometryPerimetry> mergePerimetries(BiometryAssessment assessment, UUID nutritionistId,
                                                     List<UpdateBiometryAssessmentRequest.PerimetryEntry> entries) {
        Map<UUID, BiometryPerimetry> existingById = new HashMap<>();
        for (BiometryPerimetry perimetry : assessment.getPerimetries()) {
            if (perimetry.getId() != null) {
                existingById.put(perimetry.getId(), perimetry);
            }
        }

        List<BiometryPerimetry> merged = new ArrayList<>(entries.size());
        for (UpdateBiometryAssessmentRequest.PerimetryEntry entry : entries) {
            BiometryPerimetry perimetry;
            if (entry.id() != null) {
                perimetry = existingById.get(entry.id());
                if (perimetry == null) {
                    throw new ResourceNotFoundException("Perimetria", entry.id());
                }
            } else {
                perimetry = BiometryPerimetry.builder()
                        .assessment(assessment)
                        .nutritionistId(nutritionistId)
                        .build();
            }
            perimetry.setAssessment(assessment);
            perimetry.setNutritionistId(nutritionistId);
            perimetry.setMeasureKey(entry.measureKey());
            perimetry.setValueCm(entry.valueCm());
            perimetry.setSortOrder(entry.sortOrder());
            merged.add(perimetry);
        }
        return merged;
    }

    private void emitHistoryEvent(
            UUID episodeId,
            UUID nutritionistId,
            String eventType,
            String title,
            String sourceRef,
            UUID sourceId
    ) {
        EpisodeHistoryEvent event = EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType(eventType)
                .eventAt(LocalDateTime.now())
                .title(title)
                .sourceRef(sourceRef + ":" + sourceId)
                .build();
        historyEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public BiometryEvolutionSummaryResponse getBiometryEvolutionSummary(UUID nutritionistId, UUID patientId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Optional<Episode> activeEpisode = episodeRepository
                .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId);
        if (activeEpisode.isEmpty()) {
            return emptySummary();
        }

        List<BiometryAssessment> assessments = assessmentRepository
                .findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                        activeEpisode.get().getId(), patientId, nutritionistId);

        if (assessments.isEmpty()) {
            return emptySummary();
        }
        if (assessments.size() == 1) {
            return singleAssessmentSummary(patient, assessments.get(0), nutritionistId);
        }
        return multiAssessmentSummary(patient, assessments, nutritionistId);
    }

    @Transactional(readOnly = true)
    public String getBiometryContextForWhatsApp(UUID patientId, UUID nutritionistId) {
        try {
            BiometryEvolutionSummaryResponse summary = getBiometryEvolutionSummary(nutritionistId, patientId);
            if (summary.assessmentCount() == 0) {
                return "EVOLUÇÃO BIOMÉTRICA DO PACIENTE:\nNenhuma avaliação física cadastrada no momento.\n";
            }
            return buildWhatsAppBiometryContext(summary);
        } catch (Exception e) {
            logger.warn("Could not retrieve biometry context for patient {}: {}", patientId, e.getMessage());
            return "";
        }
    }

    private String buildWhatsAppBiometryContext(BiometryEvolutionSummaryResponse summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("EVOLUÇÃO BIOMÉTRICA E COMPOSIÇÃO CORPORAL DO PACIENTE:\n");
        sb.append(String.format("- Período: de %s até %s (%d avaliações)\n",
                summary.initialAssessmentDate(), summary.latestAssessmentDate(), summary.assessmentCount()));
        if (summary.initialWeight() != null && summary.currentWeight() != null) {
            sb.append(String.format("- Peso: inicial %.1f kg -> atual %.1f kg (variação: %+.1f kg)\n",
                    summary.initialWeight(), summary.currentWeight(),
                    summary.weightDelta() != null ? summary.weightDelta() : BigDecimal.ZERO));
        }
        if (summary.initialBodyFatPercent() != null && summary.currentBodyFatPercent() != null) {
            sb.append(String.format("- Gordura corporal: inicial %.1f%% -> atual %.1f%% (variação: %+.1f%%)\n",
                    summary.initialBodyFatPercent(), summary.currentBodyFatPercent(),
                    summary.bodyFatDelta() != null ? summary.bodyFatDelta() : BigDecimal.ZERO));
        }

        if (summary.initialFatMassKg() != null && summary.currentFatMassKg() != null) {
            sb.append(String.format("- Massa gorda estimada: %.1f kg -> %.1f kg (%+.1f kg de gordura)\n",
                    summary.initialFatMassKg(), summary.currentFatMassKg(),
                    summary.fatMassDelta() != null ? summary.fatMassDelta() : BigDecimal.ZERO));
        }
        if (summary.initialLeanMassKg() != null && summary.currentLeanMassKg() != null) {
            sb.append(String.format("- Massa magra: %.1f kg -> %.1f kg (%+.1f kg de massa magra)\n",
                    summary.initialLeanMassKg(), summary.currentLeanMassKg(),
                    summary.leanMassDelta() != null ? summary.leanMassDelta() : BigDecimal.ZERO));
        }
        if (!summary.perimetryDeltas().isEmpty()) {
            sb.append("- Medidas corporais (circunferências):\n");
            for (PerimetryDeltaResponse p : summary.perimetryDeltas()) {
                if (p.initialCm() != null && p.currentCm() != null) {
                    sb.append(String.format("  • %s: %.1f cm -> %.1f cm (%+.1f cm)\n",
                            p.label(), p.initialCm(), p.currentCm(),
                            p.deltaCm() != null ? p.deltaCm() : BigDecimal.ZERO));
                }
            }
        }
        sb.append("DIRETRIZES DE RESPOSTA BIOMÉTRICA:\n");
        sb.append("Quando o paciente perguntar sobre seu peso, emagrecimento, medidas corporais ou evolução:\n");
        sb.append("- Use com total exatidão os dados biométricos reais acima.\n");
        sb.append("- Seja caloroso, empático e encorajador em no máximo 2 a 3 frases.\n");
        sb.append("- Celebre o progresso real conquistado (diminuição de gordura, redução de cintura, etc.).\n");
        return sb.toString();
    }

    private BiometryEvolutionSummaryResponse emptySummary() {
        return new BiometryEvolutionSummaryResponse(
                0, null, null,
                null, null, null,
                null, null, null,
                null, null, null,
                null, null, null,
                List.of(),
                "Nenhuma avaliação biométrica registrada ainda.",
                "Olá! Ainda não temos avaliações biométricas registradas no seu acompanhamento."
        );
    }

    private BigDecimal computeFatMass(BigDecimal weight, BigDecimal bodyFatPercent) {
        if (weight == null || bodyFatPercent == null) {
            return null;
        }
        return weight.multiply(bodyFatPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeDelta(BigDecimal current, BigDecimal initial) {
        if (current == null || initial == null) {
            return null;
        }
        return current.subtract(initial);
    }

    private BiometryEvolutionSummaryResponse singleAssessmentSummary(
            Patient patient, BiometryAssessment initial, UUID nutritionistId) {
        BigDecimal weight = initial.getWeight() != null ? initial.getWeight() : BigDecimal.ZERO;
        BigDecimal bodyFat = initial.getBodyFatPercent() != null ? initial.getBodyFatPercent() : BigDecimal.ZERO;
        BigDecimal fatMass = computeFatMass(initial.getWeight(), initial.getBodyFatPercent());
        List<PerimetryDeltaResponse> perimetries = buildPerimetryDeltas(
                initial.getId(), initial.getId(), nutritionistId);

        String leanMassText = initial.getLeanMassKg() != null
                ? String.format(", massa magra %.1f kg", initial.getLeanMassKg()) : "";
        String clinicalSynthesis = String.format(
                "Marco zero estabelecido em %s: peso %.1f kg, gordura %.1f%% (%.1f kg de gordura)%s. "
                        + "Os deltas comparativos serão calculados na próxima avaliação.",
                initial.getAssessmentDate(),
                weight,
                bodyFat,
                fatMass != null ? fatMass : BigDecimal.ZERO,
                leanMassText
        );
        String whatsappMsg = String.format(
                "Olá, %s! Sua avaliação física inicial foi registrada com sucesso (%.1f kg e %.1f%% de gordura). "
                        + "Esse é o nosso marco de partida para acompanhar sua evolução! Tamo junto! 💪🚀",
                patient.getName(),
                weight,
                bodyFat
        );

        return new BiometryEvolutionSummaryResponse(
                1, initial.getAssessmentDate(), initial.getAssessmentDate(),
                initial.getWeight(), initial.getWeight(), BigDecimal.ZERO,
                initial.getBodyFatPercent(), initial.getBodyFatPercent(), BigDecimal.ZERO,
                initial.getLeanMassKg(), initial.getLeanMassKg(), BigDecimal.ZERO,
                fatMass, fatMass, BigDecimal.ZERO,
                perimetries, clinicalSynthesis, whatsappMsg
        );
    }

    private BiometryEvolutionSummaryResponse multiAssessmentSummary(
            Patient patient, List<BiometryAssessment> assessments, UUID nutritionistId) {
        BiometryAssessment initial = assessments.get(0);
        BiometryAssessment latest = assessments.get(assessments.size() - 1);

        BigDecimal initialFatMass = computeFatMass(initial.getWeight(), initial.getBodyFatPercent());
        BigDecimal currentFatMass = computeFatMass(latest.getWeight(), latest.getBodyFatPercent());

        BigDecimal weightDelta = computeDelta(latest.getWeight(), initial.getWeight());
        BigDecimal bodyFatDelta = computeDelta(latest.getBodyFatPercent(), initial.getBodyFatPercent());
        BigDecimal leanMassDelta = computeDelta(latest.getLeanMassKg(), initial.getLeanMassKg());
        BigDecimal fatMassDelta = computeDelta(currentFatMass, initialFatMass);

        List<PerimetryDeltaResponse> perimetryDeltas = buildPerimetryDeltas(
                initial.getId(), latest.getId(), nutritionistId);

        String clinicalSynthesis = generateClinicalSynthesis(initial, latest, perimetryDeltas);
        String whatsappMsg = generateWhatsAppFeedbackMessage(patient.getName(), initial, latest, perimetryDeltas);

        return new BiometryEvolutionSummaryResponse(
                assessments.size(),
                initial.getAssessmentDate(),
                latest.getAssessmentDate(),
                initial.getWeight(),
                latest.getWeight(),
                weightDelta,
                initial.getBodyFatPercent(),
                latest.getBodyFatPercent(),
                bodyFatDelta,
                initial.getLeanMassKg(),
                latest.getLeanMassKg(),
                leanMassDelta,
                initialFatMass,
                currentFatMass,
                fatMassDelta,
                perimetryDeltas,
                clinicalSynthesis,
                whatsappMsg
        );
    }

    private List<PerimetryDeltaResponse> buildPerimetryDeltas(
            UUID initialAssessmentId, UUID latestAssessmentId, UUID nutritionistId) {
        List<BiometryPerimetry> initialList = perimetryRepository
                .findByAssessmentIdAndNutritionistIdOrderBySortOrder(initialAssessmentId, nutritionistId);
        List<BiometryPerimetry> latestList = perimetryRepository
                .findByAssessmentIdAndNutritionistIdOrderBySortOrder(latestAssessmentId, nutritionistId);

        Map<String, BigDecimal> initialMap = new HashMap<>();
        for (BiometryPerimetry p : initialList) {
            initialMap.put(p.getMeasureKey(), p.getValueCm());
        }

        List<PerimetryDeltaResponse> deltas = new ArrayList<>();
        for (BiometryPerimetry curr : latestList) {
            BigDecimal initVal = initialMap.getOrDefault(curr.getMeasureKey(), curr.getValueCm());
            BigDecimal delta = curr.getValueCm().subtract(initVal);
            deltas.add(new PerimetryDeltaResponse(
                    curr.getMeasureKey(),
                    resolvePerimetryLabel(curr.getMeasureKey()),
                    initVal,
                    curr.getValueCm(),
                    delta
            ));
        }
        return deltas;
    }

    private String resolvePerimetryLabel(String measureKey) {
        if (measureKey == null) {
            return "";
        }
        return PERIMETRY_LABELS.getOrDefault(measureKey.toLowerCase(), measureKey);
    }

    private String generateClinicalSynthesis(
            BiometryAssessment initial,
            BiometryAssessment latest,
            List<PerimetryDeltaResponse> perimetries
    ) {
        StringBuilder sb = new StringBuilder();
        appendBodyCompositionSynthesis(sb, initial, latest);
        appendPerimetrySynthesis(sb, perimetries);
        return sb.toString();
    }

    private void appendBodyCompositionSynthesis(
            StringBuilder sb, BiometryAssessment initial, BiometryAssessment latest) {
        BigDecimal weightDelta = computeDelta(latest.getWeight(), initial.getWeight());
        BigDecimal initialFat = computeFatMass(initial.getWeight(), initial.getBodyFatPercent());
        BigDecimal currentFat = computeFatMass(latest.getWeight(), latest.getBodyFatPercent());
        BigDecimal fatMassDelta = computeDelta(currentFat, initialFat);
        BigDecimal leanMassDelta = computeDelta(latest.getLeanMassKg(), initial.getLeanMassKg());

        if (fatMassDelta != null && fatMassDelta.compareTo(BigDecimal.ZERO) < 0) {
            sb.append(String.format(
                    "Evolução altamente favorável da composição corporal: redução de %.1f kg de massa gorda",
                    fatMassDelta.abs()));
            if (leanMassDelta != null && leanMassDelta.compareTo(BigDecimal.ZERO) >= 0) {
                sb.append(String.format(" com ganho de %.1f kg de massa magra (recomposição corporal positiva).",
                        leanMassDelta));
            } else if (leanMassDelta != null) {
                sb.append(String.format(" com preservação consistente da massa muscular (variação de %.1f kg).",
                        leanMassDelta));
            } else {
                sb.append(".");
            }
        } else if (leanMassDelta != null && leanMassDelta.compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("Excelente ganho de massa magra: +%.1f kg conquistados no período.",
                    leanMassDelta));
        } else if (weightDelta != null && weightDelta.compareTo(BigDecimal.ZERO) < 0) {
            sb.append(String.format("Redução ponderal de %.1f kg com adesão ao plano nutricional.",
                    weightDelta.abs()));
        } else {
            sb.append("Manutenção da estabilidade de peso e composição corporal no período avaliado.");
        }
    }

    private void appendPerimetrySynthesis(StringBuilder sb, List<PerimetryDeltaResponse> perimetries) {
        for (PerimetryDeltaResponse p : perimetries) {
            if ("cintura".equalsIgnoreCase(p.measureKey()) && p.deltaCm() != null
                    && p.deltaCm().compareTo(BigDecimal.ZERO) < 0) {
                sb.append(String.format(" Notável redução de %.1f cm na circunferência da cintura.",
                        p.deltaCm().abs()));
                break;
            }
        }
    }

    private String generateWhatsAppFeedbackMessage(
            String patientName,
            BiometryAssessment initial,
            BiometryAssessment latest,
            List<PerimetryDeltaResponse> perimetries
    ) {
        BigDecimal weightDelta = computeDelta(latest.getWeight(), initial.getWeight());
        BigDecimal initialFat = computeFatMass(initial.getWeight(), initial.getBodyFatPercent());
        BigDecimal currentFat = computeFatMass(latest.getWeight(), latest.getBodyFatPercent());
        BigDecimal fatMassDelta = computeDelta(currentFat, initialFat);
        BigDecimal leanMassDelta = computeDelta(latest.getLeanMassKg(), initial.getLeanMassKg());

        StringBuilder sb = new StringBuilder();
        sb.append("Olá, ").append(patientName).append("! ");
        sb.append("Passando para celebrar seus resultados na reavaliação! 🎉\n");

        if (fatMassDelta != null && fatMassDelta.compareTo(BigDecimal.ZERO) < 0) {
            sb.append(String.format("Você já eliminou %.1f kg de gordura corporal", fatMassDelta.abs()));
            if (leanMassDelta != null && leanMassDelta.compareTo(BigDecimal.ZERO) >= 0) {
                sb.append(String.format(" e ganhou %.1f kg de massa magra", leanMassDelta));
            }
            sb.append("! ");
        } else if (weightDelta != null && weightDelta.compareTo(BigDecimal.ZERO) < 0) {
            sb.append(String.format("Você já perdeu %.1f kg no total! ", weightDelta.abs()));
        }

        appendWhatsAppPerimetryHighlight(sb, perimetries);
        sb.append("Parabéns pelo comprometimento e dedicação ao processo. Seguimos juntos rumo ao seu objetivo! 💪✨");
        return sb.toString();
    }

    private void appendWhatsAppPerimetryHighlight(StringBuilder sb, List<PerimetryDeltaResponse> perimetries) {
        for (PerimetryDeltaResponse p : perimetries) {
            if ("cintura".equalsIgnoreCase(p.measureKey()) && p.deltaCm() != null
                    && p.deltaCm().compareTo(BigDecimal.ZERO) < 0) {
                sb.append(String.format("Além disso, sua cintura reduziu %.1f cm! 👏 ", p.deltaCm().abs()));
                break;
            }
        }
    }
}
