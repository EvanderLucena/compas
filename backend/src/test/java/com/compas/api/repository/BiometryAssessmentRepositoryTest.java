package com.compas.api.repository;

import com.compas.api.model.BiometryAssessment;
import com.compas.api.model.BiometryPerimetry;
import com.compas.api.model.BiometrySkinfold;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class BiometryAssessmentRepositoryTest {

    @Autowired
    private BiometryAssessmentRepository assessmentRepository;

    @Autowired
    private BiometrySkinfoldRepository skinfoldRepository;

    @Autowired
    private BiometryPerimetryRepository perimetryRepository;

    private UUID nutritionistId1;
    private UUID nutritionistId2;
    private UUID patientId1;
    private UUID patientId2;
    private UUID episodeId1;
    private UUID episodeId2;

    @BeforeEach
    void setUp() {
        skinfoldRepository.deleteAll();
        perimetryRepository.deleteAll();
        assessmentRepository.deleteAll();
        nutritionistId1 = UUID.randomUUID();
        nutritionistId2 = UUID.randomUUID();
        patientId1 = UUID.randomUUID();
        patientId2 = UUID.randomUUID();
        episodeId1 = UUID.randomUUID();
        episodeId2 = UUID.randomUUID();
    }

    private BiometryAssessment createAssessment(UUID patientId, UUID episodeId, UUID nutritionistId, LocalDate date, BigDecimal weight, BigDecimal bodyFat) {
        return BiometryAssessment.builder()
                .patientId(patientId)
                .episodeId(episodeId)
                .nutritionistId(nutritionistId)
                .assessmentDate(date)
                .weight(weight)
                .bodyFatPercent(bodyFat)
                .build();
    }

    @Test
    void findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc_returnsChronologicalOrder() {
        BiometryAssessment a1 = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        BiometryAssessment a2 = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 20), new BigDecimal("74.50"), new BigDecimal("21.80")));
        BiometryAssessment a3 = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 15), new BigDecimal("74.80"), new BigDecimal("22.10")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId1, nutritionistId1);

        assertEquals(3, result.size());
        assertEquals(LocalDate.of(2025, 1, 10), result.get(0).getAssessmentDate());
        assertEquals(LocalDate.of(2025, 1, 15), result.get(1).getAssessmentDate());
        assertEquals(LocalDate.of(2025, 1, 20), result.get(2).getAssessmentDate());
    }

    @Test
    void findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc_scopesToNutritionist() {
        assessmentRepository.save(createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        assessmentRepository.save(createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 20), new BigDecimal("74.50"), new BigDecimal("21.80")));
        assessmentRepository.save(createAssessment(patientId2, episodeId1, nutritionistId2, LocalDate.of(2025, 1, 15), new BigDecimal("80.00"), new BigDecimal("25.00")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId1, nutritionistId1);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(a -> a.getNutritionistId().equals(nutritionistId1)));
    }

    @Test
    void findByIdAndNutritionistId_returnsEmptyForWrongNutritionist() {
        BiometryAssessment a = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));

        Optional<BiometryAssessment> result = assessmentRepository.findByIdAndNutritionistId(a.getId(), nutritionistId2);

        assertTrue(result.isEmpty());
    }

    @Test
    void findByIdAndNutritionistId_returnsAssessmentForCorrectNutritionist() {
        BiometryAssessment a = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));

        Optional<BiometryAssessment> result = assessmentRepository.findByIdAndNutritionistId(a.getId(), nutritionistId1);

        assertTrue(result.isPresent());
        assertEquals(a.getId(), result.get().getId());
    }

    @Test
    void findByEpisodeIdAndNutritionistId_scopesToSingleEpisode() {
        assessmentRepository.save(createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));
        assessmentRepository.save(createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 15), new BigDecimal("74.80"), new BigDecimal("22.10")));
        assessmentRepository.save(createAssessment(patientId2, episodeId2, nutritionistId1, LocalDate.of(2025, 1, 12), new BigDecimal("80.00"), new BigDecimal("25.00")));

        List<BiometryAssessment> result = assessmentRepository.findByEpisodeIdAndNutritionistIdOrderByAssessmentDateAsc(episodeId1, nutritionistId1);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(a -> a.getEpisodeId().equals(episodeId1)));
    }

    @Test
    void skinfold_and_perimetry_persistWithAssessment() {
        BiometryAssessment a = createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50"));

        BiometrySkinfold skinfold = BiometrySkinfold.builder()
                .assessment(a)
                .nutritionistId(nutritionistId1)
                .measureKey("triceps")
                .valueMm(new BigDecimal("12.50"))
                .sortOrder(1)
                .build();

        BiometryPerimetry perimetry = BiometryPerimetry.builder()
                .assessment(a)
                .nutritionistId(nutritionistId1)
                .measureKey("cintura")
                .valueCm(new BigDecimal("82.30"))
                .sortOrder(1)
                .build();

        a.setSkinfolds(List.of(skinfold));
        a.setPerimetries(List.of(perimetry));

        BiometryAssessment saved = assessmentRepository.save(a);

        List<BiometrySkinfold> skinfolds = skinfoldRepository
                .findByAssessmentIdAndNutritionistIdOrderBySortOrder(saved.getId(), nutritionistId1);
        List<BiometryPerimetry> perimetries = perimetryRepository
                .findByAssessmentIdAndNutritionistIdOrderBySortOrder(saved.getId(), nutritionistId1);

        assertEquals(1, skinfolds.size());
        assertEquals("triceps", skinfolds.get(0).getMeasureKey());
        assertEquals(0, new BigDecimal("12.50").compareTo(skinfolds.get(0).getValueMm()));
        assertEquals(nutritionistId1, skinfolds.get(0).getNutritionistId());

        assertEquals(1, perimetries.size());
        assertEquals("cintura", perimetries.get(0).getMeasureKey());
        assertEquals(0, new BigDecimal("82.30").compareTo(perimetries.get(0).getValueCm()));
        assertEquals(nutritionistId1, perimetries.get(0).getNutritionistId());
    }

    @Test
    void findByIdAndPatientIdAndNutritionistId_scopesToPatientAndNutritionist() {
        BiometryAssessment a = assessmentRepository.save(
                createAssessment(patientId1, episodeId1, nutritionistId1, LocalDate.of(2025, 1, 10), new BigDecimal("75.00"), new BigDecimal("22.50")));

        assertTrue(assessmentRepository.findByIdAndPatientIdAndNutritionistId(a.getId(), patientId1, nutritionistId1).isPresent());
        assertTrue(assessmentRepository.findByIdAndPatientIdAndNutritionistId(a.getId(), patientId2, nutritionistId1).isEmpty());
        assertTrue(assessmentRepository.findByIdAndPatientIdAndNutritionistId(a.getId(), patientId1, nutritionistId2).isEmpty());
    }
}
