package com.nutriai.api.service;

import com.nutriai.api.dto.patient.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Episode;
import com.nutriai.api.model.EpisodeHistoryEvent;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.PatientObjective;
import com.nutriai.api.model.PatientStatus;
import com.nutriai.api.repository.EpisodeHistoryEventRepository;
import com.nutriai.api.repository.EpisodeRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Arrays;
import java.util.UUID;

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

    public PatientService(PatientRepository patientRepository,
                           EpisodeRepository episodeRepository,
                           NutritionistRepository nutritionistRepository,
                           MealPlanService mealPlanService,
                           EpisodeHistoryEventRepository historyEventRepository,
                           PhoneNormalizationService phoneNormalizationService) {
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.nutritionistRepository = nutritionistRepository;
        this.mealPlanService = mealPlanService;
        this.historyEventRepository = historyEventRepository;
        this.phoneNormalizationService = phoneNormalizationService;
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

        String escapedSearch = search != null ? escapeLike(search) : null;
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
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private String buildEpisodeMetadata(PatientObjective objective) {
        if (objective == null) {
            return null;
        }
        return OBJECTIVE_METADATA_TEMPLATE.formatted(objective.name());
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(words.length, 2); i++) {
            if (!words[i].isEmpty()) sb.append(Character.toUpperCase(words[i].charAt(0)));
        }
        return sb.toString();
    }

    /**
     * Escape SQL LIKE special characters (% and _) for safe wildcard search.
     */
    private String escapeLike(String search) {
        if (search == null) return null;
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
}
