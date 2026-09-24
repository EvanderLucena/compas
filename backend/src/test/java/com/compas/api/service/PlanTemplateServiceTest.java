package com.compas.api.service;

import com.compas.api.dto.plan.PlanResponse;
import com.compas.api.dto.plantemplate.CreatePlanTemplateRequest;
import com.compas.api.dto.plantemplate.PlanTemplateExtraDto;
import com.compas.api.dto.plantemplate.PlanTemplateItemDto;
import com.compas.api.dto.plantemplate.PlanTemplateMealDto;
import com.compas.api.dto.plantemplate.PlanTemplateOptionDto;
import com.compas.api.dto.plantemplate.PlanTemplateResponse;
import com.compas.api.dto.plantemplate.SavePlanAsTemplateRequest;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.Episode;
import com.compas.api.model.EpisodeHistoryEvent;
import com.compas.api.model.MealFood;
import com.compas.api.model.MealOption;
import com.compas.api.model.MealPlan;
import com.compas.api.model.MealSlot;
import com.compas.api.model.Patient;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanTemplateServiceTest {

    @Mock
    private PlanTemplateRepository planTemplateRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EpisodeRepository episodeRepository;

    @Mock
    private MealPlanRepository mealPlanRepository;

    @Mock
    private MealSlotRepository mealSlotRepository;

    @Mock
    private MealOptionRepository mealOptionRepository;

    @Mock
    private MealFoodRepository mealFoodRepository;

    @Mock
    private PlanExtraRepository planExtraRepository;

    @Mock
    private EpisodeHistoryEventRepository historyEventRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PlanTemplateService planTemplateService;

    private UUID nutritionistId;
    private UUID patientId;
    private UUID templateId;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        templateId = UUID.randomUUID();
    }

    @Test
    void listTemplates_returnsSystemAndCustomTemplates() {
        PlanTemplate systemTmpl = PlanTemplate.builder()
                .id(UUID.randomUUID())
                .name("Equilíbrio 2000 kcal")
                .category("EQUILIBRIO")
                .isSystem(true)
                .kcalTarget(new BigDecimal("2000"))
                .structureJson("{\"meals\":[],\"extras\":[]}")
                .build();

        PlanTemplate customTmpl = PlanTemplate.builder()
                .id(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .name("Meu Template")
                .category("HIPERTROFIA")
                .isSystem(false)
                .kcalTarget(new BigDecimal("2500"))
                .structureJson("{\"meals\":[],\"extras\":[]}")
                .build();

        when(planTemplateRepository.findAllByNutritionistIdOrSystem(nutritionistId))
                .thenReturn(List.of(systemTmpl, customTmpl));

        List<PlanTemplateResponse> result = planTemplateService.listTemplates(nutritionistId);

        assertEquals(2, result.size());
        assertEquals("Equilíbrio 2000 kcal", result.get(0).name());
        assertTrue(result.get(0).isSystem());
        assertEquals("Meu Template", result.get(1).name());
        assertFalse(result.get(1).isSystem());
    }

    @Test
    void getTemplate_returnsTemplateWhenFound() {
        PlanTemplate template = PlanTemplate.builder()
                .id(templateId)
                .nutritionistId(nutritionistId)
                .name("Template Teste")
                .category("GERAL")
                .isSystem(false)
                .kcalTarget(new BigDecimal("1800"))
                .structureJson("{\"meals\":[],\"extras\":[]}")
                .build();

        when(planTemplateRepository.findByIdAndNutritionistIdOrSystem(templateId, nutritionistId))
                .thenReturn(Optional.of(template));

        PlanTemplateResponse result = planTemplateService.getTemplate(templateId, nutritionistId);

        assertNotNull(result);
        assertEquals("Template Teste", result.name());
        assertEquals(new BigDecimal("1800"), result.kcalTarget());
    }

    @Test
    void getTemplate_notFound_throwsException() {
        when(planTemplateRepository.findByIdAndNutritionistIdOrSystem(templateId, nutritionistId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> planTemplateService.getTemplate(templateId, nutritionistId));
    }

    @Test
    void createTemplate_persistsAndReturnsResponse() {
        CreatePlanTemplateRequest req = new CreatePlanTemplateRequest(
                "Dieta Hipertrofia",
                "Descrição hipertrofia",
                "HIPERTROFIA",
                new BigDecimal("2800"),
                new BigDecimal("180"),
                new BigDecimal("350"),
                new BigDecimal("70"),
                List.of(new PlanTemplateMealDto(
                        "Café da Manhã",
                        "07:00",
                        0,
                        List.of(new PlanTemplateOptionDto(
                                "Opção 1",
                                0,
                                List.of(new PlanTemplateItemDto(
                                        null, "Ovo cozido", new BigDecimal("2"), "UNIDADE",
                                        new BigDecimal("140"), new BigDecimal("12"),
                                        new BigDecimal("1"), new BigDecimal("10"), "cozido", 0
                                ))
                        ))
                )),
                List.of(new PlanTemplateExtraDto(
                        "Creatina", "5g", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0
                ))
        );

        when(planTemplateRepository.save(any(PlanTemplate.class))).thenAnswer(inv -> {
            PlanTemplate t = inv.getArgument(0);
            t.setId(templateId);
            return t;
        });

        PlanTemplateResponse resp = planTemplateService.createTemplate(nutritionistId, req);

        assertNotNull(resp);
        assertEquals(templateId, resp.id());
        assertEquals("Dieta Hipertrofia", resp.name());
        assertEquals("HIPERTROFIA", resp.category());
        assertFalse(resp.isSystem());
        assertNotNull(resp.meals());
        assertEquals(1, resp.meals().size());
        assertEquals(1, resp.extras().size());
        verify(subscriptionService).assertSubscriptionActive(nutritionistId);
    }

    @Test
    void savePlanAsTemplate_extractsPlanStructureAndSaves() {
        Patient patient = Patient.builder().id(patientId).nutritionistId(nutritionistId).build();
        Episode episode = Episode.builder().id(UUID.randomUUID()).patientId(patientId).nutritionistId(nutritionistId).build();
        UUID planId = UUID.randomUUID();
        MealPlan plan = MealPlan.builder()
                .id(planId)
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .kcalTarget(new BigDecimal("2200"))
                .protTarget(new BigDecimal("150"))
                .carbTarget(new BigDecimal("250"))
                .fatTarget(new BigDecimal("60"))
                .build();

        MealSlot slot = MealSlot.builder().id(UUID.randomUUID()).planId(planId).label("Almoço").time("12:00").sortOrder(0).build();
        MealOption option = MealOption.builder().id(UUID.randomUUID()).mealSlotId(slot.getId()).name("Opção 1").sortOrder(0).build();
        MealFood food = MealFood.builder()
                .id(UUID.randomUUID())
                .optionId(option.getId())
                .foodName("Frango grelhado")
                .referenceAmount(new BigDecimal("150"))
                .unit("GRAMAS")
                .kcal(new BigDecimal("240"))
                .prot(new BigDecimal("45"))
                .carb(BigDecimal.ZERO)
                .fat(new BigDecimal("5"))
                .sortOrder(0)
                .build();
        PlanExtra extra = PlanExtra.builder()
                .id(UUID.randomUUID())
                .planId(planId)
                .name("Água")
                .quantity("2L")
                .kcal(BigDecimal.ZERO)
                .prot(BigDecimal.ZERO)
                .carb(BigDecimal.ZERO)
                .fat(BigDecimal.ZERO)
                .sortOrder(0)
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId))
                .thenReturn(Optional.of(episode));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episode.getId(), nutritionistId)).thenReturn(Optional.of(plan));
        when(mealSlotRepository.findByPlanIdAndNutritionistIdOrderBySortOrder(planId, nutritionistId)).thenReturn(List.of(slot));
        when(planExtraRepository.findByPlanIdOrderBySortOrder(planId)).thenReturn(List.of(extra));
        when(mealOptionRepository.findByMealSlotIdOrderBySortOrder(slot.getId())).thenReturn(List.of(option));
        when(mealFoodRepository.findByOptionIdOrderBySortOrder(option.getId())).thenReturn(List.of(food));

        when(planTemplateRepository.save(any(PlanTemplate.class))).thenAnswer(inv -> {
            PlanTemplate t = inv.getArgument(0);
            t.setId(templateId);
            return t;
        });

        SavePlanAsTemplateRequest req = new SavePlanAsTemplateRequest(
                "Dieta Ana Salva", "Modelo baseado na Ana", "EMAGRECIMENTO"
        );

        PlanTemplateResponse resp = planTemplateService.savePlanAsTemplate(nutritionistId, patientId, req);

        assertNotNull(resp);
        assertEquals("Dieta Ana Salva", resp.name());
        assertEquals("EMAGRECIMENTO", resp.category());
        assertEquals(new BigDecimal("2200"), resp.kcalTarget());
        assertEquals(1, resp.meals().size());
        assertEquals("Almoço", resp.meals().get(0).label());
        assertEquals(1, resp.extras().size());
        verify(subscriptionService).assertSubscriptionActive(nutritionistId);
    }

    @Test
    void applyTemplateToPatient_replacesPlanContentAndUpdatesTargets() {
        Patient patient = Patient.builder().id(patientId).nutritionistId(nutritionistId).build();
        Episode episode = Episode.builder().id(UUID.randomUUID()).patientId(patientId).nutritionistId(nutritionistId).build();
        UUID planId = UUID.randomUUID();
        MealPlan plan = MealPlan.builder()
                .id(planId)
                .episodeId(episode.getId())
                .nutritionistId(nutritionistId)
                .kcalTarget(new BigDecimal("1500"))
                .build();

        String structureJson = "{\"meals\":[{\"label\":\"Jantar\",\"time\":\"19:30\",\"sortOrder\":0,"
                + "\"options\":[{\"name\":\"Opção A\",\"sortOrder\":0,"
                + "\"items\":[{\"foodName\":\"Salmão\",\"referenceAmount\":120,\"unit\":\"GRAMAS\","
                + "\"kcal\":250,\"prot\":25,\"carb\":0,\"fat\":15,\"sortOrder\":0}]}]}],"
                + "\"extras\":[{\"name\":\"Chá de Camomila\",\"quantity\":\"1 xícara\",\"kcal\":0,\"prot\":0,\"carb\":0,\"fat\":0,\"sortOrder\":0}]}";

        PlanTemplate template = PlanTemplate.builder()
                .id(templateId)
                .name("Low Carb Noturno")
                .kcalTarget(new BigDecimal("1700"))
                .protTarget(new BigDecimal("130"))
                .carbTarget(new BigDecimal("80"))
                .fatTarget(new BigDecimal("70"))
                .structureJson(structureJson)
                .build();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)).thenReturn(Optional.of(patient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId))
                .thenReturn(Optional.of(episode));
        when(planTemplateRepository.findByIdAndNutritionistIdOrSystem(templateId, nutritionistId)).thenReturn(Optional.of(template));
        when(mealPlanRepository.findByEpisodeIdAndNutritionistId(episode.getId(), nutritionistId)).thenReturn(Optional.of(plan));

        when(mealSlotRepository.save(any(MealSlot.class))).thenAnswer(inv -> {
            MealSlot s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(mealOptionRepository.save(any(MealOption.class))).thenAnswer(inv -> {
            MealOption o = inv.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });

        PlanResponse result = planTemplateService.applyTemplateToPatient(nutritionistId, patientId, templateId);

        assertNotNull(result);
        assertEquals(new BigDecimal("1700"), plan.getKcalTarget());
        assertEquals(new BigDecimal("130"), plan.getProtTarget());
        verify(mealSlotRepository).save(any(MealSlot.class));
        verify(mealOptionRepository).save(any(MealOption.class));
        verify(mealFoodRepository).save(any(MealFood.class));
        verify(planExtraRepository).save(any(PlanExtra.class));
        verify(historyEventRepository).save(any(EpisodeHistoryEvent.class));
    }

    @Test
    void deleteTemplate_customTemplate_deletesSuccessfully() {
        PlanTemplate customTmpl = PlanTemplate.builder()
                .id(templateId)
                .nutritionistId(nutritionistId)
                .isSystem(false)
                .build();

        when(planTemplateRepository.findByIdAndNutritionistId(templateId, nutritionistId))
                .thenReturn(Optional.of(customTmpl));

        planTemplateService.deleteTemplate(templateId, nutritionistId);

        verify(planTemplateRepository).delete(customTmpl);
        verify(subscriptionService).assertSubscriptionActive(nutritionistId);
    }

    @Test
    void deleteTemplate_systemTemplate_throws403Forbidden() {
        when(planTemplateRepository.findByIdAndNutritionistId(templateId, nutritionistId))
                .thenReturn(Optional.empty());

        PlanTemplate systemTmpl = PlanTemplate.builder()
                .id(templateId)
                .isSystem(true)
                .build();

        when(planTemplateRepository.findById(templateId)).thenReturn(Optional.of(systemTmpl));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> planTemplateService.deleteTemplate(templateId, nutritionistId));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void deleteTemplate_notFound_throws404() {
        when(planTemplateRepository.findByIdAndNutritionistId(templateId, nutritionistId))
                .thenReturn(Optional.empty());
        when(planTemplateRepository.findById(templateId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> planTemplateService.deleteTemplate(templateId, nutritionistId));
    }
}
