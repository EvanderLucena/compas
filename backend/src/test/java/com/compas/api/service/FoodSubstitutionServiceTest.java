package com.compas.api.service;

import com.compas.api.dto.substitution.FoodSubstitutionItemResponse;
import com.compas.api.dto.substitution.FoodSubstitutionRequest;
import com.compas.api.dto.substitution.FoodSubstitutionResponse;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.ExtractionItem;
import com.compas.api.model.Food;
import com.compas.api.model.MealExtraction;
import com.compas.api.model.Patient;
import com.compas.api.repository.ExtractionItemRepository;
import com.compas.api.repository.FoodRepository;
import com.compas.api.repository.MealExtractionRepository;
import com.compas.api.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodSubstitutionServiceTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private MealExtractionRepository mealExtractionRepository;

    @Mock
    private ExtractionItemRepository extractionItemRepository;

    @InjectMocks
    private FoodSubstitutionService foodSubstitutionService;

    private UUID nutritionistId;
    private UUID patientId;
    private Patient patient;
    private Food arroz;
    private Food batataDoce;
    private Food mandioca;
    private Food frango;
    private Food patinho;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Ana Silva")
                .build();

        arroz = Food.builder()
                .id(UUID.randomUUID())
                .name("Arroz branco cozido")
                .category("CARBOIDRATO")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(130.0))
                .prot(BigDecimal.valueOf(2.7))
                .carb(BigDecimal.valueOf(28.2))
                .fat(BigDecimal.valueOf(0.2))
                .portionLabel("1 escumadeira cheia · 120g")
                .build();

        batataDoce = Food.builder()
                .id(UUID.randomUUID())
                .name("Batata doce cozida")
                .category("CARBOIDRATO")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(77.0))
                .prot(BigDecimal.valueOf(0.6))
                .carb(BigDecimal.valueOf(18.4))
                .fat(BigDecimal.valueOf(0.1))
                .portionLabel("1 unidade média · 150g")
                .build();

        mandioca = Food.builder()
                .id(UUID.randomUUID())
                .name("Mandioca cozida")
                .category("CARBOIDRATO")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(125.0))
                .prot(BigDecimal.valueOf(0.6))
                .carb(BigDecimal.valueOf(30.1))
                .fat(BigDecimal.valueOf(0.3))
                .portionLabel("1 pedaço médio · 100g")
                .build();

        frango = Food.builder()
                .id(UUID.randomUUID())
                .name("Peito de frango grelhado")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(165.0))
                .prot(BigDecimal.valueOf(31.0))
                .carb(BigDecimal.ZERO)
                .fat(BigDecimal.valueOf(3.6))
                .portionLabel("1 filé médio · 120g")
                .build();

        patinho = Food.builder()
                .id(UUID.randomUUID())
                .name("Patinho bovino moído")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(215.0))
                .prot(BigDecimal.valueOf(34.0))
                .carb(BigDecimal.ZERO)
                .fat(BigDecimal.valueOf(8.0))
                .portionLabel("3 colheres de sopa cheias · 100g")
                .build();
    }

    @Test
    void calculateSubstitutionsForPatient_carbSource_calculatesAccuratePortion() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(patient));
        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(foodRepository.findAvailableById(arroz.getId(), nutritionistId))
                .thenReturn(Optional.of(arroz));
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "CARBOIDRATO"))
                .thenReturn(List.of(arroz, batataDoce, mandioca));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                arroz.getId(), null, BigDecimal.valueOf(150), null, null, null, null, null, null, 5);

        FoodSubstitutionResponse response = foodSubstitutionService.calculateSubstitutionsForPatient(
                nutritionistId, patientId, req);

        assertNotNull(response);
        assertEquals("Arroz branco cozido", response.sourceFoodName());
        assertEquals("CARBOIDRATO", response.dominantMacro());
        assertFalse(response.substitutions().isEmpty());

        FoodSubstitutionItemResponse batataSub = response.substitutions().stream()
                .filter(s -> s.name().equals("Batata doce cozida"))
                .findFirst()
                .orElse(null);
        assertNotNull(batataSub);
        assertTrue(batataSub.suggestedAmount().compareTo(BigDecimal.valueOf(180)) >= 0);
        assertNotNull(response.whatsappMessage());
        assertTrue(response.whatsappMessage().contains("Ana Silva"));
    }

    @Test
    void calculateSubstitutionsForPatient_proteinSource_calculatesAccuratePortion() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(patient));
        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(foodRepository.findAvailableById(frango.getId(), nutritionistId))
                .thenReturn(Optional.of(frango));
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "PROTEINA"))
                .thenReturn(List.of(frango, patinho));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                frango.getId(), null, BigDecimal.valueOf(120), null, null, null, null, null, null, 5);

        FoodSubstitutionResponse response = foodSubstitutionService.calculateSubstitutionsForPatient(
                nutritionistId, patientId, req);

        assertNotNull(response);
        assertEquals("Peito de frango grelhado", response.sourceFoodName());
        assertEquals("PROTEINA", response.dominantMacro());
        assertEquals(1, response.substitutions().size());
        assertEquals("Patinho bovino moído", response.substitutions().get(0).name());
    }

    @Test
    void calculateSubstitutionsForPatient_withPatientHabits_prioritizesFrequentFoods() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(patient));

        UUID extId = UUID.randomUUID();
        MealExtraction ext = MealExtraction.builder()
                .id(extId)
                .messageId(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .patientId(patientId)
                .episodeId(UUID.randomUUID())
                .extractionRaw("almoço")
                .build();
        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(ext));

        ExtractionItem item1 = ExtractionItem.builder()
                .id(UUID.randomUUID())
                .extractionId(extId)
                .name("Mandioca cozida")
                .build();
        ExtractionItem item2 = ExtractionItem.builder()
                .id(UUID.randomUUID())
                .extractionId(extId)
                .name("mandioca")
                .build();
        when(extractionItemRepository.findByExtractionIdIn(List.of(extId)))
                .thenReturn(List.of(item1, item2));

        when(foodRepository.findAvailableById(arroz.getId(), nutritionistId))
                .thenReturn(Optional.of(arroz));
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "CARBOIDRATO"))
                .thenReturn(List.of(arroz, batataDoce, mandioca));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                arroz.getId(), null, BigDecimal.valueOf(150), null, null, null, null, null, null, 5);

        FoodSubstitutionResponse response = foodSubstitutionService.calculateSubstitutionsForPatient(
                nutritionistId, patientId, req);

        assertNotNull(response);
        assertEquals("Mandioca cozida", response.substitutions().get(0).name());
        assertTrue(response.substitutions().get(0).isPatientHabit());
        assertEquals(2, response.substitutions().get(0).habitCount());
        assertTrue(response.substitutions().get(0).habitBadge().contains("2x"));
    }

    @Test
    void calculateGeneralSubstitutions_withoutPatient_calculatesEquivalency() {
        when(foodRepository.findAvailableById(arroz.getId(), nutritionistId))
                .thenReturn(Optional.of(arroz));
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "CARBOIDRATO"))
                .thenReturn(List.of(arroz, batataDoce));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                arroz.getId(), null, BigDecimal.valueOf(100), null, null, null, null, null, null, 5);

        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(
                nutritionistId, req);

        assertNotNull(response);
        assertEquals(1, response.substitutions().size());
        assertFalse(response.substitutions().get(0).isPatientHabit());
    }

    @Test
    void calculateSubstitutions_patientNotFound_throwsException() {
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.empty());

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                arroz.getId(), null, BigDecimal.valueOf(100), null, null, null, null, null, null, 5);

        assertThrows(ResourceNotFoundException.class, () ->
                foodSubstitutionService.calculateSubstitutionsForPatient(nutritionistId, patientId, req));
    }

    @Test
    void calculateSubstitutions_sourceFoodIdNotFound_throwsException() {
        UUID unknownFoodId = UUID.randomUUID();
        when(foodRepository.findAvailableById(unknownFoodId, nutritionistId))
                .thenReturn(Optional.empty());

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                unknownFoodId, null, BigDecimal.valueOf(100), null, null, null, null, null, null, 5);

        assertThrows(ResourceNotFoundException.class, () ->
                foodSubstitutionService.calculateGeneralSubstitutions(nutritionistId, req));
    }

    @Test
    void calculateSubstitutions_unknownFoodIdWithSourceFoodName_fallsBackToSuppliedData() {
        UUID unknownFoodId = UUID.randomUUID();
        when(foodRepository.findAvailableById(unknownFoodId, nutritionistId))
                .thenReturn(Optional.empty());
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "CARBOIDRATO"))
                .thenReturn(List.of(arroz, batataDoce));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                unknownFoodId,
                "Arroz branco cozido",
                BigDecimal.valueOf(100),
                "GRAMAS",
                BigDecimal.valueOf(130),
                BigDecimal.valueOf(2.7),
                BigDecimal.valueOf(28.2),
                BigDecimal.valueOf(0.2),
                "CARBOIDRATO",
                5
        );

        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(
                nutritionistId, req);

        assertNotNull(response);
        assertEquals("Arroz branco cozido", response.sourceFoodName());
        assertEquals(1, response.substitutions().size());
        assertEquals("Batata doce cozida", response.substitutions().get(0).name());
    }

    @Test
    void calculateSubstitutions_missingFoodNameAndId_throwsException() {
        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                null, "   ", BigDecimal.valueOf(100), null, null, null, null, null, null, 5);

        assertThrows(IllegalArgumentException.class, () ->
                foodSubstitutionService.calculateGeneralSubstitutions(nutritionistId, req));
    }

    @Test
    void calculateSubstitutions_unitBasedCandidate_preservesLowUnitCount() {
        Food queijo = Food.builder()
                .id(UUID.randomUUID())
                .name("Queijo minas frescal")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(260))
                .prot(BigDecimal.valueOf(17))
                .carb(BigDecimal.valueOf(3))
                .fat(BigDecimal.valueOf(20))
                .fiber(BigDecimal.ZERO)
                .portionLabel("1 fatia média · 50g")
                .build();

        Food ovo = Food.builder()
                .id(UUID.randomUUID())
                .name("Ovo de galinha cozido")
                .category("PROTEINA")
                .unit("UNIDADE")
                .referenceAmount(BigDecimal.ONE)
                .portionLabel("1 unidade")
                .kcal(BigDecimal.valueOf(70))
                .prot(BigDecimal.valueOf(6))
                .carb(BigDecimal.valueOf(0.5))
                .fat(BigDecimal.valueOf(5))
                .fiber(BigDecimal.ZERO)
                .build();

        when(foodRepository.findAvailableById(queijo.getId(), nutritionistId))
                .thenReturn(Optional.of(queijo));
        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "PROTEINA"))
                .thenReturn(List.of(queijo, ovo));

        // 50g queijo (8.5g prot, 130 kcal) -> ~1.5 ovos (9g prot, 105 kcal, delta -25 kcal, 19% dev)
        // 1.5 is well below 5, but because unit is UNIDADE, it is preserved!
        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                queijo.getId(), null, BigDecimal.valueOf(50), null, null, null, null, null, null, 5);

        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(nutritionistId, req);

        assertNotNull(response);
        assertEquals(1, response.substitutions().size());
        assertEquals("Ovo de galinha cozido", response.substitutions().get(0).name());
        assertEquals(BigDecimal.valueOf(1.5), response.substitutions().get(0).suggestedAmount());
    }

    @Test
    void calculateSubstitutions_scrambledEggsWithoutCategory_classifiesAsProtein() {
        Food ovoCozido = Food.builder()
                .id(UUID.randomUUID())
                .name("Ovo cozido")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(156))
                .prot(BigDecimal.valueOf(12.6))
                .carb(BigDecimal.valueOf(1.2))
                .fat(BigDecimal.valueOf(10.6))
                .fiber(BigDecimal.ZERO)
                .build();

        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "PROTEINA"))
                .thenReturn(List.of(ovoCozido));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                null,
                "Ovos mexidos",
                BigDecimal.valueOf(100),
                "g",
                BigDecimal.valueOf(150),
                BigDecimal.valueOf(13),
                BigDecimal.valueOf(1),
                BigDecimal.valueOf(10),
                null,
                8
        );

        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(
                nutritionistId, req);

        assertNotNull(response);
        assertEquals("PROTEINA", response.dominantMacro());
        assertEquals(1, response.substitutions().size());
        assertEquals("Ovo cozido", response.substitutions().get(0).name());
    }

    @Test
    void calculateSubstitutions_scrambledEggsWithUnUnit_preservesTwoUnitsAndScoresHigh() {
        Food ovoCozido = Food.builder()
                .id(UUID.randomUUID())
                .name("Ovo cozido")
                .category("PROTEINA")
                .unit("un")
                .referenceAmount(BigDecimal.valueOf(2.0))
                .portionLabel("2 un")
                .kcal(BigDecimal.valueOf(156.0))
                .prot(BigDecimal.valueOf(12.6))
                .carb(BigDecimal.valueOf(1.2))
                .fat(BigDecimal.valueOf(10.6))
                .fiber(BigDecimal.ZERO)
                .build();

        Food queijoRicota = Food.builder()
                .id(UUID.randomUUID())
                .name("Queijo ricota")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .portionLabel("2 fatias médias · 50g")
                .kcal(BigDecimal.valueOf(139.7))
                .prot(BigDecimal.valueOf(12.6))
                .carb(BigDecimal.valueOf(3.8))
                .fat(BigDecimal.valueOf(8.1))
                .fiber(BigDecimal.ZERO)
                .build();

        Food charqueCru = Food.builder()
                .id(UUID.randomUUID())
                .name("Carne bovina charque cru")
                .category("PROTEINA")
                .unit("GRAMAS")
                .referenceAmount(BigDecimal.valueOf(100))
                .kcal(BigDecimal.valueOf(248.8))
                .prot(BigDecimal.valueOf(22.7))
                .carb(BigDecimal.ZERO)
                .fat(BigDecimal.valueOf(16.8))
                .fiber(BigDecimal.ZERO)
                .build();

        when(foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, "PROTEINA"))
                .thenReturn(List.of(charqueCru, queijoRicota, ovoCozido));

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                null,
                "Ovos mexidos",
                BigDecimal.valueOf(100),
                "g",
                BigDecimal.valueOf(150),
                BigDecimal.valueOf(13),
                BigDecimal.valueOf(1),
                BigDecimal.valueOf(10),
                null,
                5
        );

        FoodSubstitutionResponse response = foodSubstitutionService.calculateGeneralSubstitutions(
                nutritionistId, req);

        assertNotNull(response);
        assertEquals("PROTEINA", response.dominantMacro());
        assertFalse(response.substitutions().isEmpty());

        // 1. Ovo cozido must be #1 with high score (>= 90) and exactly 2.0 un
        FoodSubstitutionItemResponse topItem = response.substitutions().get(0);
        assertEquals("Ovo cozido", topItem.name());
        assertEquals(BigDecimal.valueOf(2.0), topItem.suggestedAmount());
        assertEquals("2 unidades", topItem.householdPortion());
        assertTrue(topItem.matchScore() >= 90, "Ovo cozido should have matchScore >= 90, was " + topItem.matchScore());

        // 2. Queijo ricota should come before raw charque
        int ovoIndex = -1;
        int ricotaIndex = -1;
        int charqueIndex = -1;
        for (int i = 0; i < response.substitutions().size(); i++) {
            String name = response.substitutions().get(i).name();
            if (name.equals("Ovo cozido")) ovoIndex = i;
            if (name.equals("Queijo ricota")) ricotaIndex = i;
            if (name.equals("Carne bovina charque cru")) charqueIndex = i;
        }

        assertTrue(ovoIndex < ricotaIndex, "Ovo cozido should rank above Queijo ricota");
        if (charqueIndex != -1) {
            assertTrue(ricotaIndex < charqueIndex, "Queijo ricota should rank above raw charque");
            FoodSubstitutionItemResponse charque = response.substitutions().get(charqueIndex);
            assertTrue(charque.matchScore() < topItem.matchScore(), "Raw meat should score lower than eggs");
        }
    }

    @Test
    void calculateSubstitutions_patientNotFound_throwsResourceNotFoundException() {
        UUID nonExistentPatientId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(nonExistentPatientId, nutritionistId))
                .thenReturn(Optional.empty());

        FoodSubstitutionRequest req = new FoodSubstitutionRequest(
                null,
                "Arroz integral",
                BigDecimal.valueOf(100),
                "g",
                BigDecimal.valueOf(124),
                BigDecimal.valueOf(2.6),
                BigDecimal.valueOf(25.8),
                BigDecimal.valueOf(1.0),
                "CARBOIDRATO",
                8
        );

        assertThrows(ResourceNotFoundException.class, () ->
                foodSubstitutionService.calculateSubstitutionsForPatient(nutritionistId, nonExistentPatientId, req));
    }
}
