package com.nutriai.api.service;

import com.nutriai.api.dto.food.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Food;
import com.nutriai.api.repository.FoodRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private JevService jevService;

    @InjectMocks
    private FoodService foodService;

    private UUID nutritionistId;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
    }

    @Test
    void createFood_storesUnifiedFields() {
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> {
            Food f = inv.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });

        CreateFoodRequest req = new CreateFoodRequest(
                "Arroz branco", "CARBOIDRATO", "GRAMAS",
                new BigDecimal("100"), new BigDecimal("130.0"), new BigDecimal("2.7"),
                new BigDecimal("28.0"), new BigDecimal("0.3"), new BigDecimal("0.4"),
                "cozido", "1 colher"
        );

        FoodResponse resp = foodService.createFood(nutritionistId, req);

        assertNotNull(resp.id());
        assertEquals("Arroz branco", resp.name());
        assertEquals("GRAMAS", resp.unit());
        assertEquals(new BigDecimal("100"), resp.referenceAmount());
        assertEquals(new BigDecimal("130.0"), resp.kcal());
        assertEquals("cozido", resp.prep());
        assertEquals("1 colher", resp.portionLabel());
    }

    @Test
    void createFood_invalidUnit_throws400() {
        CreateFoodRequest req = new CreateFoodRequest(
                "Arroz", "CARBOIDRATO", "INVALIDO",
                new BigDecimal("100"), new BigDecimal("130"), new BigDecimal("2.7"),
                new BigDecimal("28"), new BigDecimal("0.3"), null, null, null
        );

        assertThrows(ResponseStatusException.class, () -> foodService.createFood(nutritionistId, req));
    }

    @Test
    void listFoods_returnsAvailableFoods() {
        Food food = Food.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Arroz").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        Page<Food> page = new PageImpl<>(List.of(food));
        when(foodRepository.findAvailableByNutritionistId(eq(nutritionistId), any(PageRequest.class))).thenReturn(page);

        FoodService.FoodListResponse resp = foodService.listFoods(nutritionistId, 0, 12, null, null);

        assertEquals(1, resp.content().size());
        assertEquals(1, resp.totalElements());
    }

    @Test
    void listFoods_withSearchAndCategory_usesFilteredQuery() {
        Food food = Food.builder().id(UUID.randomUUID()).nutritionistId(nutritionistId).name("Arroz").category("CARBOIDRATO").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        Page<Food> page = new PageImpl<>(List.of(food));
        when(foodRepository.findAvailableByNutritionistIdWithFilters(eq(nutritionistId), eq("arroz"), eq("CARBOIDRATO"), any(PageRequest.class))).thenReturn(page);

        FoodService.FoodListResponse resp = foodService.listFoods(nutritionistId, 0, 12, "arroz", "CARBOIDRATO");

        assertEquals(1, resp.content().size());
        verify(foodRepository).findAvailableByNutritionistIdWithFilters(eq(nutritionistId), eq("arroz"), eq("CARBOIDRATO"), any(PageRequest.class));
        verify(foodRepository, never()).findAvailableByNutritionistId(any(), any());
    }

    @Test
    void getFood_returnsFoodForCorrectNutritionist() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).name("Arroz").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));

        FoodResponse resp = foodService.getFood(nutritionistId, foodId);

        assertEquals(foodId, resp.id());
        assertEquals("Arroz", resp.name());
    }

    @Test
    void getFood_throws404ForWrongNutritionist() {
        UUID foodId = UUID.randomUUID();
        UUID wrongNutriId = UUID.randomUUID();
        when(foodRepository.findAvailableById(foodId, wrongNutriId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> foodService.getFood(wrongNutriId, foodId));
    }

    @Test
    void updateFood_modifiesCorrectFieldsAndPersists() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).name("Arroz branco").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateFoodRequest req = new UpdateFoodRequest("Arroz integral", null, null, null, null, null, null, null, null, null, null);
        FoodResponse resp = foodService.updateFood(nutritionistId, foodId, req);

        assertEquals("Arroz integral", resp.name());
        verify(foodRepository).save(any(Food.class));
    }

    @Test
    void updateFood_standardFood_throws403() {
        UUID foodId = UUID.randomUUID();
        Food standardFood = Food.builder().id(foodId).nutritionistId(null).name("Arroz branco").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(standardFood));

        UpdateFoodRequest req = new UpdateFoodRequest("Arroz modificado", null, null, null, null, null, null, null, null, null, null);
        assertThrows(ResponseStatusException.class, () -> foodService.updateFood(nutritionistId, foodId, req));
        verify(foodRepository, never()).save(any(Food.class));
    }

    @Test
    void deleteFood_removesFood() {
        UUID foodId = UUID.randomUUID();
        Food food = Food.builder().id(foodId).nutritionistId(nutritionistId).name("Arroz").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(food));

        foodService.deleteFood(nutritionistId, foodId);

        verify(foodRepository).delete(food);
    }

    @Test
    void deleteFood_throws404ForWrongNutritionist() {
        UUID foodId = UUID.randomUUID();
        UUID wrongNutriId = UUID.randomUUID();
        when(foodRepository.findAvailableById(foodId, wrongNutriId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> foodService.deleteFood(wrongNutriId, foodId));
    }

    @Test
    void deleteFood_standardFood_throws403() {
        UUID foodId = UUID.randomUUID();
        Food standardFood = Food.builder().id(foodId).nutritionistId(null).name("Arroz branco").unit("GRAMAS").referenceAmount(new BigDecimal("100")).kcal(new BigDecimal("130")).prot(new BigDecimal("2.7")).carb(new BigDecimal("28")).fat(new BigDecimal("0.3")).build();
        when(foodRepository.findAvailableById(foodId, nutritionistId)).thenReturn(Optional.of(standardFood));

        assertThrows(ResponseStatusException.class, () -> foodService.deleteFood(nutritionistId, foodId));
        verify(foodRepository, never()).delete(any(Food.class));
    }

    @Test
    void suggestFoodCategorization_returnsJevDecision() {
        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.categorizeFood("Pasta de amendoim")).thenReturn(
                new com.nutriai.api.dto.jev.JevFoodCategorizationDecision(
                        "GORDURA", "GRAMAS", 15.0, 0.95, true
                )
        );

        var result = foodService.suggestFoodCategorization("Pasta de amendoim");
        assertEquals("GORDURA", result.category());
        assertEquals("GRAMAS", result.unit());
        assertEquals(15.0, result.referenceAmount());
        assertTrue(result.success());
    }
}