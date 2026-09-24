package com.compas.api.service;

import com.compas.api.dto.prescription.CreatePrescriptionRequest;
import com.compas.api.dto.prescription.PrescriptionCatalogItemResponse;
import com.compas.api.dto.prescription.PrescriptionItemRequest;
import com.compas.api.dto.prescription.PrescriptionResponse;
import com.compas.api.dto.prescription.UpdatePrescriptionRequest;
import com.compas.api.exception.ResourceNotFoundException;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.Patient;
import com.compas.api.model.Prescription;
import com.compas.api.model.PrescriptionCategory;
import com.compas.api.model.PrescriptionItem;
import com.compas.api.model.PrescriptionStatus;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.PrescriptionItemRepository;
import com.compas.api.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PrescriptionItemRepository prescriptionItemRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private NutritionistRepository nutritionistRepository;

    @InjectMocks
    private PrescriptionService prescriptionService;

    private UUID nutritionistId;
    private UUID patientId;
    private Patient patient;
    private Nutritionist nutritionist;

    @BeforeEach
    void setUp() {
        nutritionistId = UUID.randomUUID();
        patientId = UUID.randomUUID();

        patient = Patient.builder()
                .id(patientId)
                .nutritionistId(nutritionistId)
                .name("Carlos Alberto")
                .build();

        nutritionist = Nutritionist.builder()
                .id(nutritionistId)
                .name("Dra. Paula Nutricionista")
                .professionalName("Dra. Paula Silva")
                .crn("12345")
                .crnRegional("SP")
                .specialty("Nutrição Clínica e Esportiva")
                .build();
    }

    @Test
    @DisplayName("listPrescriptions returns mapped responses for patient")
    void listPrescriptions_returnsPrescriptions() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        UUID prescriptionId = UUID.randomUUID();
        Prescription p = Prescription.builder()
                .id(prescriptionId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .title("Prescrição Inicial")
                .status(PrescriptionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        PrescriptionItem item = PrescriptionItem.builder()
                .id(UUID.randomUUID())
                .prescriptionId(prescriptionId)
                .nutritionistId(nutritionistId)
                .name("Creatina")
                .category(PrescriptionCategory.SUPPLEMENT)
                .dosage("5g")
                .form("Pó")
                .timing("Pós-treino")
                .duration("Uso contínuo")
                .isContinuous(true)
                .displayOrder(0)
                .build();

        when(prescriptionRepository.findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(patientId, nutritionistId))
                .thenReturn(List.of(p));
        when(prescriptionItemRepository.findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
                prescriptionId, nutritionistId)).thenReturn(List.of(item));

        List<PrescriptionResponse> result = prescriptionService.listPrescriptions(nutritionistId, patientId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Prescrição Inicial", result.get(0).title());
        assertEquals(1, result.get(0).items().size());
        assertEquals("Creatina", result.get(0).items().get(0).name());
        assertTrue(result.get(0).whatsappMessage().contains("Creatina"));
    }

    @Test
    @DisplayName("getPrescription throws ResourceNotFoundException when patient belongs to another nutritionist")
    void getPrescription_alienPatient_throws() {
        UUID alienNutri = UUID.randomUUID();
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        assertThrows(ResourceNotFoundException.class, () ->
                prescriptionService.getPrescription(alienNutri, patientId, UUID.randomUUID())
        );
    }

    @Test
    @DisplayName("createPrescription creates prescription, archives previous active, and saves items")
    void createPrescription_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        Prescription oldActive = Prescription.builder()
                .id(UUID.randomUUID())
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .status(PrescriptionStatus.ACTIVE)
                .build();
        when(prescriptionRepository.findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(patientId, nutritionistId))
                .thenReturn(List.of(oldActive));

        UUID newId = UUID.randomUUID();
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> {
            Prescription arg = inv.getArgument(0);
            arg.setId(newId);
            return arg;
        });

        when(prescriptionItemRepository.save(any(PrescriptionItem.class))).thenAnswer(inv -> {
            PrescriptionItem arg = inv.getArgument(0);
            arg.setId(UUID.randomUUID());
            return arg;
        });

        CreatePrescriptionRequest request = new CreatePrescriptionRequest(
                "Suplementação Hipertrofia",
                "Tomar conforme horários",
                PrescriptionStatus.ACTIVE,
                List.of(
                        new PrescriptionItemRequest(
                                "Creatina Monohidratada",
                                PrescriptionCategory.SUPPLEMENT,
                                "5g",
                                "Pó",
                                "Pós-treino",
                                "Uso contínuo",
                                true,
                                "Com água",
                                0
                        ),
                        new PrescriptionItemRequest(
                                "Ômega 3",
                                PrescriptionCategory.SUPPLEMENT,
                                "2 cápsulas",
                                "Cápsula",
                                "Com almoço",
                                "Uso contínuo",
                                true,
                                "IFOS",
                                1
                        )
                )
        );

        PrescriptionResponse response = prescriptionService.createPrescription(nutritionistId, patientId, request);

        assertNotNull(response);
        assertEquals("Suplementação Hipertrofia", response.title());
        assertEquals(2, response.items().size());
        assertEquals(PrescriptionStatus.ARCHIVED, oldActive.getStatus());
        assertTrue(response.whatsappMessage().contains("Carlos Alberto"));
    }

    @Test
    @DisplayName("updatePrescription replaces items and updates details")
    void updatePrescription_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        UUID prescriptionId = UUID.randomUUID();
        Prescription p = Prescription.builder()
                .id(prescriptionId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .title("Antigo Título")
                .status(PrescriptionStatus.ACTIVE)
                .build();
        when(prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId))
                .thenReturn(Optional.of(p));
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(inv -> inv.getArgument(0));

        when(prescriptionItemRepository.save(any(PrescriptionItem.class))).thenAnswer(inv -> {
            PrescriptionItem it = inv.getArgument(0);
            it.setId(UUID.randomUUID());
            return it;
        });

        UpdatePrescriptionRequest request = new UpdatePrescriptionRequest(
                "Novo Título Atualizado",
                "Novas notas",
                PrescriptionStatus.ACTIVE,
                List.of(
                        new PrescriptionItemRequest(
                                "Whey Protein",
                                PrescriptionCategory.SUPPLEMENT,
                                "30g",
                                "Pó",
                                "Lanche da tarde",
                                "60 dias",
                                false,
                                "Bater com banana",
                                0
                        )
                )
        );

        PrescriptionResponse updated = prescriptionService.updatePrescription(
                nutritionistId, patientId, prescriptionId, request);

        assertNotNull(updated);
        assertEquals("Novo Título Atualizado", updated.title());
        assertEquals(1, updated.items().size());
        verify(prescriptionItemRepository).deleteByPrescriptionIdAndNutritionistId(prescriptionId, nutritionistId);
    }

    @Test
    @DisplayName("deletePrescription removes items and prescription entity")
    void deletePrescription_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

        UUID prescriptionId = UUID.randomUUID();
        Prescription p = Prescription.builder()
                .id(prescriptionId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .title("Prescrição a Deletar")
                .build();
        when(prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId))
                .thenReturn(Optional.of(p));

        prescriptionService.deletePrescription(nutritionistId, patientId, prescriptionId);

        verify(prescriptionItemRepository).deleteByPrescriptionIdAndNutritionistId(prescriptionId, nutritionistId);
        verify(prescriptionRepository).delete(p);
    }

    @Test
    @DisplayName("generatePrescriptionPdf creates a valid non-empty PDF document with %PDF magic header")
    void generatePrescriptionPdf_success() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));
        when(nutritionistRepository.findById(nutritionistId)).thenReturn(Optional.of(nutritionist));

        UUID prescriptionId = UUID.randomUUID();
        Prescription p = Prescription.builder()
                .id(prescriptionId)
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .title("Receituário de Suplementação")
                .notes("Ingerir os suplementos com abundância de líquidos.")
                .createdAt(LocalDateTime.now())
                .build();
        when(prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId))
                .thenReturn(Optional.of(p));

        PrescriptionItem item = PrescriptionItem.builder()
                .id(UUID.randomUUID())
                .prescriptionId(prescriptionId)
                .nutritionistId(nutritionistId)
                .name("Creatina Monohidratada")
                .dosage("5g")
                .form("Pó")
                .timing("Pós-treino")
                .duration("Uso contínuo")
                .instructions("Diluir em 200ml de água fria.")
                .build();
        when(prescriptionItemRepository.findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
                prescriptionId, nutritionistId)).thenReturn(List.of(item));

        byte[] pdfBytes = prescriptionService.generatePrescriptionPdf(nutritionistId, patientId, prescriptionId);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF deve conter conteúdo gerado");
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertEquals("%PDF-", magicHeader, "Arquivo deve ter o cabeçalho mágico de PDF");
    }

    @Test
    @DisplayName("getSupplementLibrary returns clinical presets list")
    void getSupplementLibrary_returnsPresets() {
        List<PrescriptionCatalogItemResponse> library = prescriptionService.getSupplementLibrary();

        assertNotNull(library);
        assertTrue(library.size() >= 10);
        assertTrue(library.stream().anyMatch(item -> item.name().contains("Creatina")));
        assertTrue(library.stream().anyMatch(item -> item.name().contains("Ômega 3")));
        assertTrue(library.stream().anyMatch(item -> item.name().contains("Vitamina D3")));
    }
}
