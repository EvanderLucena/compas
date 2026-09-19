package com.nutriai.api.service;

import com.nutriai.api.dto.patient.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.*;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private EpisodeRepository episodeRepository;

    @Mock
    private NutritionistRepository nutritionistRepository;

    @Mock
    private MealPlanService mealPlanService;

    @Mock
    private EpisodeHistoryEventRepository historyEventRepository;

    @Mock
    private PhoneNormalizationService phoneNormalizationService;

    @Mock
    private MealExtractionRepository mealExtractionRepository;

    @Mock
    private MealPlanRepository mealPlanRepository;

    @Mock
    private JevService jevService;

    @Mock
    private ExtractionItemRepository extractionItemRepository;

    @Mock
    private MealSlotRepository mealSlotRepository;

    @Mock
    private MealOptionRepository mealOptionRepository;

    @Mock
    private MealFoodRepository mealFoodRepository;

    @InjectMocks
    private PatientService patientService;

    private UUID nutritionistId;
    private Nutritionist nutritionist;
    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        nutritionist = Nutritionist.builder()
                .id(nutritionistId)
                .email("nutri@test.com")
                .passwordHash("hash")
                .name("Dr. Test")
                .role(UserRole.NUTRITIONIST)
                .build();

        samplePatient = Patient.builder()
                .id(UUID.randomUUID())
                .nutritionistId(nutritionistId)
                .name("Maria Silva")
                .initials("MS")
                .age(30)
                .objective(PatientObjective.EMAGRECIMENTO)
                .status(PatientStatus.ONTRACK)
                .weight(new BigDecimal("75.00"))
                .weightDelta(BigDecimal.ZERO)
                .adherence(80)
                .active(true)
                .build();
    }

    @Test
    void createPatient_createsPatientAndFirstEpisode() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePatientRequest req = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", new BigDecimal("75.00"), true);
        PatientResponse resp = patientService.createPatient(nutritionistId, req);

        assertNotNull(resp);
        verify(episodeRepository).save(argThat(e -> nutritionistId.equals(e.getNutritionistId())));
        assertEquals("Maria Silva", resp.name());
        assertEquals("EMAGRECIMENTO", resp.objective());
        verify(patientRepository).save(any(Patient.class));
        verify(episodeRepository).save(any(Episode.class));
    }

    @Test
    void createPatient_throwsWhenNutritionistNotFound() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.empty());

        CreatePatientRequest req = new CreatePatientRequest("Test", null, null, null, null, "EMAGRECIMENTO", null, true);
        assertThrows(ResourceNotFoundException.class, () -> patientService.createPatient(nutritionistId, req));
    }

    @Test
    void listPatients_returnsOnlyCurrentNutritionistPatients() {
        Page<Patient> page = new PageImpl<>(List.of(samplePatient));
        when(patientRepository.findByNutritionistId(eq(nutritionistId), any(PageRequest.class))).thenReturn(page);

        PatientListResponse resp = patientService.listPatients(nutritionistId, null, null, null, null, 0, 10);

        assertEquals(1, resp.content().size());
        assertEquals(1, resp.totalElements());
    }

    @Test
    void listPatients_withFilters_usesFilteredQuery() {
        Page<Patient> page = new PageImpl<>(List.of(samplePatient));
        when(patientRepository.findByNutritionistIdWithFilters(eq(nutritionistId), eq("maria"), eq(PatientStatus.ONTRACK), isNull(), eq(true), any(PageRequest.class)))
                .thenReturn(page);

        PatientListResponse resp = patientService.listPatients(nutritionistId, "maria", "ONTRACK", null, true, 0, 10);

        assertEquals(1, resp.content().size());
    }

    @Test
    void getPatient_returnsPatientForCorrectNutritionist() {
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));

        PatientResponse resp = patientService.getPatient(samplePatient.getId(), nutritionistId);

        assertEquals(samplePatient.getId(), resp.id());
        assertEquals("Maria Silva", resp.name());
    }

    @Test
    void getPatient_throws404ForWrongNutritionist() {
        UUID wrongId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), wrongId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> patientService.getPatient(samplePatient.getId(), wrongId));
    }

    @Test
    void updatePatient_partialUpdateOnlyModifiesProvidedFields() {
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdatePatientRequest req = new UpdatePatientRequest("Ana Costa", null, null, null, null, null, "WARNING", null, null, null, null);
        patientService.updatePatient(samplePatient.getId(), nutritionistId, req);

        verify(patientRepository).save(argThat(p ->
                "Ana Costa".equals(p.getName()) &&
                        p.getStatus() == PatientStatus.WARNING &&
                        p.getAge() == 30
        ));
    }

    @Test
    void deactivatePatient_setsActiveFalseAndClosesEpisode() {
        Episode currentEpisode = Episode.builder()
                .id(UUID.randomUUID())
                .patientId(samplePatient.getId())
                .nutritionistId(nutritionistId)
                .startDate(java.time.LocalDateTime.now())
                .build();

        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(samplePatient.getId(), nutritionistId))
                  .thenReturn(Optional.of(currentEpisode));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> inv.getArgument(0));

        patientService.deactivatePatient(samplePatient.getId(), nutritionistId);

        assertNotNull(currentEpisode.getEndDate());
        verify(patientRepository).save(argThat(p -> !p.getActive()));
        verify(episodeRepository).save(argThat(e -> e.getEndDate() != null));
    }

    @Test
    void reactivatePatient_setsActiveTrueAndCreatesNewEpisode() {
        samplePatient.setActive(false);

        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> inv.getArgument(0));

        patientService.reactivatePatient(samplePatient.getId(), nutritionistId);

        assertTrue(samplePatient.getActive());
        verify(episodeRepository).save(any(Episode.class));
    }

    @Test
    void updatePatient_throws404ForWrongNutritionist() {
        UUID wrongId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), wrongId)).thenReturn(Optional.empty());

        UpdatePatientRequest req = new UpdatePatientRequest("New Name", null, null, null, null, null, null, null, null, null, null);
        assertThrows(ResourceNotFoundException.class,
                () -> patientService.updatePatient(samplePatient.getId(), wrongId, req));
    }

    @Test
    void deactivatePatient_throws404ForWrongNutritionist() {
        UUID wrongId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), wrongId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> patientService.deactivatePatient(samplePatient.getId(), wrongId));
    }

    @Test
    void reactivatePatient_throws404ForWrongNutritionist() {
        UUID wrongId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), wrongId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> patientService.reactivatePatient(samplePatient.getId(), wrongId));
    }

    @Test
    void listPatients_returnsEmptyWhenNoPatients() {
        Page<Patient> emptyPage = new PageImpl<>(List.of());
        when(patientRepository.findByNutritionistId(eq(nutritionistId), any(PageRequest.class))).thenReturn(emptyPage);

        PatientListResponse resp = patientService.listPatients(nutritionistId, null, null, null, null, 0, 10);

        assertEquals(0, resp.content().size());
        assertEquals(0, resp.totalElements());
    }

    @Test
    void listPatients_withActiveFilter_callsFilteredQuery() {
        Page<Patient> page = new PageImpl<>(List.of(samplePatient));
        when(patientRepository.findByNutritionistIdWithFilters(eq(nutritionistId), isNull(), isNull(), isNull(), eq(true), any(PageRequest.class)))
                .thenReturn(page);

        PatientListResponse resp = patientService.listPatients(nutritionistId, null, null, null, true, 0, 10);

        verify(patientRepository).findByNutritionistIdWithFilters(eq(nutritionistId), isNull(), isNull(), isNull(), eq(true), any(PageRequest.class));
        verify(patientRepository, never()).findByNutritionistId(any(), any());
    }

    @Test
    void createPatient_computesInitialsFromName() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePatientRequest req = new CreatePatientRequest("João Pedro", null, null, null, null, "HIPERTROFIA", null, true);
        PatientResponse resp = patientService.createPatient(nutritionistId, req);

        assertEquals("JP", resp.initials());
    }

    @Test
    void createPatient_emitsEpisodeOpenedEvent() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> {
            Episode e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(historyEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePatientRequest req = new CreatePatientRequest("Maria Silva", null, null, null, null, "EMAGRECIMENTO", new BigDecimal("75.00"), true);
        patientService.createPatient(nutritionistId, req);

        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_OPENED") &&
                        e.getTitle().equals("Período iniciado") &&
                        "{\"objective\":\"EMAGRECIMENTO\"}".equals(e.getMetadataJson())));
    }

    @Test
    void deactivatePatient_emitsEpisodeClosedEvent() {
        Episode currentEpisode = Episode.builder()
                .id(UUID.randomUUID())
                .patientId(samplePatient.getId())
                .nutritionistId(nutritionistId)
                .startDate(java.time.LocalDateTime.now())
                .build();

        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(samplePatient.getId(), nutritionistId))
                  .thenReturn(Optional.of(currentEpisode));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        patientService.deactivatePatient(samplePatient.getId(), nutritionistId);

        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_CLOSED") &&
                        e.getEpisodeId().equals(currentEpisode.getId()) &&
                        "{\"objective\":\"EMAGRECIMENTO\"}".equals(e.getMetadataJson())));
    }

    @Test
    void reactivatePatient_emitsEpisodeOpenedEvent() {
        samplePatient.setActive(false);

        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId)).thenReturn(Optional.of(samplePatient));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> {
            Episode e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(historyEventRepository.save(any(EpisodeHistoryEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        patientService.reactivatePatient(samplePatient.getId(), nutritionistId);

        verify(episodeRepository).save(argThat(e ->
                nutritionistId.equals(e.getNutritionistId()) &&
                        samplePatient.getId().equals(e.getPatientId()) &&
                        e.getEndDate() == null));
        verify(historyEventRepository).save(argThat(e ->
                e.getEventType().equals("EPISODE_OPENED") &&
                        e.getTitle().equals("Período iniciado") &&
                        "{\"objective\":\"EMAGRECIMENTO\"}".equals(e.getMetadataJson())));
    }

    @Test
    void createPatient_normalizesPhoneNumber() {
        CreatePatientRequest req = new CreatePatientRequest(
                "Carlos Silva",
                null,
                "M",
                null,
                "(11) 99999-8877",
                "HIPERTROFIA",
                null,
                true
        );

        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(phoneNormalizationService.normalize("(11) 99999-8877")).thenReturn(Optional.of("11999998877"));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> {
            Episode ep = inv.getArgument(0);
            ep.setId(UUID.randomUUID());
            return ep;
        });

        PatientResponse resp = patientService.createPatient(nutritionistId, req);

        assertNotNull(resp);
        verify(patientRepository).save(argThat(p -> "11999998877".equals(p.getWhatsapp())));
    }

    @Test
    void updatePatient_normalizesPhoneNumber() {
        UpdatePatientRequest req = new UpdatePatientRequest(
                null,
                null,
                null,
                null,
                "+55 11 98888-7766",
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(patientRepository.findByIdAndNutritionistId(samplePatient.getId(), nutritionistId))
                .thenReturn(Optional.of(samplePatient));
        when(phoneNormalizationService.normalize("+55 11 98888-7766")).thenReturn(Optional.of("11988887766"));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        PatientResponse resp = patientService.updatePatient(samplePatient.getId(), nutritionistId, req);

        assertNotNull(resp);
        assertEquals("11988887766", resp.whatsapp());
    }

    @Test
    void createPatient_throwsWhenPhoneNumberInvalid() {
        CreatePatientRequest req = new CreatePatientRequest(
                "Carlos Silva",
                null,
                "M",
                null,
                "invalid-phone",
                "HIPERTROFIA",
                null,
                true
        );

        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(phoneNormalizationService.normalize("invalid-phone")).thenReturn(Optional.empty());

        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> patientService.createPatient(nutritionistId, req)
        );
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Número de WhatsApp inválido", ex.getReason());
    }

    @Test
    void createPatient_homonymAllowed_createsMultiplePatientsWithSameName() {
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));
        when(patientRepository.save(any(Patient.class))).thenAnswer(inv -> {
            Patient p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });
        when(episodeRepository.save(any(Episode.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePatientRequest req1 = new CreatePatientRequest("Ana Beatriz", null, null, null, null, "EMAGRECIMENTO", null, true);
        CreatePatientRequest req2 = new CreatePatientRequest("Ana Beatriz", null, null, null, null, "HIPERTROFIA", null, true);

        PatientResponse resp1 = patientService.createPatient(nutritionistId, req1);
        PatientResponse resp2 = patientService.createPatient(nutritionistId, req2);

        assertNotNull(resp1);
        assertNotNull(resp2);
        assertNotEquals(resp1.id(), resp2.id());
        assertEquals(resp1.name(), resp2.name());
        verify(patientRepository, times(2)).save(any(Patient.class));
    }

    @Test
    void evaluatePatientAdherence_calculatesAdherenceAndSavesInsight() {
        UUID patientId = UUID.randomUUID();
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(samplePatient));
        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(), any()))
                .thenReturn(List.of(
                        MealExtraction.builder().totalKcal(new BigDecimal("500")).build(),
                        MealExtraction.builder().totalKcal(new BigDecimal("600")).build()
                ));
        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId))
                .thenReturn(Optional.empty());

        when(jevService.isAvailable()).thenReturn(true);
        when(jevService.evaluatePatientAdherence(anyString(), anyString(), anyString()))
                .thenReturn(new com.nutriai.api.dto.jev.JevAdherenceDecision(
                        PatientStatus.ONTRACK, 0.15, 0.85, "Excelente adesão aos registros e macros.", true
                ));

        var decision = patientService.evaluatePatientAdherence(patientId, nutritionistId);

        assertNotNull(decision);
        assertEquals(PatientStatus.ONTRACK, decision.suggestedStatus());
        assertEquals("Excelente adesão aos registros e macros.", samplePatient.getAiAdherenceInsight());
        verify(patientRepository).save(samplePatient);
    }

    @Test
    void getConsumptionPatterns_whenNoExtractions_returnsDefaultEmptyPatterns() {
        UUID patientId = samplePatient.getId();
        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(samplePatient));
        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(), any()))
                .thenReturn(List.of());

        var patterns = patientService.getConsumptionPatterns(patientId, nutritionistId);

        assertNotNull(patterns);
        assertEquals(14, patterns.periodDays());
        assertEquals(0, patterns.totalLoggedMeals());
        assertEquals(0.0, patterns.dailyAverageMeals());
        assertTrue(patterns.frequentOffPlanFoods().isEmpty());
        assertFalse(patterns.observedPatterns().isEmpty());
    }

    @Test
    void getConsumptionPatterns_withExtractions_identifiesOffPlanFoodsAndPatterns() {
        UUID patientId = samplePatient.getId();
        UUID extraction1Id = UUID.randomUUID();
        UUID extraction2Id = UUID.randomUUID();

        when(patientRepository.findByIdAndNutritionistId(patientId, nutritionistId))
                .thenReturn(Optional.of(samplePatient));

        var ext1 = MealExtraction.builder()
                .id(extraction1Id)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .episodeId(UUID.randomUUID())
                .messageId(UUID.randomUUID())
                .extractionRaw("Iogurte grego com mel")
                .mealLabel("Lanche tarde")
                .totalKcal(new BigDecimal("220"))
                .totalProt(new BigDecimal("15"))
                .extractedAt(java.time.LocalDateTime.now().minusDays(2).withHour(15))
                .build();

        var ext2 = MealExtraction.builder()
                .id(extraction2Id)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .episodeId(UUID.randomUUID())
                .messageId(UUID.randomUUID())
                .extractionRaw("Iogurte grego com chia")
                .mealLabel("Lanche tarde")
                .totalKcal(new BigDecimal("210"))
                .totalProt(new BigDecimal("14"))
                .extractedAt(java.time.LocalDateTime.now().minusDays(1).withHour(15))
                .build();

        when(mealExtractionRepository.findByPatientIdAndNutritionistIdAndExtractedAtBetween(
                eq(patientId), eq(nutritionistId), any(), any()))
                .thenReturn(List.of(ext1, ext2));

        var item1 = ExtractionItem.builder()
                .id(UUID.randomUUID())
                .extractionId(extraction1Id)
                .name("Iogurte grego")
                .grams(new BigDecimal("150"))
                .kcal(new BigDecimal("180"))
                .prot(new BigDecimal("12"))
                .carb(new BigDecimal("8"))
                .fat(new BigDecimal("4"))
                .build();

        var item2 = ExtractionItem.builder()
                .id(UUID.randomUUID())
                .extractionId(extraction2Id)
                .name("Iogurte grego")
                .grams(new BigDecimal("150"))
                .kcal(new BigDecimal("180"))
                .prot(new BigDecimal("12"))
                .carb(new BigDecimal("8"))
                .fat(new BigDecimal("4"))
                .build();

        when(extractionItemRepository.findByExtractionIdIn(anyList()))
                .thenReturn(List.of(item1, item2));

        when(episodeRepository.findFirstByPatientIdAndNutritionistIdAndEndDateIsNullOrderByStartDateDesc(patientId, nutritionistId))
                .thenReturn(Optional.empty());

        var patterns = patientService.getConsumptionPatterns(patientId, nutritionistId);

        assertNotNull(patterns);
        assertEquals(2, patterns.totalLoggedMeals());
        assertEquals(1, patterns.frequentOffPlanFoods().size());

        var offPlan = patterns.frequentOffPlanFoods().get(0);
        assertEquals("Iogurte grego", offPlan.foodName());
        assertEquals(2, offPlan.consumptionCount());
        assertEquals("Lanche tarde", offPlan.commonMealLabel());
        assertEquals(new BigDecimal("150"), offPlan.typicalGrams());
        assertEquals(new BigDecimal("180"), offPlan.typicalKcal());
        assertFalse(patterns.observedPatterns().isEmpty());
    }
}
