package com.nutriai.api.service;

import com.nutriai.api.dto.jev.JevSubstitutionDecision;
import com.nutriai.api.dto.plan.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MealPlanService {

    private static final Logger logger = LoggerFactory.getLogger(MealPlanService.class);

    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;
    private final PlanExtraRepository planExtraRepository;
    private final FoodRepository foodRepository;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final JevService jevService;

    public MealPlanService(MealPlanRepository mealPlanRepository,
                           MealSlotRepository mealSlotRepository,
                           MealOptionRepository mealOptionRepository,
                           MealFoodRepository mealFoodRepository,
                           PlanExtraRepository planExtraRepository,
                           FoodRepository foodRepository,
                           PatientRepository patientRepository,
                           EpisodeRepository episodeRepository,
                           EpisodeHistoryEventRepository historyEventRepository,
                           JevService jevService) {
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.mealFoodRepository = mealFoodRepository;
        this.planExtraRepository = planExtraRepository;
        this.foodRepository = foodRepository;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.historyEventRepository = historyEventRepository;
        this.jevService = jevService;
    }

    @Transactional
    public void createDefaultPlan(UUID episodeId, UUID nutritionistId) {
        MealPlan plan = MealPlan.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .title("Plano alimentar")
                .kcalTarget(new BigDecimal("1800"))
                .protTarget(new BigDecimal("90"))
                .carbTarget(new BigDecimal("200"))
                .fatTarget(new BigDecimal("60"))
                .build();
        MealPlan savedPlan = mealPlanRepository.save(plan);

        String[][] defaultMeals = {
                {"Café da manhã", "07:00"},
                {"Lanche manhã", "10:00"},
                {"Almoço", "12:30"},
                {"Lanche tarde", "15:30"},
                {"Jantar", "19:30"},
                {"Ceia", "22:00"}
        };

        for (int i = 0; i < defaultMeals.length; i++) {
            MealSlot slot = MealSlot.builder()
                    .planId(savedPlan.getId())
                    .label(defaultMeals[i][0])
                    .time(defaultMeals[i][1])
                    .sortOrder(i)
                    .build();
            MealSlot savedSlot = mealSlotRepository.save(slot);

            MealOption option = MealOption.builder()
                    .mealSlotId(savedSlot.getId())
                    .name("Opção 1 · Clássico")
                    .sortOrder(0)
                    .build();
            mealOptionRepository.save(option);
        }

        logger.info("Default plan created: episodeId={}, nutritionistId={}", episodeId, nutritionistId);

        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .eventType("PLAN_CREATED")
                .eventAt(LocalDateTime.now())
                .title("Plano alimentar criado")
                .description("Plano padrão com 6 refeições criado")
                .sourceRef("MealPlan:" + savedPlan.getId())
                .build());
    }

    @Transactional
    public PlanResponse getPlan(UUID nutritionistId, UUID patientId) {
        verifyPatientOwnership(patientId, nutritionistId);

        Episode episode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        MealPlan plan = getOrCreatePlanForEpisode(episode.getId(), nutritionistId);

        return buildPlanResponse(plan);
    }

    @Transactional
    public PlanResponse updatePlan(UUID nutritionistId, UUID patientId, UpdatePlanRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        if (req.title() != null) plan.setTitle(req.title());
        if (req.notes() != null) plan.setNotes(req.notes());
        if (req.kcalTarget() != null) plan.setKcalTarget(req.kcalTarget());
        if (req.protTarget() != null) plan.setProtTarget(req.protTarget());
        if (req.carbTarget() != null) plan.setCarbTarget(req.carbTarget());
        if (req.fatTarget() != null) plan.setFatTarget(req.fatTarget());

        mealPlanRepository.save(plan);
        return buildPlanResponse(plan);
    }

    @Transactional
    public MealSlotResponse addMealSlot(UUID nutritionistId, UUID patientId, AddMealSlotRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        int maxSort = mealSlotRepository.findByPlanIdOrderBySortOrder(plan.getId())
                .stream().mapToInt(MealSlot::getSortOrder).max().orElse(-1);

        MealSlot slot = MealSlot.builder()
                .planId(plan.getId())
                .label(req.label())
                .time(req.time())
                .sortOrder(maxSort + 1)
                .build();
        MealSlot savedSlot = mealSlotRepository.save(slot);

        MealOption option = MealOption.builder()
                .mealSlotId(savedSlot.getId())
                .name("Opção 1 · Clássico")
                .sortOrder(0)
                .build();
        mealOptionRepository.save(option);

        return MealSlotResponse.from(savedSlot,
                mealOptionRepository.findByMealSlotIdOrderBySortOrder(savedSlot.getId()),
                List.of());
    }

    @Transactional
    public MealSlotResponse updateMealSlot(UUID nutritionistId, UUID mealSlotId, String label, String time) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        if (label != null) slot.setLabel(label);
        if (time != null) slot.setTime(time);
        mealSlotRepository.save(slot);

        List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
        List<MealFood> allItems = options.stream()
                .flatMap(o -> mealFoodRepository.findByOptionIdOrderBySortOrder(o.getId()).stream())
                .toList();

        return MealSlotResponse.from(slot, options, allItems);
    }

    @Transactional
    public void deleteMealSlot(UUID nutritionistId, UUID mealSlotId) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
        for (MealOption opt : options) {
            mealFoodRepository.deleteAllByOptionId(opt.getId());
        }
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.delete(slot);
        logger.info("MealSlot deleted: id={}", mealSlotId);
    }

    @Transactional
    public MealOptionResponse addOption(UUID nutritionistId, UUID mealSlotId, AddOptionRequest req) {
        MealSlot slot = findSlotAndVerifyOwnership(nutritionistId, mealSlotId);

        int maxSort = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId())
                .stream().mapToInt(MealOption::getSortOrder).max().orElse(-1);

        MealOption option = MealOption.builder()
                .mealSlotId(slot.getId())
                .name(req.name())
                .sortOrder(maxSort + 1)
                .build();
        MealOption saved = mealOptionRepository.save(option);

        return MealOptionResponse.from(saved, List.of());
    }

    @Transactional
    public MealOptionResponse updateOption(UUID nutritionistId, UUID optionId, String name) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        if (name != null) option.setName(name);
        mealOptionRepository.save(option);

        return MealOptionResponse.from(option,
                mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId()));
    }

    @Transactional
    public void deleteOption(UUID nutritionistId, UUID optionId) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        mealFoodRepository.deleteAllByOptionId(optionId);
        mealOptionRepository.delete(option);
        logger.info("Option deleted: id={}", optionId);
    }

    @Transactional
    public MealFoodResponse addFoodItem(UUID nutritionistId, UUID optionId, AddFoodItemRequest req) {
        MealOption option = findOptionAndVerifyOwnership(nutritionistId, optionId);

        Food food = foodRepository.findAvailableById(req.foodId(), nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Alimento", req.foodId()));

        BigDecimal referenceAmount = req.referenceAmount();
        String unit = food.getUnit();

        BigDecimal kcal = calculateMacro(food.getKcal(), referenceAmount, food.getReferenceAmount());
        BigDecimal prot = calculateMacro(food.getProt(), referenceAmount, food.getReferenceAmount());
        BigDecimal carb = calculateMacro(food.getCarb(), referenceAmount, food.getReferenceAmount());
        BigDecimal fat = calculateMacro(food.getFat(), referenceAmount, food.getReferenceAmount());

        int maxSort = mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId())
                .stream().mapToInt(MealFood::getSortOrder).max().orElse(-1);

        MealFood item = MealFood.builder()
                .optionId(option.getId())
                .foodId(food.getId())
                .foodName(food.getName())
                .referenceAmount(referenceAmount)
                .unit(unit)
                .prep(food.getPrep())
                .kcal(kcal)
                .prot(prot)
                .carb(carb)
                .fat(fat)
                .sortOrder(maxSort + 1)
                .build();
        MealFood saved = mealFoodRepository.save(item);

        foodRepository.incrementUsedCount(food.getId());

        logger.info("Food item added: foodId={}, optionId={}, kcal={}", food.getId(), optionId, kcal);
        return MealFoodResponse.from(saved);
    }

    @Transactional
    public MealFoodResponse updateFoodItem(UUID nutritionistId, UUID itemId, UpdateFoodItemRequest req) {
        MealFood item = findFoodItemAndVerifyOwnership(nutritionistId, itemId);

        if (req.referenceAmount() != null) {
            item.setReferenceAmount(req.referenceAmount());
            if (item.getFoodId() != null) {
                foodRepository.findAvailableById(item.getFoodId(), nutritionistId).ifPresent(food -> {
                    item.setKcal(calculateMacro(food.getKcal(), item.getReferenceAmount(), food.getReferenceAmount()));
                    item.setProt(calculateMacro(food.getProt(), item.getReferenceAmount(), food.getReferenceAmount()));
                    item.setCarb(calculateMacro(food.getCarb(), item.getReferenceAmount(), food.getReferenceAmount()));
                    item.setFat(calculateMacro(food.getFat(), item.getReferenceAmount(), food.getReferenceAmount()));
                });
            }
        }
        if (req.prep() != null) item.setPrep(req.prep());
        if (req.kcal() != null) item.setKcal(req.kcal());
        if (req.prot() != null) item.setProt(req.prot());
        if (req.carb() != null) item.setCarb(req.carb());
        if (req.fat() != null) item.setFat(req.fat());

        MealFood saved = mealFoodRepository.save(item);
        return MealFoodResponse.from(saved);
    }

    @Transactional
    public void deleteFoodItem(UUID nutritionistId, UUID itemId) {
        MealFood item = findFoodItemAndVerifyOwnership(nutritionistId, itemId);
        mealFoodRepository.delete(item);
        logger.info("Food item deleted: id={}", itemId);
    }

    @Transactional
    public ExtraResponse addExtra(UUID nutritionistId, UUID patientId, AddExtraRequest req) {
        MealPlan plan = getPlanAndVerifyOwnership(nutritionistId, patientId);

        int maxSort = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())
                .stream().mapToInt(PlanExtra::getSortOrder).max().orElse(-1);

        PlanExtra extra = PlanExtra.builder()
                .planId(plan.getId())
                .name(req.name())
                .quantity(req.quantity())
                .kcal(req.kcal())
                .prot(req.prot())
                .carb(req.carb())
                .fat(req.fat())
                .sortOrder(maxSort + 1)
                .build();
        PlanExtra saved = planExtraRepository.save(extra);

        return ExtraResponse.from(saved);
    }

    @Transactional
    public ExtraResponse updateExtra(UUID nutritionistId, UUID extraId, UpdateExtraRequest req) {
        PlanExtra extra = findExtraAndVerifyOwnership(nutritionistId, extraId);

        if (req.name() != null) extra.setName(req.name());
        if (req.quantity() != null) extra.setQuantity(req.quantity());
        if (req.kcal() != null) extra.setKcal(req.kcal());
        if (req.prot() != null) extra.setProt(req.prot());
        if (req.carb() != null) extra.setCarb(req.carb());
        if (req.fat() != null) extra.setFat(req.fat());

        PlanExtra saved = planExtraRepository.save(extra);
        return ExtraResponse.from(saved);
    }

    @Transactional
    public void deleteExtra(UUID nutritionistId, UUID extraId) {
        PlanExtra extra = findExtraAndVerifyOwnership(nutritionistId, extraId);
        planExtraRepository.delete(extra);
        logger.info("Extra deleted: id={}", extraId);
    }

    BigDecimal calculateMacro(BigDecimal foodValue, BigDecimal amount, BigDecimal referenceAmount) {
        if (foodValue == null || amount == null || referenceAmount == null || referenceAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return foodValue.multiply(amount).divide(referenceAmount, 1, RoundingMode.HALF_UP);
    }

    private MealPlan getPlanAndVerifyOwnership(UUID nutritionistId, UUID patientId) {
        verifyPatientOwnership(patientId, nutritionistId);

        Episode episode = episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Episódio ativo", patientId));

        return getOrCreatePlanForEpisode(episode.getId(), nutritionistId);
    }

    private MealPlan getOrCreatePlanForEpisode(UUID episodeId, UUID nutritionistId) {
        return mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)
                .orElseGet(() -> {
                    createDefaultPlan(episodeId, nutritionistId);
                    return mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)
                            .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", episodeId));
                });
    }

    private void verifyPatientOwnership(UUID patientId, UUID nutritionistId) {
        patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
    }

    private MealSlot findSlotAndVerifyOwnership(UUID nutritionistId, UUID slotId) {
        MealSlot slot = mealSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", slotId));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Refeição", slotId);
        }
        return slot;
    }

    private MealOption findOptionAndVerifyOwnership(UUID nutritionistId, UUID optionId) {
        MealOption option = mealOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Opção", optionId));
        MealSlot slot = mealSlotRepository.findById(option.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", option.getMealSlotId()));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Opção", optionId);
        }
        return option;
    }

    private MealFood findFoodItemAndVerifyOwnership(UUID nutritionistId, UUID itemId) {
        MealFood item = mealFoodRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", itemId));
        MealOption option = mealOptionRepository.findById(item.getOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Opção", item.getOptionId()));
        MealSlot slot = mealSlotRepository.findById(option.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Refeição", option.getMealSlotId()));
        MealPlan plan = mealPlanRepository.findById(slot.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", slot.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Item", itemId);
        }
        return item;
    }

    private PlanExtra findExtraAndVerifyOwnership(UUID nutritionistId, UUID extraId) {
        PlanExtra extra = planExtraRepository.findById(extraId)
                .orElseThrow(() -> new ResourceNotFoundException("Extra", extraId));
        MealPlan plan = mealPlanRepository.findById(extra.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar", extra.getPlanId()));
        if (!plan.getNutritionistId().equals(nutritionistId)) {
            throw new ResourceNotFoundException("Extra", extraId);
        }
        return extra;
    }

    private PlanResponse buildPlanResponse(MealPlan plan) {
        List<MealSlot> slots = mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(
                plan.getId(), plan.getNutritionistId());
        List<PlanExtra> extras = planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId());

        List<UUID> slotIds = slots.stream().map(MealSlot::getId).toList();
        List<MealOption> allOptions = slotIds.isEmpty()
                ? List.of()
                : mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(
                        plan.getId(), plan.getNutritionistId());

        List<UUID> optionIds = allOptions.stream().map(MealOption::getId).toList();
        List<MealFood> allItems = optionIds.isEmpty()
                ? List.of()
                : mealFoodRepository.findAllByOptionIds(optionIds);

        return PlanResponse.from(plan, slots, extras, allOptions, allItems);
    }

    @Transactional(readOnly = true)
    public JevSubstitutionDecision evaluateSubstitution(
            UUID nutritionistId,
            UUID patientId,
            String prescribedFood,
            String desiredFood
    ) {
        Patient patient = patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));

        if (prescribedFood == null || prescribedFood.isBlank() || desiredFood == null || desiredFood.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alimento prescrito e substituto são obrigatórios");
        }

        if (jevService == null || !jevService.isAvailable()) {
            return JevSubstitutionDecision.fallback();
        }

        String objective = patient.getObjective() != null ? patient.getObjective().getPortugueseLabel() : "Saúde geral";
        return jevService.evaluateSubstitution(prescribedFood.trim(), desiredFood.trim(), objective);
    }
}
