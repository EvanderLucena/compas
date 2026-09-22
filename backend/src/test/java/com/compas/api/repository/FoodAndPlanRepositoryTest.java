package com.compas.api.repository;

import com.compas.api.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class FoodAndPlanRepositoryTest {

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private MealSlotRepository mealSlotRepository;

    @Autowired
    private MealOptionRepository mealOptionRepository;

    @Autowired
    private MealFoodRepository mealFoodRepository;

    @Autowired
    private PlanExtraRepository planExtraRepository;

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private EpisodeHistoryEventRepository historyEventRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private NutritionistRepository nutritionistRepository;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        planExtraRepository.deleteAll();
        mealFoodRepository.deleteAll();
        mealOptionRepository.deleteAll();
        mealSlotRepository.deleteAll();
        mealPlanRepository.deleteAll();
        foodRepository.deleteAll();
        episodeRepository.deleteAll();
        patientRepository.deleteAll();
        nutritionistRepository.deleteAll();

        Nutritionist nutri = Nutritionist.builder()
                .email("test@repo.com")
                .passwordHash("hash")
                .name("Test Nutri")
                .build();
        nutritionistRepository.save(nutri);
        nutritionistId = nutri.getId();
    }

    @Test
    void foodEntity_withUnifiedModel_hasAllFieldsPopulated() {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .name("Arroz branco")
                .category("CARBOIDRATO")
                .unit("GRAMAS")
                .referenceAmount(new BigDecimal("100"))
                .kcal(new BigDecimal("130.0"))
                .prot(new BigDecimal("2.7"))
                .carb(new BigDecimal("28.0"))
                .fat(new BigDecimal("0.3"))
                .fiber(new BigDecimal("0.4"))
                .prep("cozido")
                .portionLabel("1 colher")
                .build();

        Food saved = foodRepository.save(food);

        assertNotNull(saved.getId());
        assertEquals("GRAMAS", saved.getUnit());
        assertEquals(new BigDecimal("100"), saved.getReferenceAmount());
        assertEquals(new BigDecimal("130.0"), saved.getKcal());
        assertEquals("cozido", saved.getPrep());
    }

    @Test
    void foodEntity_withUnidade_persistsCorrectly() {
        Food food = Food.builder()
                .nutritionistId(nutritionistId)
                .name("Omelete 2 ovos")
                .category("PROTEINA")
                .unit("UNIDADE")
                .referenceAmount(new BigDecimal("1"))
                .kcal(new BigDecimal("358.0"))
                .prot(new BigDecimal("24.0"))
                .carb(new BigDecimal("2.0"))
                .fat(new BigDecimal("24.0"))
                .portionLabel("1 unidade")
                .build();

        Food saved = foodRepository.save(food);

        assertNotNull(saved.getId());
        assertEquals("UNIDADE", saved.getUnit());
        assertEquals(new BigDecimal("1"), saved.getReferenceAmount());
    }

    @Test
    void foodRepository_findByNutritionistId_returnsOnlyOwnerFoods() {
        UUID otherNutriId = createOtherNutritionist();

        foodRepository.save(Food.builder().nutritionistId(nutritionistId).name("Arroz").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build());
        foodRepository.save(Food.builder().nutritionistId(otherNutriId).name("Feijão").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("80")).prot(new BigDecimal("5")).carb(new BigDecimal("15")).fat(new BigDecimal("0.5")).build());

        Page<Food> result = foodRepository.findByNutritionistId(nutritionistId, PageRequest.of(0, 20));
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().stream().allMatch(f -> f.getNutritionistId().equals(nutritionistId)));
    }

    @Test
    void foodRepository_findByIdAndNutritionistId_returnsEmptyForWrongOwner() {
        UUID otherNutriId = createOtherNutritionist();

        Food food = foodRepository.save(Food.builder().nutritionistId(nutritionistId).name("Arroz").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build());

        Optional<Food> result = foodRepository.findByIdAndNutritionistId(food.getId(), otherNutriId);
        assertTrue(result.isEmpty());
    }

    @Test
    void mealPlan_hasUniqueConstraintOnEpisodeId() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).nutritionistId(nutritionistId).build());

        MealPlan plan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .build();
        mealPlanRepository.save(plan);

        MealPlan duplicatePlan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .build();
        assertThrows(Exception.class, () -> mealPlanRepository.saveAndFlush(duplicatePlan));
    }

    @Test
    void mealPlan_findByEpisodeId_returnsPlan() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).nutritionistId(nutritionistId).build());

        MealPlan plan = MealPlan.builder()
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .title("Plano test")
                .build();
        mealPlanRepository.save(plan);

        Optional<MealPlan> found = mealPlanRepository.findByEpisodeId(episode.getId());
        assertTrue(found.isPresent());
        assertEquals("Plano test", found.get().getTitle());
    }

    @Test
    void mealFood_withNullFoodId_persistsSuccessfully() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).nutritionistId(nutritionistId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        MealOption option = mealOptionRepository.save(MealOption.builder().mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build());

        MealFood item = MealFood.builder()
                .optionId(option.getId())
                .foodId(null)
                .foodName("Pão caseiro da mãe")
                .referenceAmount(new BigDecimal("50.0"))
                .unit("GRAMAS")
                .kcal(new BigDecimal("120.0"))
                .build();
        MealFood saved = mealFoodRepository.save(item);

        assertNotNull(saved.getId());
        assertNull(saved.getFoodId());
        assertEquals("Pão caseiro da mãe", saved.getFoodName());
        assertEquals(new BigDecimal("50.0"), saved.getReferenceAmount());
        assertEquals("GRAMAS", saved.getUnit());
    }

    @Test
    void deleteMealSlot_serviceCascadeRemovesOptionsAndFoodItems() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).nutritionistId(nutritionistId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        MealOption option = mealOptionRepository.save(MealOption.builder().mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build());
        MealFood item = mealFoodRepository.save(MealFood.builder()
                .optionId(option.getId()).foodName("Café").referenceAmount(new BigDecimal("200")).unit("ML").kcal(BigDecimal.ZERO).build());

        mealFoodRepository.deleteAllByOptionId(option.getId());
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.delete(slot);

        assertTrue(mealOptionRepository.findById(option.getId()).isEmpty());
        assertTrue(mealFoodRepository.findById(item.getId()).isEmpty());
    }

    @Test
    void deleteMealPlan_serviceCascadeRemovesSlotsAndExtras() {
        UUID patientId = createPatient();
        Episode episode = episodeRepository.save(Episode.builder().patientId(patientId).nutritionistId(nutritionistId).build());
        MealPlan plan = mealPlanRepository.save(MealPlan.builder().episodeId(episode.getId()).nutritionistId(nutritionistId).build());
        MealSlot slot = mealSlotRepository.save(MealSlot.builder().planId(plan.getId()).label("Café").sortOrder(0).build());
        PlanExtra extra = planExtraRepository.save(PlanExtra.builder().planId(plan.getId()).name("Chá verde").build());

        planExtraRepository.deleteAllByPlanId(plan.getId());
        java.util.List<MealOption> options = mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId());
        for (MealOption opt : options) {
            mealFoodRepository.deleteAllByOptionId(opt.getId());
        }
        mealOptionRepository.deleteAllByMealSlotId(slot.getId());
        mealSlotRepository.delete(slot);
        mealPlanRepository.delete(plan);

        assertTrue(mealSlotRepository.findById(slot.getId()).isEmpty());
        assertTrue(planExtraRepository.findById(extra.getId()).isEmpty());
    }

    private UUID createPatient() {
        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name("Test Patient " + UUID.randomUUID().toString().substring(0, 8))
                .objective(PatientObjective.SAUDE_GERAL)
                .build();
        return patientRepository.save(patient).getId();
    }

    private UUID createOtherNutritionist() {
        Nutritionist other = Nutritionist.builder()
                .email("other" + UUID.randomUUID().toString().substring(0, 8) + "@test.com")
                .passwordHash("hash")
                .name("Other Nutri")
                .build();
        return nutritionistRepository.save(other).getId();
    }
}
