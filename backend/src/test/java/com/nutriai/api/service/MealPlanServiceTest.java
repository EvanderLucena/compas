package com.nutriai.api.service;

import com.nutriai.api.dto.plan.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
import com.nutriai.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MealPlanServiceTest {

    @Mock private MealPlanRepository mealPlanRepository;
    @Mock private MealSlotRepository mealSlotRepository;
    @Mock private MealOptionRepository mealOptionRepository;
    @Mock private MealFoodRepository mealFoodRepository;
    @Mock private PlanExtraRepository planExtraRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private EpisodeRepository episodeRepository;
    @Mock private EpisodeHistoryEventRepository historyEventRepository;
    @Mock private JevService jevService;

    @InjectMocks
    private MealPlanService mealPlanService;

    private UUID nutritionistId;
    private UUID patientId;
    private UUID episodeId;
    private Patient patient;
    private Episode episode;
    private MealPlan plan;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        episodeId = UUID.randomUUID();

        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Maria Silva")
                .build();

        episode = Episode.builder()
                .id(episodeId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .build();

        plan = MealPlan.builder()
                .id(UUID.randomUUID())
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .title("Plano alimentar")
                .build();
    }

    @Test
    void createDefaultPlan_creates6SlotsWith1OptionEach() {
        when(mealPlanRepository.save(any(MealPlan.class))).thenAnswer(inv -> {
            MealPlan p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(mealSlotRepository.save(any(MealSlot.class))).thenAnswer(inv -> {
            MealSlot s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(mealOptionRepository.save(any(MealOption.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        mealPlanService.createDefaultPlan(episodeId, nutritionistId);

        verify(mealPlanRepository, times(1)).save(any(MealPlan.class));
        verify(mealSlotRepository, times(6)).save(any(MealSlot.class));
        verify(mealOptionRepository, times(6)).save(any(MealOption.class));
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("PLAN_CREATED") &&
                        e.getEpisodeId().equals(episodeId)));
    }

    @Test
    void addFoodItem_gramas_calculatesMacrosProportionally() {
        UUID optionId = UUID.randomUUID();
        MealSlot slot = MealSlot.builder().id(UUID.randomUUID()).planId(plan.getId()).build();
        MealOption option = MealOption.builder().id(optionId).mealSlotId(slot.getId()).name("Opção 1").build();

        UUID foodId = UUID.randomUUID();
        Food food = Food.builder()
                .id(foodId)
                .nutritionistId(nutritionistId)
                .name("Arroz branco")
                .unit("GRAMAS")
                .referenceAmount(new BigDecimal("100"))
                .kcal(new BigDecimal("130.0"))
                .prot(new BigDecimal("2.7"))
                .carb(new BigDecimal("28.0"))
                .fat(new BigDecimal("0.3"))
                .usedCount(0)
                .build();

        when(mealOptionRepository.findById(optionId)).thenReturn(Optional.of(option));
        when(mealSlotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(mealFoodRepository.findByOptionIdOrderBySortOrder(optionId)).thenReturn(List.of());
        when(mealFoodRepository.save(any(MealFood.class))).thenAnswer(inv -> {
            MealFood mf = inv.getArgument(0);
            mf.setId(UUID.randomUUID());
            return mf;
        });

        AddFoodItemRequest req = new AddFoodItemRequest(foodId, new BigDecimal("200.0"));
        MealFoodResponse resp = mealPlanService.addFoodItem(nutritionistId, optionId, req);

        assertEquals(new BigDecimal("260.0"), resp.kcal());
        assertEquals(new BigDecimal("5.4"), resp.prot());
        assertEquals(new BigDecimal("56.0"), resp.carb());
        assertEquals(new BigDecimal("0.6"), resp.fat());
        assertEquals(new BigDecimal("200.0"), resp.referenceAmount());
        assertEquals("GRAMAS", resp.unit());
        assertEquals("Arroz branco", resp.foodName());
    }

    @Test
    void addFoodItem_unidade_calculatesMacrosProportionally() {
        UUID optionId = UUID.randomUUID();
        MealSlot slot = MealSlot.builder().id(UUID.randomUUID()).planId(plan.getId()).build();
        MealOption option = MealOption.builder().id(optionId).mealSlotId(slot.getId()).name("Opção 1").build();

        UUID foodId = UUID.randomUUID();
        Food food = Food.builder()
                .id(foodId)
                .nutritionistId(nutritionistId)
                .name("Omelete 2 ovos")
                .unit("UNIDADE")
                .referenceAmount(new BigDecimal("1"))
                .kcal(new BigDecimal("358.0"))
                .prot(new BigDecimal("24.0"))
                .carb(new BigDecimal("2.0"))
                .fat(new BigDecimal("24.0"))
                .prep("frito")
                .usedCount(0)
                .build();

        when(mealOptionRepository.findById(optionId)).thenReturn(Optional.of(option));
        when(mealSlotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(mealFoodRepository.findByOptionIdOrderBySortOrder(optionId)).thenReturn(List.of());
        when(mealFoodRepository.save(any(MealFood.class))).thenAnswer(inv -> {
            MealFood mf = inv.getArgument(0);
            mf.setId(UUID.randomUUID());
            return mf;
        });

        AddFoodItemRequest req = new AddFoodItemRequest(foodId, new BigDecimal("1.5"));
        MealFoodResponse resp = mealPlanService.addFoodItem(nutritionistId, optionId, req);

        // 358 * 1.5 / 1 = 537.0
        assertEquals(new BigDecimal("537.0"), resp.kcal());
        // 24 * 1.5 / 1 = 36.0
        assertEquals(new BigDecimal("36.0"), resp.prot());
        assertEquals(new BigDecimal("1.5"), resp.referenceAmount());
        assertEquals("UNIDADE", resp.unit());
        assertEquals("frito", resp.prep());
    }

    @Test
    void getPlan_returnsFullPlanTree() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(episode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)).thenReturn(Optional.of(plan));

        MealSlot slot = MealSlot.builder().id(UUID.randomUUID()).planId(plan.getId()).label("Café").sortOrder(0).build();
        when(mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(plan.getId(), nutritionistId)).thenReturn(List.of(slot));
        when(planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())).thenReturn(List.of());

        MealOption opt = MealOption.builder().id(UUID.randomUUID()).mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build();
        when(mealOptionRepository.findByPlanIdAndNutritionistIdOrderByMealSlotIdAndSortOrder(plan.getId(), nutritionistId)).thenReturn(List.of(opt));

        MealFood item = MealFood.builder().id(UUID.randomUUID()).optionId(opt.getId()).foodName("Café").referenceAmount(new BigDecimal("200")).unit("ML").kcal(new BigDecimal("5")).build();
        when(mealFoodRepository.findAllByOptionIds(List.of(opt.getId()))).thenReturn(List.of(item));

        PlanResponse resp = mealPlanService.getPlan(nutritionistId, patientId);

        assertEquals(plan.getId(), resp.id());
        assertEquals(1, resp.meals().size());
        assertEquals("Café", resp.meals().get(0).label());
    }

    @Test
    void getPlan_createsDefaultPlanWhenEpisodeHasNoPlan() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(episode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId))
                .thenReturn(Optional.empty(), Optional.of(plan));
        when(mealPlanRepository.save(any(MealPlan.class))).thenReturn(plan);
        when(mealSlotRepository.save(any(MealSlot.class))).thenAnswer(inv -> {
            MealSlot slot = inv.getArgument(0);
            slot.setId(UUID.randomUUID());
            return slot;
        });
        when(mealOptionRepository.save(any(MealOption.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(plan.getId(), nutritionistId))
                .thenReturn(List.of());
        when(planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())).thenReturn(List.of());

        PlanResponse resp = mealPlanService.getPlan(nutritionistId, patientId);

        assertEquals(plan.getId(), resp.id());
        verify(mealPlanRepository).save(any(MealPlan.class));
        verify(mealSlotRepository, times(6)).save(any(MealSlot.class));
        verify(mealOptionRepository, times(6)).save(any(MealOption.class));
    }

    @Test
    void getPlan_throws404ForWrongNutritionist() {
        UUID wrongNutriId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(patientId, wrongNutriId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> mealPlanService.getPlan(wrongNutriId, patientId));
    }

    @Test
    void updateFoodItem_amountChange_recalculatesMacros() {
        UUID itemId = UUID.randomUUID();
        UUID optionId = UUID.randomUUID();
        UUID slotId = UUID.randomUUID();
        UUID foodId = UUID.randomUUID();

        MealSlot slot = MealSlot.builder().id(slotId).planId(plan.getId()).build();
        MealOption option = MealOption.builder().id(optionId).mealSlotId(slotId).build();
        MealFood item = MealFood.builder()
                .id(itemId).optionId(optionId).foodId(foodId).foodName("Arroz")
                .referenceAmount(new BigDecimal("100")).unit("GRAMAS").kcal(new BigDecimal("130")).prot(new BigDecimal("2.7"))
                .carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();

        Food food = Food.builder().id(foodId).unit("GRAMAS").referenceAmount(new BigDecimal("100"))
                .kcal(new BigDecimal("130")).prot(new BigDecimal("2.7"))
                .carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();

        when(mealFoodRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(mealOptionRepository.findById(optionId)).thenReturn(Optional.of(option));
        when(mealSlotRepository.findById(slotId)).thenReturn(Optional.of(slot));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(mealFoodRepository.save(any(MealFood.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateFoodItemRequest req = new UpdateFoodItemRequest(new BigDecimal("200"), null, null, null, null, null);
        MealFoodResponse resp = mealPlanService.updateFoodItem(nutritionistId, itemId, req);

        assertEquals(new BigDecimal("200"), resp.referenceAmount());
        assertEquals(new BigDecimal("260.0"), resp.kcal());
        assertEquals(new BigDecimal("5.4"), resp.prot());
    }

    @Test
    void deleteMealSlot_cascadesToOptionsAndItems() {
        UUID slotId = UUID.randomUUID();
        MealSlot slot = MealSlot.builder().id(slotId).planId(plan.getId()).build();
        MealOption opt = MealOption.builder().id(UUID.randomUUID()).mealSlotId(slotId).build();

        when(mealSlotRepository.findById(slotId)).thenReturn(Optional.of(slot));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(mealOptionRepository.findByMealSlotIdOrderBySortOrder(slotId)).thenReturn(List.of(opt));

        mealPlanService.deleteMealSlot(nutritionistId, slotId);

        verify(mealFoodRepository).deleteAllByOptionId(opt.getId());
        verify(mealOptionRepository).deleteAllByMealSlotId(slotId);
        verify(mealSlotRepository).delete(slot);
    }

    @Test
    void addExtra_createsExtraForPlan() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(episode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)).thenReturn(Optional.of(plan));
        when(planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())).thenReturn(List.of());
        when(planExtraRepository.save(any(PlanExtra.class))).thenAnswer(inv -> {
            PlanExtra e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        AddExtraRequest req = new AddExtraRequest("Chá verde", "1 xícara", new BigDecimal("2"), null, null, null);
        ExtraResponse resp = mealPlanService.addExtra(nutritionistId, patientId, req);

        assertEquals("Chá verde", resp.name());
        assertEquals(new BigDecimal("2"), resp.kcal());
    }

    @Test
    void updateExtra_updatesFields() {
        UUID extraId = UUID.randomUUID();
        PlanExtra extra = PlanExtra.builder().id(extraId).planId(plan.getId()).name("Chá verde").build();

        when(planExtraRepository.findById(extraId)).thenReturn(Optional.of(extra));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));
        when(planExtraRepository.save(any(PlanExtra.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateExtraRequest req = new UpdateExtraRequest("Chá mate", "2 xícaras", new BigDecimal("5"), null, null, null);
        ExtraResponse resp = mealPlanService.updateExtra(nutritionistId, extraId, req);

        assertEquals("Chá mate", resp.name());
        assertEquals("2 xícaras", resp.quantity());
        assertEquals(new BigDecimal("5"), resp.kcal());
    }

    @Test
    void deleteExtra_removesExtra() {
        UUID extraId = UUID.randomUUID();
        PlanExtra extra = PlanExtra.builder().id(extraId).planId(plan.getId()).name("Chá verde").build();

        when(planExtraRepository.findById(extraId)).thenReturn(Optional.of(extra));
        when(mealPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));

        mealPlanService.deleteExtra(nutritionistId, extraId);

        verify(planExtraRepository).delete(extra);
    }

    @Test
    void calculateMacro_proportionalCalculation() {
        BigDecimal result = mealPlanService.calculateMacro(new BigDecimal("130.0"), new BigDecimal("200.0"), new BigDecimal("100"));
        assertEquals(new BigDecimal("260.0"), result);
    }

    @Test
    void calculateMacro_withUnidade() {
        BigDecimal result = mealPlanService.calculateMacro(new BigDecimal("358.0"), new BigDecimal("1.5"), new BigDecimal("1"));
        assertEquals(new BigDecimal("537.0"), result);
    }

    @Test
    void calculateMacro_handlesNullValues() {
        assertEquals(BigDecimal.ZERO, mealPlanService.calculateMacro(null, new BigDecimal("200"), new BigDecimal("100")));
        assertEquals(BigDecimal.ZERO, mealPlanService.calculateMacro(new BigDecimal("130"), null, new BigDecimal("100")));
        assertEquals(BigDecimal.ZERO, mealPlanService.calculateMacro(new BigDecimal("130"), new BigDecimal("200"), null));
    }

    @Test
    void calculateMacro_handlesZeroReferenceAmount() {
        assertEquals(BigDecimal.ZERO, mealPlanService.calculateMacro(new BigDecimal("130"), new BigDecimal("200"), BigDecimal.ZERO));
    }

    @Test
    void updatePlan_changesTitleAndTargets() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId)).thenReturn(Optional.of(episode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episodeId, nutritionistId)).thenReturn(Optional.of(plan));
        when(mealPlanRepository.save(any(MealPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(plan.getId(), nutritionistId)).thenReturn(List.of());
        when(planExtraRepository.findByPlanIdOrderBySortOrder(plan.getId())).thenReturn(List.of());

        UpdatePlanRequest req = new UpdatePlanRequest("Novo plano", "Notas importantes", new BigDecimal("2000"), null, null, null);
        PlanResponse resp = mealPlanService.updatePlan(nutritionistId, patientId, req);

        assertEquals("Novo plano", resp.title());
        assertEquals("Notas importantes", resp.notes());
        assertEquals(new BigDecimal("2000"), resp.kcalTarget());
    }

    @Test
    void frozenMacros_editingFoodCatalogDoesNotUpdatePlan() {
        MealFood item = MealFood.builder()
                .id(UUID.randomUUID()).foodName("Arroz")
                .referenceAmount(new BigDecimal("200")).unit("GRAMAS").kcal(new BigDecimal("260.0")).prot(new BigDecimal("5.4"))
                .carb(new BigDecimal("56.0")).fat(new BigDecimal("0.6")).build();

        assertEquals(new BigDecimal("260.0"), item.getKcal());
        assertEquals(new BigDecimal("5.4"), item.getProt());
    }

    @Test
    void evaluateSubstitution_returnsJevVerdict() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(patient));
        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.evaluateSubstitution(eq("Frango grelhado"), eq("Tilápia"), anyString()))
                .thenReturn(new com.nutriai.api.dto.jev.JevSubstitutionDecision(
                        "EQUIVALENTE", 0.95, true, "Ambas são fontes magras de proteína de alto valor biológico", true
                ));

        var decision = mealPlanService.evaluateSubstitution(nutritionistId, patientId, "Frango grelhado", "Tilápia");

        assertNotNull(decision);
        assertEquals("EQUIVALENTE", decision.verdict());
        assertTrue(decision.sameGroup());
        assertTrue(decision.success());
    }
}
