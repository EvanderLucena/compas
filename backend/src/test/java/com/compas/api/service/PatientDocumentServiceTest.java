package com.compas.api.service;

import com.compas.api.dto.biometry.BiometryAssessmentResponse;
import com.compas.api.dto.biometry.BiometryEvolutionSummaryResponse;
import com.compas.api.dto.biometry.PerimetryDeltaResponse;
import com.compas.api.dto.plan.ExtraResponse;
import com.compas.api.dto.plan.MealFoodResponse;
import com.compas.api.dto.plan.MealOptionResponse;
import com.compas.api.dto.plan.MealSlotResponse;
import com.compas.api.dto.plan.PlanResponse;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.model.UserRole;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientDocumentServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NutritionistRepository nutritionistRepository;

    @Mock
    private MealPlanService mealPlanService;

    @Mock
    private BiometryService biometryService;

    @InjectMocks
    private PatientDocumentService documentService;

    private UUID nutritionistId;
    private UUID patientId;
    private Nutritionist nutritionist;
    private Patient patient;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();

        nutritionist = Nutritionist.builder()
                .id(nutritionistId)
                .name("Camila Santos")
                .professionalName("Dra. Camila Santos")
                .email("camila@exemplo.com")
                .crn("12345")
                .crnRegional("CRN-3")
                .specialty("Nutrição Clínica e Esportiva")
                .role(UserRole.NUTRITIONIST)
                .build();

        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Carlos Eduardo")
                .age(29)
                .heightCm(178)
                .sex("M")
                .objective(PatientObjective.HIPERTROFIA)
                .build();
    }

    @Test
    @DisplayName("generateMealPlanPdf should create a valid PDF with header, meals and macros")
    void generateMealPlanPdf_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));

        MealFoodResponse item1 = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Ovos mexidos",
                BigDecimal.valueOf(3), "unidades", "Frito com azeite",
                BigDecimal.valueOf(210), BigDecimal.valueOf(18), BigDecimal.valueOf(2), BigDecimal.valueOf(15)
        );

        MealOptionResponse option1 = new MealOptionResponse(
                UUID.randomUUID(), "Opção 1 · Clássico", List.of(item1)
        );

        MealSlotResponse slot1 = new MealSlotResponse(
                UUID.randomUUID(), "Café da manhã", "07:30", List.of(option1)
        );

        ExtraResponse extra1 = new ExtraResponse(
                UUID.randomUUID(), "Chocolate 70%", "20g",
                BigDecimal.valueOf(110), BigDecimal.valueOf(2), BigDecimal.valueOf(10), BigDecimal.valueOf(8)
        );

        PlanResponse plan = new PlanResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Plano Hipertrofia Fase 1",
                "Beber no mínimo 3L de água por dia. Evitar refrigerantes.",
                BigDecimal.valueOf(2500), BigDecimal.valueOf(160), BigDecimal.valueOf(300), BigDecimal.valueOf(70),
                List.of(slot1), List.of(extra1), LocalDateTime.now(), LocalDateTime.now()
        );

        when(mealPlanService.getPlan(nutritionistId, patientId)).thenReturn(plan);

        byte[] pdfBytes = documentService.generateMealPlanPdf(nutritionistId, patientId);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF should not be empty");

        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", magicHeader, "File must have standard PDF magic bytes header");
    }

    @Test
    @DisplayName("generateMealPlanPdf should throw ResourceNotFoundException when patient belongs to another nutritionist")
    void generateMealPlanPdf_foreignPatient_throwsException() {
        UUID otherNutriId = UUID.randomUUID();
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        assertThrows(ResourceNotFoundException.class, () ->
                documentService.generateMealPlanPdf(otherNutriId, patientId)
        );
        verifyNoInteractions(mealPlanService);
    }

    @Test
    @DisplayName("generateGroceryListPdf should categorize items by section and produce valid PDF")
    void generateGroceryListPdf_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));

        MealFoodResponse fruit = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Banana prata",
                BigDecimal.valueOf(2), "unidades", "",
                BigDecimal.valueOf(140), BigDecimal.valueOf(2), BigDecimal.valueOf(35), BigDecimal.ZERO
        );
        MealFoodResponse meat = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Peito de frango grelhado",
                BigDecimal.valueOf(150), "g", "",
                BigDecimal.valueOf(240), BigDecimal.valueOf(45), BigDecimal.ZERO, BigDecimal.valueOf(5)
        );
        MealFoodResponse grain = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Arroz integral",
                BigDecimal.valueOf(120), "g", "",
                BigDecimal.valueOf(150), BigDecimal.valueOf(3), BigDecimal.valueOf(32), BigDecimal.valueOf(1)
        );
        MealFoodResponse dairy = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Iogurte natural",
                BigDecimal.valueOf(170), "g", "",
                BigDecimal.valueOf(90), BigDecimal.valueOf(7), BigDecimal.valueOf(9), BigDecimal.valueOf(3)
        );
        MealFoodResponse supplement = new MealFoodResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Whey protein isolado",
                BigDecimal.valueOf(30), "g", "",
                BigDecimal.valueOf(120), BigDecimal.valueOf(27), BigDecimal.valueOf(1), BigDecimal.ZERO
        );

        MealOptionResponse option = new MealOptionResponse(
                UUID.randomUUID(), "Opção 1 · Clássico",
                List.of(fruit, meat, grain, dairy, supplement)
        );

        MealSlotResponse slot = new MealSlotResponse(
                UUID.randomUUID(), "Almoço e Lanche", "12:00", List.of(option)
        );

        PlanResponse plan = new PlanResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Plano Completo",
                null, BigDecimal.valueOf(2000), BigDecimal.valueOf(150), BigDecimal.valueOf(220), BigDecimal.valueOf(50),
                List.of(slot), List.of(), LocalDateTime.now(), LocalDateTime.now()
        );

        when(mealPlanService.getPlan(nutritionistId, patientId)).thenReturn(plan);

        byte[] pdfBytes = documentService.generateGroceryListPdf(nutritionistId, patientId);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", magicHeader);
    }

    @Test
    @DisplayName("generateBiometryReportPdf should create valid PDF with summary, tables and perimetry deltas")
    void generateBiometryReportPdf_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));

        PerimetryDeltaResponse p1 = new PerimetryDeltaResponse(
                "cintura", "Cintura", BigDecimal.valueOf(88), BigDecimal.valueOf(82), BigDecimal.valueOf(-6)
        );
        PerimetryDeltaResponse p2 = new PerimetryDeltaResponse(
                "abdomen", "Abdômen", BigDecimal.valueOf(94), BigDecimal.valueOf(87), BigDecimal.valueOf(-7)
        );

        BiometryEvolutionSummaryResponse summary = new BiometryEvolutionSummaryResponse(
                3, LocalDate.of(2026, 1, 15), LocalDate.of(2026, 9, 20),
                BigDecimal.valueOf(84.0), BigDecimal.valueOf(78.5), BigDecimal.valueOf(-5.5),
                BigDecimal.valueOf(22.0), BigDecimal.valueOf(16.5), BigDecimal.valueOf(-5.5),
                BigDecimal.valueOf(65.5), BigDecimal.valueOf(65.5), BigDecimal.ZERO,
                BigDecimal.valueOf(18.5), BigDecimal.valueOf(13.0), BigDecimal.valueOf(-5.5),
                List.of(p1, p2),
                "Excelente evolução na redução de massa gorda.",
                "Parabéns pelo progresso!"
        );

        BiometryAssessmentResponse a1 = new BiometryAssessmentResponse(
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2026, 1, 15),
                BigDecimal.valueOf(84.0), BigDecimal.valueOf(22.0), BigDecimal.valueOf(65.5),
                BigDecimal.valueOf(55.0), 7, 1850, "Início do acompanhamento",
                List.of(), List.of()
        );

        BiometryAssessmentResponse a2 = new BiometryAssessmentResponse(
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2026, 9, 20),
                BigDecimal.valueOf(78.5), BigDecimal.valueOf(16.5), BigDecimal.valueOf(65.5),
                BigDecimal.valueOf(58.0), 5, 1780, "Avaliação de controle",
                List.of(), List.of()
        );

        when(biometryService.getBiometryEvolutionSummary(nutritionistId, patientId)).thenReturn(summary);
        when(biometryService.listAssessments(nutritionistId, patientId)).thenReturn(List.of(a1, a2));

        byte[] pdfBytes = documentService.generateBiometryReportPdf(nutritionistId, patientId);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", magicHeader);
    }

    @Test
    @DisplayName("generateBiometryReportPdf should handle patient with zero assessments gracefully")
    void generateBiometryReportPdf_emptyAssessments_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));

        BiometryEvolutionSummaryResponse summary = new BiometryEvolutionSummaryResponse(
                0, null, null,
                null, null, null,
                null, null, null,
                null, null, null,
                null, null, null,
                List.of(), null, null
        );

        when(biometryService.getBiometryEvolutionSummary(nutritionistId, patientId)).thenReturn(summary);
        when(biometryService.listAssessments(nutritionistId, patientId)).thenReturn(List.of());

        byte[] pdfBytes = documentService.generateBiometryReportPdf(nutritionistId, patientId);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", magicHeader);
    }
}
