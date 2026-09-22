package com.compas.api.repository;

import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.model.PatientStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;

    private UUID nutritionistId1;
    private UUID nutritionistId2;

    @BeforeEach
    void setUp() {
        patientRepository.deleteAll();
        nutritionistId1 = UUID.randomUUID();
        nutritionistId2 = UUID.randomUUID();
    }

    private Patient createPatient(UUID nutritionistId, String name, PatientStatus status, Boolean active) {
        return Patient.builder()
                .nutritionistId(nutritionistId)
                .name(name)
                .age(30)
                .objective(PatientObjective.EMAGRECIMENTO)
                .status(status != null ? status : PatientStatus.ONTRACK)
                .weight(new BigDecimal("75.00"))
                .active(active != null ? active : true)
                .build();
    }

    @Test
    void findByNutritionistId_returnsOnlyThatNutritionistsPatients() {
        // Given: two nutritionists with patients
        Patient p1 = createPatient(nutritionistId1, "Maria Silva", null, null);
        Patient p2 = createPatient(nutritionistId1, "José Santos", null, null);
        Patient p3 = createPatient(nutritionistId2, "Ana Lima", null, null);

        patientRepository.save(p1);
        patientRepository.save(p2);
        patientRepository.save(p3);

        // When: query by nutritionist 1
        Page<Patient> result = patientRepository.findByNutritionistId(
                nutritionistId1, PageRequest.of(0, 20));

        // Then: only nutritionist 1's patients returned
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream().allMatch(p -> p.getNutritionistId().equals(nutritionistId1)));
    }

    @Test
    void findByIdAndNutritionistId_returnsEmptyForWrongNutritionist() {
        // Given: patient belongs to nutritionist 1
        Patient p = patientRepository.save(createPatient(nutritionistId1, "Maria Silva", null, null));

        // When: query with wrong nutritionist ID
        Optional<Patient> result = patientRepository.findByIdAndNutritionistId(p.getId(), nutritionistId2);

        // Then: empty result (data isolation, D-11)
        assertTrue(result.isEmpty());
    }

    @Test
    void findByIdAndNutritionistId_returnsPatientForCorrectNutritionist() {
        // Given: patient belongs to nutritionist 1
        Patient p = patientRepository.save(createPatient(nutritionistId1, "Maria Silva", null, null));

        // When: query with correct nutritionist ID
        Optional<Patient> result = patientRepository.findByIdAndNutritionistId(p.getId(), nutritionistId1);

        // Then: patient found
        assertTrue(result.isPresent());
        assertEquals(p.getId(), result.get().getId());
    }

    @Test
    void findByNutritionistIdAndActive_filtersCorrectly() {
        // Given: one active and one inactive patient for same nutritionist
        patientRepository.save(createPatient(nutritionistId1, "Maria Silva", null, true));
        patientRepository.save(createPatient(nutritionistId1, "José Santos", null, false));
        patientRepository.save(createPatient(nutritionistId2, "Ana Lima", null, true));

        // When: filter for active patients only
        Page<Patient> activeResult = patientRepository.findByNutritionistIdAndActive(
                nutritionistId1, true, PageRequest.of(0, 20));

        // Then: only active patients for nutritionist 1
        assertEquals(1, activeResult.getTotalElements());
        assertEquals("Maria Silva", activeResult.getContent().get(0).getName());
        assertTrue(activeResult.getContent().get(0).getActive());

        // When: filter for inactive patients only
        Page<Patient> inactiveResult = patientRepository.findByNutritionistIdAndActive(
                nutritionistId1, false, PageRequest.of(0, 20));

        // Then: only inactive patients
        assertEquals(1, inactiveResult.getTotalElements());
        assertEquals("José Santos", inactiveResult.getContent().get(0).getName());
        assertFalse(inactiveResult.getContent().get(0).getActive());
    }

    @Test
    void findByNutritionistIdAndStatus_filtersCorrectly() {
        // Given: patients with different statuses
        patientRepository.save(createPatient(nutritionistId1, "Maria Silva", PatientStatus.ONTRACK, null));
        patientRepository.save(createPatient(nutritionistId1, "José Santos", PatientStatus.WARNING, null));
        patientRepository.save(createPatient(nutritionistId1, "Ana Lima", PatientStatus.DANGER, null));

        // When: filter by WARNING status
        List<Patient> result = patientRepository.findByNutritionistIdAndStatus(
                nutritionistId1, PatientStatus.WARNING);

        // Then: only warning patients
        assertEquals(1, result.size());
        assertEquals("José Santos", result.get(0).getName());
    }

    @Test
    void findByNutritionistIdWithFilters_searchByName() {
        // Given: patients with different names
        patientRepository.save(createPatient(nutritionistId1, "Maria Silva", PatientStatus.ONTRACK, true));
        patientRepository.save(createPatient(nutritionistId1, "José Santos", PatientStatus.WARNING, true));
        patientRepository.save(createPatient(nutritionistId1, "Maria Costa", PatientStatus.DANGER, true));

        // When: search by "maria" (case-insensitive)
        Page<Patient> result = patientRepository.findByNutritionistIdWithFilters(
                nutritionistId1, "maria", null, null, null, PageRequest.of(0, 20));

        // Then: both "Maria" patients found
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findByNutritionistIdWithFilters_combinedStatusAndActive() {
        // Given: patients with different statuses and active flags
        patientRepository.save(createPatient(nutritionistId1, "Maria Silva", PatientStatus.ONTRACK, true));
        patientRepository.save(createPatient(nutritionistId1, "José Santos", PatientStatus.WARNING, true));
        patientRepository.save(createPatient(nutritionistId1, "Ana Lima", PatientStatus.ONTRACK, false));

        // When: filter by ONTRACK + active=true
        Page<Patient> result = patientRepository.findByNutritionistIdWithFilters(
                nutritionistId1, null, PatientStatus.ONTRACK, null, true, PageRequest.of(0, 20));

        // Then: only active on-track patients
        assertEquals(1, result.getTotalElements());
        assertEquals("Maria Silva", result.getContent().get(0).getName());
    }

    @Test
    void patient_softDelete_setsActiveFalse() {
        // Given: a saved patient
        Patient p = patientRepository.save(createPatient(nutritionistId1, "Maria Silva", null, true));
        assertTrue(p.getActive());

        // When: soft delete
        p.softDelete();
        patientRepository.save(p);

        // Then: active is false
        Patient reloaded = patientRepository.findById(p.getId()).orElseThrow();
        assertFalse(reloaded.getActive());
    }

    @Test
    void patient_reactivate_setsActiveTrue() {
        // Given: an inactive patient
        Patient p = patientRepository.save(createPatient(nutritionistId1, "Maria Silva", null, false));
        assertFalse(p.getActive());

        // When: reactivate
        p.reactivate();
        patientRepository.save(p);

        // Then: active is true
        Patient reloaded = patientRepository.findById(p.getId()).orElseThrow();
        assertTrue(reloaded.getActive());
    }

    @Test
    void patient_prePersist_computesInitials() {
        // Given: a patient with a full name
        Patient p = Patient.builder()
                .nutritionistId(nutritionistId1)
                .name("Maria Silva")
                .age(30)
                .objective(PatientObjective.EMAGRECIMENTO)
                .weight(new BigDecimal("75.00"))
                .build();

        // When: save triggers @PrePersist
        Patient saved = patientRepository.save(p);

        // Then: initials computed from name
        assertEquals("MS", saved.getInitials());
    }

    @Test
    void patient_defaults_setCorrectly() {
        // Given: a patient with minimal fields
        Patient p = Patient.builder()
                .nutritionistId(nutritionistId1)
                .name("Test Patient")
                .objective(PatientObjective.SAUDE_GERAL)
                .build();

        // When: save triggers @PrePersist
        Patient saved = patientRepository.save(p);

        // Then: defaults are applied
        assertEquals(PatientStatus.ONTRACK, saved.getStatus());
        assertTrue(saved.getActive());
        assertEquals(80, saved.getAdherence());
        assertEquals(0, saved.getWeightDelta().compareTo(BigDecimal.ZERO));
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}