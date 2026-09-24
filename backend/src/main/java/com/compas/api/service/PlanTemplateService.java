package com.compas.api.service;

import com.compas.api.dto.plan.PlanResponse;
import com.compas.api.dto.plantemplate.CreatePlanTemplateRequest;
import com.compas.api.dto.plantemplate.PlanTemplateExtraDto;
import com.compas.api.dto.plantemplate.PlanTemplateItemDto;
import com.compas.api.dto.plantemplate.PlanTemplateMealDto;
import com.compas.api.dto.plantemplate.PlanTemplateOptionDto;
import com.compas.api.dto.plantemplate.PlanTemplateResponse;
import com.compas.api.dto.plantemplate.PlanTemplateStructureDto;
import com.compas.api.dto.plantemplate.SavePlanAsTemplateRequest;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.Episode;
import com.compas.api.model.EpisodeHistoryEvent;
import com.compas.api.model.MealFood;
import com.compas.api.model.MealOption;
import com.compas.api.model.MealPlan;
import com.compas.api.model.MealSlot;
import com.compas.api.model.PlanExtra;
import com.compas.api.model.PlanTemplate;
import com.compas.api.repository.EpisodeHistoryEventRepository;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.MealFoodRepository;
import com.compas.api.repository.MealOptionRepository;
import com.compas.api.repository.MealPlanRepository;
import com.compas.api.repository.MealSlotRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.PlanExtraRepository;
import com.compas.api.repository.PlanTemplateRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanTemplateService {

    private static final Logger LOG = LoggerFactory.getLogger(PlanTemplateService.class);

    private final PlanTemplateRepository planTemplateRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;
    private final PlanExtraRepository planExtraRepository;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final SubscriptionService subscriptionService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<PlanTemplateResponse> listTemplates(UUID nutritionistId) {
        List<PlanTemplate> templates = planTemplateRepository.findAllByNutritionistIdOrSystem(nutritionistId);
        return templates.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanTemplateResponse getTemplate(UUID id, UUID nutritionistId) {
        PlanTemplate template = planTemplateRepository.findByIdAndNutritionistIdOrSystem(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de plano", id));
        return toResponse(template);
    }

    @Transactional
    public PlanTemplateResponse createTemplate(UUID nutritionistId, CreatePlanTemplateRequest req) {
        subscriptionService.assertSubscriptionActive(nutritionistId);

        PlanTemplateStructureDto structure = new PlanTemplateStructureDto(
                req.meals() != null ? req.meals() : List.of(),
                req.extras() != null ? req.extras() : List.of()
        );

        String json = serializeStructure(structure);

        PlanTemplate template = PlanTemplate.builder()
                .nutritionistId(nutritionistId)
                .name(req.name().trim())
                .description(req.description() != null ? req.description().trim() : null)
                .category(req.category() != null && !req.category().isBlank() ? req.category().trim() : "GERAL")
                .isSystem(false)
                .kcalTarget(req.kcalTarget())
                .protTarget(req.protTarget() != null ? req.protTarget() : java.math.BigDecimal.ZERO)
                .carbTarget(req.carbTarget() != null ? req.carbTarget() : java.math.BigDecimal.ZERO)
                .fatTarget(req.fatTarget() != null ? req.fatTarget() : java.math.BigDecimal.ZERO)
                .structureJson(json)
                .build();

        PlanTemplate saved = planTemplateRepository.save(template);
        LOG.info("Created custom plan template {} for nutritionist {}", saved.getId(), nutritionistId);
        return toResponse(saved);
    }

    @Transactional
    public PlanTemplateResponse savePlanAsTemplate(UUID nutritionistId, UUID patientId, SavePlanAsTemplateRequest req) {
        subscriptionService.assertSubscriptionActive(nutritionistId);

        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode episode = episodeRepository
                .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        MealPlan plan = mealPlanRepository.findByEpisodeIdAndNutritionistId(episode.getId(), nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", episode.getId()));

        PlanTemplateStructureDto structure = extractStructureFromPlan(plan.getId(), nutritionistId);
        String json = serializeStructure(structure);

        PlanTemplate template = PlanTemplate.builder()
                .nutritionistId(nutritionistId)
                .name(req.name().trim())
                .description(req.description() != null ? req.description().trim() : null)
                .category(req.category() != null && !req.category().isBlank() ? req.category().trim() : "GERAL")
                .isSystem(false)
                .kcalTarget(plan.getKcalTarget())
                .protTarget(plan.getProtTarget())
                .carbTarget(plan.getCarbTarget())
                .fatTarget(plan.getFatTarget())
                .structureJson(json)
                .build();

        PlanTemplate saved = planTemplateRepository.save(template);
        LOG.info("Saved plan of patient {} as template {} for nutritionist {}",
                patientId, saved.getId(), nutritionistId);
        return toResponse(saved);
    }

    private PlanTemplateStructureDto extractStructureFromPlan(UUID planId, UUID nutritionistId) {
        List<MealSlot> slots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(
                planId, nutritionistId);
        List<PlanExtra> extras = planExtraRepository.findByPlanIdOrderBySortOrder(planId);

        List<PlanTemplateMealDto> mealDtos = new ArrayList<>();
        for (MealSlot slot : slots) {
            List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
            List<PlanTemplateOptionDto> optionDtos = new ArrayList<>();

            for (MealOption option : options) {
                List<MealFood> foods = mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId());
                List<PlanTemplateItemDto> itemDtos = foods.stream()
                        .map(f -> new PlanTemplateItemDto(
                                f.getFoodId(),
                                f.getFoodName(),
                                f.getReferenceAmount(),
                                f.getUnit(),
                                f.getKcal(),
                                f.getProt(),
                                f.getCarb(),
                                f.getFat(),
                                f.getPrep(),
                                f.getSortOrder()
                        ))
                        .toList();

                optionDtos.add(new PlanTemplateOptionDto(option.getName(), option.getSortOrder(), itemDtos));
            }

            mealDtos.add(new PlanTemplateMealDto(slot.getLabel(), slot.getTime(), slot.getSortOrder(), optionDtos));
        }

        List<PlanTemplateExtraDto> extraDtos = extras.stream()
                .map(e -> new PlanTemplateExtraDto(
                        e.getName(),
                        e.getQuantity(),
                        e.getKcal(),
                        e.getProt(),
                        e.getCarb(),
                        e.getFat(),
                        e.getSortOrder()
                ))
                .toList();

        return new PlanTemplateStructureDto(mealDtos, extraDtos);
    }

    @Transactional
    public PlanResponse applyTemplateToPatient(UUID nutritionistId, UUID patientId, UUID templateId) {
        subscriptionService.assertSubscriptionActive(nutritionistId);

        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        Episode episode = episodeRepository
                .findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        PlanTemplate template = planTemplateRepository.findByIdAndNutritionistIdOrSystem(templateId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de plano", templateId));

        MealPlan plan = getOrCreatePlan(episode.getId(), nutritionistId);
        updatePlanTargets(plan, template);

        clearExistingPlanContent(plan.getId(), nutritionistId);

        PlanTemplateStructureDto structure = deserializeStructure(template.getStructureJson());
        if (structure != null) {
            populateMeals(plan.getId(), structure.meals());
            populateExtras(plan.getId(), structure.extras());
        }

        recordTemplateAppliedHistory(episode.getId(), nutritionistId, template);
        LOG.info("Applied template {} to patient {} plan {}", templateId, patientId, plan.getId());

        return buildPlanResponse(plan, nutritionistId);
    }

    private MealPlan getOrCreatePlan(UUID episodeId, UUID nutritionistId) {
        return mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)
                .orElseGet(() -> mealPlanRepository.save(MealPlan.builder()
                        .episodeId(episodeId)
                        .nutritionistId(nutritionistId)
                        .title("Plano alimentar")
                        .build()));
    }

    private void updatePlanTargets(MealPlan plan, PlanTemplate template) {
        plan.setKcalTarget(template.getKcalTarget());
        plan.setProtTarget(template.getProtTarget());
        plan.setCarbTarget(template.getCarbTarget());
        plan.setFatTarget(template.getFatTarget());
        mealPlanRepository.save(plan);
    }

    private void clearExistingPlanContent(UUID planId, UUID nutritionistId) {
        List<MealSlot> currentSlots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(
                planId, nutritionistId);
        for (MealSlot slot : currentSlots) {
            List<MealOption> currentOptions = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
            for (MealOption opt : currentOptions) {
                mealFoodRepository.deleteAllByOptionId(opt.getId());
            }
            mealOptionRepository.deleteAll(currentOptions);
        }
        mealSlotRepository.deleteAll(currentSlots);
        planExtraRepository.deleteAllByPlanId(planId);
    }

    private void populateMeals(UUID planId, List<PlanTemplateMealDto> meals) {
        if (meals == null || meals.isEmpty()) {
            return;
        }
        for (PlanTemplateMealDto mealDto : meals) {
            MealSlot slot = mealSlotRepository.save(MealSlot.builder()
                    .planId(planId)
                    .label(mealDto.label())
                    .time(mealDto.time())
                    .sortOrder(mealDto.sortOrder() != null ? mealDto.sortOrder() : 0)
                    .build());

            populateMealOptions(slot.getId(), mealDto.options());
        }
    }

    private void populateMealOptions(UUID slotId, List<PlanTemplateOptionDto> options) {
        if (options == null || options.isEmpty()) {
            return;
        }
        for (PlanTemplateOptionDto optDto : options) {
            MealOption option = mealOptionRepository.save(MealOption.builder()
                    .mealSlotId(slotId)
                    .name(optDto.name())
                    .sortOrder(optDto.sortOrder() != null ? optDto.sortOrder() : 0)
                    .build());

            populateMealItems(option.getId(), optDto.items());
        }
    }

    private void populateMealItems(UUID optionId, List<PlanTemplateItemDto> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        for (PlanTemplateItemDto itemDto : items) {
            mealFoodRepository.save(MealFood.builder()
                    .optionId(optionId)
                    .foodId(itemDto.foodId())
                    .foodName(itemDto.foodName())
                    .referenceAmount(itemDto.referenceAmount())
                    .unit(itemDto.unit())
                    .kcal(itemDto.kcal())
                    .prot(itemDto.prot())
                    .carb(itemDto.carb())
                    .fat(itemDto.fat())
                    .prep(itemDto.prep())
                    .sortOrder(itemDto.sortOrder() != null ? itemDto.sortOrder() : 0)
                    .build());
        }
    }

    private void populateExtras(UUID planId, List<PlanTemplateExtraDto> extras) {
        if (extras == null || extras.isEmpty()) {
            return;
        }
        for (PlanTemplateExtraDto extraDto : extras) {
            planExtraRepository.save(PlanExtra.builder()
                    .planId(planId)
                    .name(extraDto.name())
                    .quantity(extraDto.quantity())
                    .kcal(extraDto.kcal())
                    .prot(extraDto.prot())
                    .carb(extraDto.carb())
                    .fat(extraDto.fat())
                    .sortOrder(extraDto.sortOrder() != null ? extraDto.sortOrder() : 0)
                    .build());
        }
    }

    private void recordTemplateAppliedHistory(UUID episodeId, UUID nutritionistId, PlanTemplate template) {
        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType("PLAN_UPDATED")
                .eventAt(LocalDateTime.now())
                .title("Modelo de plano aplicado")
                .description("Modelo '" + template.getName() + "' aplicado com sucesso ao plano do paciente")
                .sourceRef("PlanTemplate:" + template.getId())
                .build());
    }

    private PlanResponse buildPlanResponse(MealPlan plan, UUID nutritionistId) {
        List<MealSlot> newSlots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(
                plan.getId(), nutritionistId);
        List<PlanExtra> newExtras = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId());
        List<MealOption> newOptions = newSlots.isEmpty()
                ? List.of()
                : mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(
                        plan.getId(), nutritionistId);
        List<UUID> optionIds = newOptions.stream().map(MealOption::getId).toList();
        List<MealFood> newItems = optionIds.isEmpty()
                ? List.of()
                : mealFoodRepository.findAllByOptionIds(optionIds);

        return PlanResponse.from(plan, newSlots, newExtras, newOptions, newItems);
    }

    @Transactional
    public void deleteTemplate(UUID id, UUID nutritionistId) {
        subscriptionService.assertSubscriptionActive(nutritionistId);

        Optional<PlanTemplate> templateOpt = planTemplateRepository.findByIdAndNutritionistId(id, nutritionistId);
        if (templateOpt.isPresent()) {
            planTemplateRepository.delete(templateOpt.get());
            LOG.info("Deleted custom template {} by nutritionist {}", id, nutritionistId);
            return;
        }

        Optional<PlanTemplate> systemOpt = planTemplateRepository.findById(id);
        if (systemOpt.isPresent() && Boolean.TRUE.equals(systemOpt.get().getIsSystem())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Modelos padrão do sistema não podem ser excluídos");
        }

        throw new ResourceNotFoundException("Modelo de plano", id);
    }

    private PlanTemplateResponse toResponse(PlanTemplate template) {
        PlanTemplateStructureDto structure = deserializeStructure(template.getStructureJson());
        return PlanTemplateResponse.from(template, structure);
    }

    private String serializeStructure(PlanTemplateStructureDto structure) {
        try {
            return objectMapper.writeValueAsString(structure);
        } catch (JsonProcessingException e) {
            LOG.error("Error serializing plan template structure: {}", e.getMessage(), e);
            return "{\"meals\":[],\"extras\":[]}";
        }
    }

    private PlanTemplateStructureDto deserializeStructure(String json) {
        if (json == null || json.isBlank()) {
            return new PlanTemplateStructureDto(List.of(), List.of());
        }
        try {
            return objectMapper.readValue(json, PlanTemplateStructureDto.class);
        } catch (JsonProcessingException e) {
            LOG.warn("Error deserializing plan template structure: {}", e.getMessage());
            return new PlanTemplateStructureDto(List.of(), List.of());
        }
    }
}

