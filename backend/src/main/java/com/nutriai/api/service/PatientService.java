package com.nutriai.api.service;

import com.nutriai.api.dto.intelligence.FrequentOffPlanFoodDTO;
import com.nutriai.api.dto.intelligence.PatientConsumptionPatternsDTO;
import com.nutriai.api.dto.jev.JevAdherenceDecision;
import com.nutriai.api.dto.patient.CreatePatientRequest;
import com.nutriai.api.dto.patient.PatientListResponse;
import com.nutriai.api.dto.patient.PatientResponse;
import com.nutriai.api.dto.patient.UpdatePatientRequest;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Episode;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.ExtractionItem;
import com.nutriai.api.model.MealExtraction;
import com.nutriai.api.model.MealFood;
import com.nutriai.api.model.MealOption;
import com.nutriai.api.model.MealPlan;
import com.nutriai.api.model.MealSlot;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.PatientObjective;
import com.nutriai.api.model.PatientStatus;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.EpisodeRepository;
import com.nutriai.api.repository.ExtractionItemRepository;
import com.nutriai.api.repository.MealExtractionRepository;
import com.nutriai.api.repository.MealFoodRepository;
import com.nutriai.api.repository.MealOptionRepository;
import com.nutriai.api.repository.MealPlanRepository;
import com.nutriai.api.repository.MealSlotRepository;
import com.nutriai.api.repository.NutritionistRepository;
import com.nutriai.api.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private static final Logger logger = LoggerFactory.getLogger(PatientService.class);
    private static final String OBJECTIVE_METADATA_TEMPLATE = "{\"objective\":\"%s\"}";

    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final NutritionistRepository nutritionistRepository;
    private final MealPlanService mealPlanService;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final PhoneNormalizationService phoneNormalizationService;
    private final MealExtractionRepository mealExtractionRepository;
    private final MealPlanRepository mealPlanRepository;
    private final JevService jevService;
    private final ExtractionItemRepository extractionItemRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;

    public PatientService(PatientRepository patientRepository,
                           EpisodeRepository episodeRepository,
                           NutritionistRepository nutritionistRepository,
                           MealPlanService mealPlanService,
                           EpisodeHistoryEventRepository historyEventRepository,
                           PhoneNormalizationService phoneNormalizationService,
                           MealExtractionRepository mealExtractionRepository,
                           MealPlanRepository mealPlanRepository,
                           JevService jevService,
                           ExtractionItemRepository extractionItemRepository,
                           MealSlotRepository mealSlotRepository,
                           MealOptionRepository mealOptionRepository,
                           MealFoodRepository mealFoodRepository) {
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.nutritionistRepository = nutritionistRepository;
        this.mealPlanService = mealPlanService;
        this.historyEventRepository = historyEventRepository;
        this.phoneNormalizationService = phoneNormalizationService;
        this.mealExtractionRepository = mealExtractionRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.jevService = jevService;
        this.extractionItemRepository = extractionItemRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.mealFoodRepository = mealFoodRepository;
    }

    @Transactional
    public PatientResponse createPatient(UUID nutritionistId, CreatePatientRequest req) {
        nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Nutricionista", nutritionistId));

        PatientObjective objective = parseObjective(req.objective());

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name(req.name())
                .initials(computeInitials(req.name()))
                .birthDate(req.birthDate())
                .age(computeAge(req.birthDate()))
                .sex(req.sex())
                .heightCm(req.heightCm())
                .whatsapp(normalizePhone(req.whatsapp()))
                .objective(objective)
                .weight(req.weight())
                .build();

        Patient saved = patientRepository.save(patient);
        logger.info("Patient created: id={}, nutritionistId={}", saved.getId(), nutritionistId);

        LocalDateTime now = LocalDateTime.now();
        Episode episode = Episode.builder()
                .patientId(saved.getId())
                .nutritionistId(nutritionistId)
                .startDate(now)
                .build();
        Episode savedEpisode = episodeRepository.save(episode);

        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .episodeId(savedEpisode.getId())
                .nutritionistId(nutritionistId)
                .eventType("EPISODE_OPENED")
                .eventAt(now)
                .title("Período iniciado")
                .description("Cadastro do paciente ativado")
                .sourceRef("Episode:" + savedEpisode.getId())
                .metadataJson(buildEpisodeMetadata(saved.getObjective()))
                .build());

        // D-13/D-14: Auto-create default 6-meal plan
        mealPlanService.createDefaultPlan(savedEpisode.getId(), nutritionistId);

        return PatientResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PatientListResponse listPatients(UUID nutritionistId, String search, String status,
                                              String objective, Boolean active, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);

        PatientStatus statusEnum = status != null ? parseStatus(status) : null;
        PatientObjective objectiveEnum = objective != null ? parseObjective(objective) : null;

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String escapedSearch = cleanSearch != null ? escapeLike(cleanSearch) : null;
        boolean hasFilter = escapedSearch != null || statusEnum != null || objectiveEnum != null || active != null;

        if (hasFilter) {
            Page<Patient> result = patientRepository.findByNutritionistIdWithFilters(
                    nutritionistId, escapedSearch, statusEnum, objectiveEnum, active, pageRequest);
            return PatientListResponse.from(result);
        }

        Page<Patient> result = patientRepository.findByNutritionistId(nutritionistId, pageRequest);
        return PatientListResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
        return PatientResponse.from(patient);
    }

    @Transactional
    public PatientResponse updatePatient(UUID id, UUID nutritionistId, UpdatePatientRequest req) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        if (req.name() != null) {
            patient.setName(req.name());
            patient.setInitials(patient.getName() != null ? computeInitials(req.name()) : null);
        }
        if (req.birthDate() != null) {
            patient.setBirthDate(req.birthDate());
            patient.setAge(computeAge(req.birthDate()));
        }
        if (req.sex() != null) patient.setSex(req.sex());
        if (req.heightCm() != null) patient.setHeightCm(req.heightCm());
        if (req.whatsapp() != null) patient.setWhatsapp(normalizePhone(req.whatsapp()));
        if (req.objective() != null) patient.setObjective(parseObjective(req.objective()));
        if (req.status() != null) patient.setStatus(parseStatus(req.status()));
        if (req.weight() != null) patient.setWeight(req.weight());
        if (req.weightDelta() != null) patient.setWeightDelta(req.weightDelta());
        if (req.adherence() != null) patient.setAdherence(req.adherence());
        if (req.tag() != null) patient.setTag(req.tag());

        Patient updated = patientRepository.save(patient);
        logger.info("Patient updated: id={}, nutritionistId={}", updated.getId(), nutritionistId);
        return PatientResponse.from(updated);
    }

    @Transactional
    public PatientResponse deactivatePatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        patient.softDelete();
        episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patient.getId(), nutritionistId)
                .ifPresent(e -> {
                    e.close();
                    episodeRepository.save(e);
                    logger.info("Episode closed: id={}, patientId={}", e.getId(), id);
                    historyEventRepository.save(EpisodeHistoryEvent.builder()
                            .episodeId(e.getId())
                            .nutritionistId(nutritionistId)
                            .eventType("EPISODE_CLOSED")
                            .eventAt(LocalDateTime.now())
                            .title("Período encerrado")
                            .description("Cadastro do paciente desativado")
                            .sourceRef("Episode:" + e.getId())
                            .metadataJson(buildEpisodeMetadata(patient.getObjective()))
                            .build());
                });

        Patient updated = patientRepository.save(patient);
        logger.info("Patient deactivated: id={}, nutritionistId={}", id, nutritionistId);
        return PatientResponse.from(updated);
    }

    @Transactional
    public PatientResponse reactivatePatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        patient.reactivate();

        LocalDateTime now = LocalDateTime.now();
        Episode episode = Episode.builder()
                .patientId(patient.getId())
                .nutritionistId(nutritionistId)
                .startDate(now)
                .build();
        Episode savedEpisode = episodeRepository.save(episode);

        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .episodeId(savedEpisode.getId())
                .nutritionistId(nutritionistId)
                .eventType("EPISODE_OPENED")
                .eventAt(now)
                .title("Período iniciado")
                .description("Cadastro do paciente reativado")
                .sourceRef("Episode:" + savedEpisode.getId())
                .metadataJson(buildEpisodeMetadata(patient.getObjective()))
                .build());

        mealPlanService.createDefaultPlan(savedEpisode.getId(), nutritionistId);

        Patient updated = patientRepository.save(patient);
        logger.info("Patient reactivated: id={}, nutritionistId={}", id, nutritionistId);
        return PatientResponse.from(updated);
    }

    /**
     * Computes age from birthDate. Returns null if birthDate is null.
     */
    private Integer computeAge(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private String buildEpisodeMetadata(PatientObjective objective) {
        if (objective == null) {
            return null;
        }
        return OBJECTIVE_METADATA_TEMPLATE.formatted(objective.name());
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(words.length, 2); i++) {
            if (!words[i].isEmpty()) {
                sb.append(Character.toUpperCase(words[i].charAt(0)));
            }
        }
        return sb.toString();
    }

    /**
     * Escape SQL LIKE special characters (% and _) for safe wildcard search.
     */
    private String escapeLike(String search) {
        if (search == null) {
            return null;
        }
        return search.replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    /**
     * Validates and parses a PatientObjective enum value, throwing 400 for invalid values.
     */
    private PatientObjective parseObjective(String value) {
        try {
            return PatientObjective.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Objetivo inválido. Valores permitidos: " + Arrays.toString(PatientObjective.values()));
        }
    }

    /**
     * Validates and parses a PatientStatus enum value, throwing 400 for invalid values.
     */
    private PatientStatus parseStatus(String value) {
        try {
            return PatientStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido. Valores permitidos: " + Arrays.toString(PatientStatus.values()));
        }
    }

    private String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return phoneNormalizationService.normalize(raw)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Número de WhatsApp inválido"));
    }

    public JevAdherenceDecision evaluatePatientAdherence(UUID patientId, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(7);
        List<MealExtraction> extractions = mealExtractionRepository
                .findByPatientIdAndNutritionistIdAndExtractedAtBetween(patientId, nutritionistId, start, end);

        int loggedMeals = extractions.size();
        int expectedMeals = 28; // standard 4 meals/day * 7 days
        double totalKcal = 0.0;
        for (MealExtraction me : extractions) {
            if (me.getTotalKcal() != null) {
                totalKcal += me.getTotalKcal().doubleValue();
            }
        }
        double avgDailyKcal = loggedMeals > 0 ? (totalKcal / 7.0) : 0.0;
        double targetDailyKcal = resolveTargetDailyKcal(patientId, nutritionistId);

        String recentSummary = String.format(
                "Últimos 7 dias: %d refeições registradas (esperado: %d). Média: %.0f kcal (meta: %.0f kcal).",
                loggedMeals, expectedMeals, avgDailyKcal, targetDailyKcal
        );

        JevAdherenceDecision decision;
        if (jevService != null && jevService.isAvailable()) {
            decision = jevService.evaluatePatientAdherence(
                    patient.getName(),
                    patient.getObjective() != null ? patient.getObjective().getPortugueseLabel() : "Saúde geral",
                    recentSummary
            );
        } else {
            decision = JevAdherenceDecision.fallback();
        }

        if (decision != null && decision.success()) {
            persistAdherenceInsight(patientId, nutritionistId, decision.clinicalInsight());
        }

        return decision;
    }

    private double resolveTargetDailyKcal(UUID patientId, UUID nutritionistId) {
        try {
            var activeEpisode = episodeRepository
                    .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                            patientId, nutritionistId);
            if (activeEpisode.isPresent()) {
                var planOpt = mealPlanRepository.findByEpisodeIdAndNutritionistId(
                        activeEpisode.get().getId(), nutritionistId);
                if (planOpt.isPresent() && planOpt.get().getKcalTarget() != null) {
                    return planOpt.get().getKcalTarget().doubleValue();
                }
            }
        } catch (Exception ex) {
            logger.warn("Could not retrieve plan target kcal for patient {}: {}", patientId, ex.getMessage());
        }
        return 2000.0;
    }

    @Transactional
    public void persistAdherenceInsight(UUID patientId, UUID nutritionistId, String insight) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId).ifPresent(p -> {
            p.setAiAdherenceInsight(insight);
            p.setAiAdherenceUpdatedAt(LocalDateTime.now());
            patientRepository.save(p);
        });
    }

    @Transactional(readOnly = true)
    public com.nutriai.api.dto.jev.JevSubstitutionDecision evaluateSubstitution(
            UUID nutritionistId, UUID patientId, String prescribedFood, String desiredFood) {
        return mealPlanService.evaluateSubstitution(nutritionistId, patientId, prescribedFood, desiredFood);
    }

    @Transactional(readOnly = true)
    public PatientConsumptionPatternsDTO getConsumptionPatterns(UUID patientId, UUID nutritionistId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(14);
        List<MealExtraction> extractions = mealExtractionRepository
                .findByPatientIdAndNutritionistIdAndExtractedAtBetween(patientId, nutritionistId, start, end);

        if (extractions.isEmpty()) {
            return buildEmptyPatternsDTO();
        }

        int totalLoggedMeals = extractions.size();
        double dailyAverageMeals = Math.round((totalLoggedMeals / 14.0) * 10.0) / 10.0;
        ExtractionMetrics metrics = calculateExtractionMetrics(extractions);

        Set<String> prescribedFoods = new HashSet<>();
        Map<String, UUID> slotLabelToSlotId = new HashMap<>();
        loadPrescribedPlanData(patientId, nutritionistId, prescribedFoods, slotLabelToSlotId);

        List<UUID> extractionIds = extractions.stream().map(MealExtraction::getId).toList();
        List<ExtractionItem> items = extractionItemRepository.findByExtractionIdIn(extractionIds);
        Map<UUID, MealExtraction> extractionMap = extractions.stream()
                .collect(Collectors.toMap(MealExtraction::getId, e -> e, (a, b) -> a));

        Map<String, FoodAggregator> offPlanAggregators = aggregateOffPlanFoods(
                items, extractionMap, prescribedFoods);

        List<FrequentOffPlanFoodDTO> frequentOffPlanFoods = buildFrequentOffPlanDTOs(
                offPlanAggregators, slotLabelToSlotId);

        List<String> observedPatterns = buildObservedPatternsList(
                metrics, dailyAverageMeals, frequentOffPlanFoods);

        return new PatientConsumptionPatternsDTO(
                14,
                totalLoggedMeals,
                dailyAverageMeals,
                metrics.avgKcal(),
                metrics.avgProt(),
                metrics.peakHoursRange(),
                frequentOffPlanFoods,
                observedPatterns
        );
    }

    private PatientConsumptionPatternsDTO buildEmptyPatternsDTO() {
        return new PatientConsumptionPatternsDTO(
                14,
                0,
                0.0,
                0.0,
                0.0,
                "Sem registros no período",
                List.of(),
                List.of(
                        "Nenhuma refeição registrada via WhatsApp nos últimos 14 dias.",
                        "Incentive o paciente a enviar relatos das refeições no WhatsApp para gerar insights.",
                        "Conforme os relatos chegarem, padrões de consumo e substituições aparecerão aqui."
                )
        );
    }

    private record ExtractionMetrics(
            double avgKcal,
            double avgProt,
            String peakHoursRange,
            String topMeal,
            int topMealCount
    ) {}

    private ExtractionMetrics calculateExtractionMetrics(List<MealExtraction> extractions) {
        double totalKcal = 0.0;
        double totalProt = 0.0;
        Map<Integer, Integer> hourCounts = new HashMap<>();
        Map<String, Integer> mealLabelCounts = new HashMap<>();

        for (MealExtraction me : extractions) {
            if (me.getTotalKcal() != null) {
                totalKcal += me.getTotalKcal().doubleValue();
            }
            if (me.getTotalProt() != null) {
                totalProt += me.getTotalProt().doubleValue();
            }
            if (me.getExtractedAt() != null) {
                int hour = me.getExtractedAt().getHour();
                hourCounts.put(hour, hourCounts.getOrDefault(hour, 0) + 1);
            }
            if (me.getMealLabel() != null && !me.getMealLabel().isBlank()) {
                mealLabelCounts.put(me.getMealLabel(), mealLabelCounts.getOrDefault(me.getMealLabel(), 0) + 1);
            }
        }

        int total = extractions.size();
        double avgKcal = Math.round(totalKcal / total);
        double avgProt = Math.round((totalProt / total) * 10.0) / 10.0;
        String peakHours = computePeakHours(hourCounts);

        String topMeal = null;
        int topCount = 0;
        for (Map.Entry<String, Integer> entry : mealLabelCounts.entrySet()) {
            if (entry.getValue() > topCount) {
                topCount = entry.getValue();
                topMeal = entry.getKey();
            }
        }

        return new ExtractionMetrics(avgKcal, avgProt, peakHours, topMeal, topCount);
    }

    private void loadPrescribedPlanData(
            UUID patientId,
            UUID nutritionistId,
            Set<String> prescribedFoods,
            Map<String, UUID> slotLabelToSlotId) {
        try {
            var activeEpisode = episodeRepository
                    .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(
                            patientId, nutritionistId);
            if (activeEpisode.isEmpty()) {
                return;
            }
            var planOpt = mealPlanRepository.findByEpisodeIdAndNutritionistId(
                    activeEpisode.get().getId(), nutritionistId);
            if (planOpt.isEmpty()) {
                return;
            }
            List<MealSlot> slots = mealSlotRepository.findByPlanIdOrderBySortOrder(planOpt.get().getId());
            for (MealSlot slot : slots) {
                slotLabelToSlotId.put(normalizeFoodName(slot.getLabel()), slot.getId());
                List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
                List<UUID> optionIds = options.stream().map(MealOption::getId).toList();
                if (!optionIds.isEmpty()) {
                    List<MealFood> foods = mealFoodRepository.findAllByOptionIds(optionIds);
                    for (MealFood mf : foods) {
                        if (mf.getFoodName() != null) {
                            prescribedFoods.add(normalizeFoodName(mf.getFoodName()));
                        }
                    }
                }
            }
        } catch (Exception ex) {
            logger.warn("Could not load meal plan for patterns of patient {}: {}", patientId, ex.getMessage());
        }
    }

    private Map<String, FoodAggregator> aggregateOffPlanFoods(
            List<ExtractionItem> items,
            Map<UUID, MealExtraction> extractionMap,
            Set<String> prescribedFoods) {
        Map<String, FoodAggregator> aggregators = new LinkedHashMap<>();
        for (ExtractionItem item : items) {
            if (item.getName() == null || item.getName().isBlank()) {
                continue;
            }
            String normName = normalizeFoodName(item.getName());
            if (!isFoodPrescribed(normName, prescribedFoods)) {
                MealExtraction me = extractionMap.get(item.getExtractionId());
                String mealLabel = (me != null && me.getMealLabel() != null) ? me.getMealLabel() : "Refeição";
                FoodAggregator agg = aggregators.computeIfAbsent(
                        normName, k -> new FoodAggregator(item.getName()));
                agg.add(item, mealLabel);
            }
        }
        return aggregators;
    }

    private List<FrequentOffPlanFoodDTO> buildFrequentOffPlanDTOs(
            Map<String, FoodAggregator> aggregators,
            Map<String, UUID> slotLabelToSlotId) {
        List<FrequentOffPlanFoodDTO> list = new ArrayList<>();
        for (FoodAggregator agg : aggregators.values()) {
            if (agg.count >= 2) {
                String mostCommonLabel = agg.getMostCommonMealLabel();
                UUID slotId = findMatchingSlotId(mostCommonLabel, slotLabelToSlotId);
                String category = determineCategory(agg.avgProt, agg.avgCarb, agg.avgFat, agg.displayName);
                String rationale = buildClinicalRationale(agg.displayName, agg.count, mostCommonLabel, category);

                list.add(new FrequentOffPlanFoodDTO(
                        capitalize(agg.displayName),
                        agg.count,
                        mostCommonLabel,
                        slotId,
                        BigDecimal.valueOf(Math.round(agg.getAvgGrams())),
                        BigDecimal.valueOf(Math.round(agg.getAvgKcal())),
                        BigDecimal.valueOf(Math.round(agg.avgProt * 10.0) / 10.0),
                        BigDecimal.valueOf(Math.round(agg.avgCarb * 10.0) / 10.0),
                        BigDecimal.valueOf(Math.round(agg.avgFat * 10.0) / 10.0),
                        category,
                        rationale,
                        true,
                        "OPÇÃO FREQUENTE"
                ));
            }
        }
        list.sort((a, b) -> Integer.compare(b.consumptionCount(), a.consumptionCount()));
        return list;
    }

    private List<String> buildObservedPatternsList(
            ExtractionMetrics metrics,
            double dailyAverageMeals,
            List<FrequentOffPlanFoodDTO> frequentOffPlanFoods) {
        List<String> patterns = new ArrayList<>();
        patterns.add("Horários de maior frequência de registro: " + metrics.peakHoursRange() + ".");
        patterns.add(String.format(
                "Média de consumo por refeição: %.0f kcal e %.1fg de proteína.",
                metrics.avgKcal(), metrics.avgProt()));
        patterns.add(String.format(
                "Média diária de %.1f refeições registradas no período avaliado.",
                dailyAverageMeals));

        if (!frequentOffPlanFoods.isEmpty()) {
            String names = frequentOffPlanFoods.stream().limit(2)
                    .map(FrequentOffPlanFoodDTO::foodName)
                    .collect(Collectors.joining(" e "));
            patterns.add(String.format(
                    "Identificados %d alimentos recorrentes consumidos fora da prescrição base (destaque para %s).",
                    frequentOffPlanFoods.size(), names));
        } else {
            patterns.add("Excelente consistência: sem alimentos fora do plano consumidos repetidamente.");
        }

        if (metrics.topMeal() != null && metrics.topMealCount() > 0) {
            patterns.add(String.format(
                    "Refeição com maior consistência de envio: %s (%d registros).",
                    metrics.topMeal(), metrics.topMealCount()));
        }

        return patterns;
    }

    private String normalizeFoodName(String name) {
        if (name == null) {
            return "";
        }
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase().replaceAll("[^a-z0-9\\s]", " ").trim();
    }

    private boolean isFoodPrescribed(String normName, Set<String> prescribedFoods) {
        if (normName.isBlank()) {
            return true;
        }
        if (prescribedFoods.contains(normName)) {
            return true;
        }
        for (String p : prescribedFoods) {
            if (p.isBlank()) {
                continue;
            }
            if (normName.contains(p) || (p.contains(normName) && normName.length() >= 4)) {
                return true;
            }
        }
        return false;
    }

    private String computePeakHours(Map<Integer, Integer> hourCounts) {
        if (hourCounts.isEmpty()) {
            return "12:00–14:00 e 19:00–21:00";
        }
        var sortedHours = hourCounts.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(2)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
        if (sortedHours.size() == 1) {
            int h = sortedHours.get(0);
            return String.format("%02d:00–%02d:00", h, (h + 2) % 24);
        }
        int h1 = sortedHours.get(0);
        int h2 = sortedHours.get(1);
        return String.format("%02d:00–%02d:00 e %02d:00–%02d:00", h1, (h1 + 2) % 24, h2, (h2 + 2) % 24);
    }

    private UUID findMatchingSlotId(String mealLabel, Map<String, UUID> slotLabelToSlotId) {
        String norm = normalizeFoodName(mealLabel);
        if (slotLabelToSlotId.containsKey(norm)) {
            return slotLabelToSlotId.get(norm);
        }
        for (Map.Entry<String, UUID> entry : slotLabelToSlotId.entrySet()) {
            if (norm.contains(entry.getKey()) || entry.getKey().contains(norm)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String determineCategory(double prot, double carb, double fat, String foodName) {
        String lower = foodName.toLowerCase();
        if (lower.matches(".*(frango|carne|peixe|ovo|whey|atum|tofu|queijo|patinho|peito).*")) {
            return "Proteína";
        }
        if (lower.matches(".*(arroz|batata|aveia|pao|mandioca|tapioca|macarrao|cuscuz|cereal).*")) {
            return "Carboidrato";
        }
        if (lower.matches(".*(azeite|castanha|amendoim|abacate|manteiga|oleo|nozes).*")) {
            return "Lipídios";
        }
        if (lower.matches(".*(chocolate|doce|sorvete|acai|bolo|biscoito|cookie|acucar).*")) {
            return "Fruta / Doce";
        }
        if (prot >= carb && prot >= fat) {
            return "Proteína";
        }
        if (carb >= prot && carb >= fat) {
            return "Carboidrato";
        }
        return "Lipídios / Outros";
    }

    private String buildClinicalRationale(String name, int count, String mealLabel, String category) {
        return String.format(
                "Consumido espontaneamente no %s (%dx nos últimos 14 dias). Enquadra-se no grupo de %s. "
                        + "Pode ser integrado ao cardápio como opção alternativa sem alterar a prescrição original.",
                mealLabel, count, category);
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }

    private static class FoodAggregator {
        final String displayName;
        int count = 0;
        double totalGrams = 0;
        double totalKcal = 0;
        double totalProt = 0;
        double totalCarb = 0;
        double totalFat = 0;
        double avgProt = 0;
        double avgCarb = 0;
        double avgFat = 0;
        final Map<String, Integer> mealLabels = new HashMap<>();

        FoodAggregator(String displayName) {
            this.displayName = displayName;
        }

        void add(ExtractionItem item, String mealLabel) {
            count++;
            if (item.getGrams() != null) {
                totalGrams += item.getGrams().doubleValue();
            }
            if (item.getKcal() != null) {
                totalKcal += item.getKcal().doubleValue();
            }
            if (item.getProt() != null) {
                totalProt += item.getProt().doubleValue();
            }
            if (item.getCarb() != null) {
                totalCarb += item.getCarb().doubleValue();
            }
            if (item.getFat() != null) {
                totalFat += item.getFat().doubleValue();
            }

            avgProt = totalProt / count;
            avgCarb = totalCarb / count;
            avgFat = totalFat / count;

            mealLabels.put(mealLabel, mealLabels.getOrDefault(mealLabel, 0) + 1);
        }

        double getAvgGrams() {
            return count > 0 && totalGrams > 0 ? (totalGrams / count) : 0.0;
        }

        double getAvgKcal() {
            return count > 0 && totalKcal > 0 ? (totalKcal / count) : 0.0;
        }

        String getMostCommonMealLabel() {
            return mealLabels.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Refeição");
        }
    }
}
