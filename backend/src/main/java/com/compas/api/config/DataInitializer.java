package com.compas.api.config;

import com.compas.api.auth.TenantContext;
import com.compas.api.model.BiometryAssessment;
import com.compas.api.model.Episode;
import com.compas.api.model.EpisodeHistoryEvent;
import com.compas.api.model.Food;
import com.compas.api.model.MealFood;
import com.compas.api.model.MealOption;
import com.compas.api.model.MealPlan;
import com.compas.api.model.MealSlot;
import com.compas.api.model.Nutritionist;
import com.compas.api.model.Patient;
import com.compas.api.model.PatientObjective;
import com.compas.api.model.PatientStatus;
import com.compas.api.model.PlanExtra;
import com.compas.api.model.UserRole;
import com.compas.api.repository.BiometryAssessmentRepository;
import com.compas.api.repository.EpisodeHistoryEventRepository;
import com.compas.api.repository.EpisodeRepository;
import com.compas.api.repository.FoodRepository;
import com.compas.api.repository.MealFoodRepository;
import com.compas.api.repository.MealOptionRepository;
import com.compas.api.repository.MealPlanRepository;
import com.compas.api.repository.MealSlotRepository;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.PlanExtraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final NutritionistRepository nutritionistRepository;
    private final PasswordEncoder passwordEncoder;
    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final FoodRepository foodRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealSlotRepository mealSlotRepository;
    private final MealOptionRepository mealOptionRepository;
    private final MealFoodRepository mealFoodRepository;
    private final PlanExtraRepository planExtraRepository;
    private final BiometryAssessmentRepository assessmentRepository;
    private final EpisodeHistoryEventRepository historyEventRepository;
    private final TransactionTemplate transactionTemplate;

    @Value("${compas.seed.admin.email:${nutriai.seed.admin.email:admin@compas.app}}")
    private String adminEmail;

    @Value("${compas.seed.admin.password:${nutriai.seed.admin.password:Admin123!}}")
    private String adminPassword;

    @Value("${compas.seed.admin.name:${nutriai.seed.admin.name:Admin Compas}}")
    private String adminName;

    public DataInitializer(
            NutritionistRepository nutritionistRepository,
            PasswordEncoder passwordEncoder,
            PatientRepository patientRepository,
            EpisodeRepository episodeRepository,
            FoodRepository foodRepository,
            MealPlanRepository mealPlanRepository,
            MealSlotRepository mealSlotRepository,
            MealOptionRepository mealOptionRepository,
            MealFoodRepository mealFoodRepository,
            PlanExtraRepository planExtraRepository,
            BiometryAssessmentRepository assessmentRepository,
            EpisodeHistoryEventRepository historyEventRepository,
            PlatformTransactionManager transactionManager) {
        this.nutritionistRepository = nutritionistRepository;
        this.passwordEncoder = passwordEncoder;
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.foodRepository = foodRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealSlotRepository = mealSlotRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.mealFoodRepository = mealFoodRepository;
        this.planExtraRepository = planExtraRepository;
        this.assessmentRepository = assessmentRepository;
        this.historyEventRepository = historyEventRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(String... args) {
        TenantContext.executeWithBypass(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                Nutritionist demo = ensureDemoNutritionist();
                List<Food> foods = ensureDemoFoods(demo.getId());
                if (!patientRepository.findAllByNutritionistId(demo.getId()).isEmpty()) {
                    ensureDemoHistoryCycle(demo.getId(), foods);
                    logger.info("Dev seed already has patients, skipping demo clinical data. Foods available: {}.", foods.size());
                    return;
                }

                List<Patient> patients = createDemoPatients(demo.getId());
                createDemoClinicalData(demo.getId(), patients, foods);
                ensureDemoHistoryCycle(demo.getId(), foods);
                logger.info("Dev seed created: {} patients, {} foods, plans, biometry and history.", patients.size(), foods.size());
            });
        });
    }

    private Nutritionist ensureDemoNutritionist() {
        return nutritionistRepository.findByEmail(adminEmail)
                .or(() -> nutritionistRepository.findByEmail("admin@nutriai.com"))
                .map(this::normalizeDemoNutritionist)
                .orElseGet(() -> nutritionistRepository.save(Nutritionist.builder()
                        .name(adminName)
                        .professionalName("Equipe Compas")
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .crn("00000")
                        .crnRegional("CRN-3")
                        .role(UserRole.NUTRITIONIST)
                        .emailVerified(true)
                        .onboardingCompleted(true)
                        .subscriptionTier("UNLIMITED")
                        .patientLimit(9999)
                        .build()));
    }

    private Nutritionist normalizeDemoNutritionist(Nutritionist nutritionist) {
        boolean changed = false;
        if ("Admin NutriAI".equals(nutritionist.getName())) {
            nutritionist.setName(adminName);
            changed = true;
        }
        if (nutritionist.getRole() != UserRole.NUTRITIONIST) {
            nutritionist.setRole(UserRole.NUTRITIONIST);
            changed = true;
        }
        if (!Boolean.TRUE.equals(nutritionist.getOnboardingCompleted())) {
            nutritionist.setOnboardingCompleted(true);
            changed = true;
        }
        if (!Boolean.TRUE.equals(nutritionist.getEmailVerified())) {
            nutritionist.setEmailVerified(true);
            changed = true;
        }
        if (!"UNLIMITED".equals(nutritionist.getSubscriptionTier())) {
            nutritionist.setSubscriptionTier("UNLIMITED");
            nutritionist.setPatientLimit(9999);
            changed = true;
        }
        return changed ? nutritionistRepository.save(nutritionist) : nutritionist;
    }

    private List<Food> ensureDemoFoods(UUID nutritionistId) {
        if (foodRepository.findByNutritionistId(nutritionistId, PageRequest.of(0, 1)).hasContent()) {
            return foodRepository.findByNutritionistId(nutritionistId, PageRequest.of(0, 50)).getContent();
        }
        return foodRepository.saveAll(List.of(
                food(nutritionistId, "Frango grelhado", "PROTEINA", "g", "150", "248", "46", "0", "5", "0"),
                food(nutritionistId, "Arroz branco", "CARBOIDRATO", "g", "120", "156", "3", "34", "0.4", "1"),
                food(nutritionistId, "Feijao carioca", "LEGUMINOSA", "g", "100", "76", "4.8", "13.6", "0.5", "8.5"),
                food(nutritionistId, "Batata doce", "CARBOIDRATO", "g", "180", "154", "2.9", "36", "0.2", "5.4"),
                food(nutritionistId, "Ovo cozido", "PROTEINA", "un", "2", "156", "12.6", "1.2", "10.6", "0"),
                food(nutritionistId, "Iogurte natural", "LATICINIO", "g", "170", "103", "6.1", "8", "5.6", "0"),
                food(nutritionistId, "Banana prata", "FRUTA", "un", "1", "89", "1.1", "23", "0.3", "2.6"),
                food(nutritionistId, "Aveia em flocos", "CEREAL", "g", "40", "156", "6.8", "26.5", "2.8", "4.1"),
                food(nutritionistId, "Salada verde", "VEGETAL", "g", "120", "28", "2", "5", "0.3", "3"),
                food(nutritionistId, "Azeite de oliva", "GORDURA", "ml", "10", "90", "0", "0", "10", "0")
        ));
    }

    private Food food(UUID nutritionistId, String name, String category, String unit, String amount,
            String kcal, String prot, String carb, String fat, String fiber) {
        return Food.builder()
                .nutritionistId(nutritionistId)
                .name(name)
                .category(category)
                .unit(unit)
                .referenceAmount(bd(amount))
                .kcal(bd(kcal))
                .prot(bd(prot))
                .carb(bd(carb))
                .fat(bd(fat))
                .fiber(bd(fiber))
                .portionLabel(amount + " " + unit)
                .usedCount(0)
                .build();
    }

    private List<Patient> createDemoPatients(UUID nutritionistId) {
        return patientRepository.saveAll(List.of(
                patient(nutritionistId, "Ana Carolina Lima", "AC", "1992-04-16", "F", 164,
                        PatientObjective.EMAGRECIMENTO, PatientStatus.WARNING, 87, "72.40", "-3.10", "retorno 7d"),
                patient(nutritionistId, "Bruno Martins", "BM", "1988-09-03", "M", 178,
                        PatientObjective.HIPERTROFIA, PatientStatus.ONTRACK, 93, "81.20", "1.80", "ganho massa"),
                patient(nutritionistId, "Carla Souza", "CS", "1976-12-28", "F", 158,
                        PatientObjective.CONTROLE_GLICEMICO, PatientStatus.DANGER, 61, "69.80", "0.90", "atenção"),
                patient(nutritionistId, "Diego Almeida", "DA", "1999-06-11", "M", 181,
                        PatientObjective.PERFORMANCE_ESPORTIVA, PatientStatus.ONTRACK, 91, "77.30", "-0.40", "corrida"),
                patient(nutritionistId, "Fernanda Ribeiro", "FR", "1984-02-19", "F", 169,
                        PatientObjective.REEDUCACAO_ALIMENTAR, PatientStatus.WARNING, 74, "84.60", "-1.20", "rotina")
        ));
    }

    private Patient patient(UUID nutritionistId, String name, String initials, String birthDate, String sex, int heightCm,
            PatientObjective objective, PatientStatus status, int adherence, String weight, String delta, String tag) {
        return Patient.builder()
                .nutritionistId(nutritionistId)
                .name(name)
                .initials(initials)
                .birthDate(LocalDate.parse(birthDate))
                .sex(sex)
                .heightCm(heightCm)
                .whatsapp("+5511999" + Math.abs(name.hashCode() % 1000000))
                .age(LocalDate.now().getYear() - LocalDate.parse(birthDate).getYear())
                .objective(objective)
                .status(status)
                .adherence(adherence)
                .weight(bd(weight))
                .weightDelta(bd(delta))
                .tag(tag)
                .active(true)
                .build();
    }

    private void createDemoClinicalData(UUID nutritionistId, List<Patient> patients, List<Food> foods) {
        for (int i = 0; i < patients.size(); i++) {
            Patient patient = patients.get(i);
            Episode episode = episodeRepository.save(Episode.builder()
                    .patientId(patient.getId())
                    .nutritionistId(nutritionistId)
                    .startDate(LocalDateTime.now().minusDays(42 - i * 3L))
                    .build());
            createAssessments(nutritionistId, patient, episode, i);
            if (i < 3) {
                createPlan(nutritionistId, episode, foods, i);
            }
        }
    }

    private void ensureDemoHistoryCycle(UUID nutritionistId, List<Food> foods) {
        Patient patient = patientRepository.findAllByNutritionistId(nutritionistId).stream()
                .filter(p -> "Ana Carolina Lima".equals(p.getName()))
                .findFirst()
                .orElse(null);
        if (patient == null) {
            return;
        }
        List<Episode> closedEpisodes = episodeRepository
                .findByPatientIdAndNutritionistIdAndEndDateIsNotNullOrderByStartDateDesc(patient.getId(), nutritionistId);
        if (!closedEpisodes.isEmpty()) {
            backfillHistoryCycleDetails(nutritionistId, patient, closedEpisodes.get(0), foods);
            return;
        }

        LocalDateTime start = LocalDateTime.now().minusMonths(8);
        LocalDateTime end = LocalDateTime.now().minusMonths(5).minusDays(10);
        Episode oldEpisode = episodeRepository.save(Episode.builder()
                .patientId(patient.getId())
                .nutritionistId(nutritionistId)
                .startDate(start)
                .endDate(end)
                .build());

        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .nutritionistId(nutritionistId)
                .episodeId(oldEpisode.getId())
                .eventType("EPISODE_OPENED")
                .eventAt(start)
                .title("Periodo iniciado")
                .description("Primeiro ciclo de acompanhamento da paciente.")
                .sourceRef("dev-seed-history")
                .metadataJson("{\"objective\":\"EMAGRECIMENTO\"}")
                .build());
        createHistoricalAssessments(nutritionistId, patient, oldEpisode, start);
        createPlan(nutritionistId, oldEpisode, foods, 0);
        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .nutritionistId(nutritionistId)
                .episodeId(oldEpisode.getId())
                .eventType("EPISODE_CLOSED")
                .eventAt(end)
                .title("Periodo encerrado")
                .description("Paciente pausou o acompanhamento apos o ciclo inicial.")
                .sourceRef("dev-seed-history")
                .metadataJson("{\"objective\":\"EMAGRECIMENTO\"}")
                .build());
    }

    private void backfillHistoryCycleDetails(UUID nutritionistId, Patient patient, Episode episode, List<Food> foods) {
        List<BiometryAssessment> assessments = assessmentRepository
                .findByEpisodeIdAndPatientIdAndNutritionistIdOrderByAssessmentDateAsc(
                        episode.getId(), patient.getId(), nutritionistId);
        if (assessments.isEmpty()) {
            createHistoricalAssessments(nutritionistId, patient, episode, episode.getStartDate());
        }

        if (mealPlanRepository.findByEpisodeIdAndNutritionistId(episode.getId(), nutritionistId).isEmpty()) {
            createPlan(nutritionistId, episode, foods, 0);
        }

        List<EpisodeHistoryEvent> events = historyEventRepository
                .findByEpisodeIdAndNutritionistIdOrderByEventAtAsc(episode.getId(), nutritionistId);
        boolean hasLifecycleEvents = events.stream().anyMatch(event -> "EPISODE_OPENED".equals(event.getEventType()))
                && events.stream().anyMatch(event -> "EPISODE_CLOSED".equals(event.getEventType()));
        if (!hasLifecycleEvents) {
            historyEventRepository.save(EpisodeHistoryEvent.builder()
                    .nutritionistId(nutritionistId)
                    .episodeId(episode.getId())
                    .eventType("EPISODE_OPENED")
                    .eventAt(episode.getStartDate())
                    .title("Periodo iniciado")
                    .description("Primeiro ciclo de acompanhamento da paciente.")
                    .sourceRef("dev-seed-history")
                    .metadataJson("{\"objective\":\"EMAGRECIMENTO\"}")
                    .build());
            historyEventRepository.save(EpisodeHistoryEvent.builder()
                    .nutritionistId(nutritionistId)
                    .episodeId(episode.getId())
                    .eventType("EPISODE_CLOSED")
                    .eventAt(episode.getEndDate())
                    .title("Periodo encerrado")
                    .description("Paciente pausou o acompanhamento apos o ciclo inicial.")
                    .sourceRef("dev-seed-history")
                    .metadataJson("{\"objective\":\"EMAGRECIMENTO\"}")
                    .build());
        }
    }

    private void createHistoricalAssessments(UUID nutritionistId, Patient patient, Episode episode, LocalDateTime start) {
        assessmentRepository.save(BiometryAssessment.builder()
                .nutritionistId(nutritionistId)
                .patientId(patient.getId())
                .episodeId(episode.getId())
                .assessmentDate(start.toLocalDate().plusDays(3))
                .weight(bd("79.80"))
                .bodyFatPercent(bd("34.20"))
                .leanMassKg(bd("47.90"))
                .waterPercent(bd("49.80"))
                .visceralFatLevel(10)
                .bmrKcal(1360)
                .notes("Inicio do primeiro ciclo. Rotina irregular e baixa adesao inicial.")
                .build());
        assessmentRepository.save(BiometryAssessment.builder()
                .nutritionistId(nutritionistId)
                .patientId(patient.getId())
                .episodeId(episode.getId())
                .assessmentDate(start.toLocalDate().plusDays(48))
                .weight(bd("76.90"))
                .bodyFatPercent(bd("31.70"))
                .leanMassKg(bd("48.20"))
                .waterPercent(bd("51.40"))
                .visceralFatLevel(8)
                .bmrKcal(1395)
                .notes("Evolucao positiva antes da pausa do acompanhamento.")
                .build());
        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .nutritionistId(nutritionistId)
                .episodeId(episode.getId())
                .eventType("EPISODE_BIOMETRY_CREATED")
                .eventAt(start.plusDays(3))
                .title("Avaliacao inicial registrada")
                .description("Peso, percentual de gordura e dados metabólicos registrados.")
                .sourceRef("dev-seed-history")
                .metadataJson("{\"seed\":true}")
                .build());
        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .nutritionistId(nutritionistId)
                .episodeId(episode.getId())
                .eventType("EPISODE_BIOMETRY_CREATED")
                .eventAt(start.plusDays(48))
                .title("Reavaliacao registrada")
                .description("Reducao de peso e gordura corporal no ciclo antigo.")
                .sourceRef("dev-seed-history")
                .metadataJson("{\"seed\":true}")
                .build());
    }

    private void createAssessments(UUID nutritionistId, Patient patient, Episode episode, int offset) {
        assessmentRepository.save(BiometryAssessment.builder()
                .nutritionistId(nutritionistId)
                .patientId(patient.getId())
                .episodeId(episode.getId())
                .assessmentDate(LocalDate.now().minusDays(35 - offset))
                .weight(patient.getWeight().add(new BigDecimal("2.30")))
                .bodyFatPercent(bd("31.5").subtract(new BigDecimal(offset)))
                .leanMassKg(bd("48.0").add(new BigDecimal(offset)))
                .waterPercent(bd("51.0"))
                .visceralFatLevel(8 + offset)
                .bmrKcal(1380 + offset * 35)

                .notes("Avaliacao inicial do ciclo.")
                .build());
        assessmentRepository.save(BiometryAssessment.builder()
                .nutritionistId(nutritionistId)
                .patientId(patient.getId())
                .episodeId(episode.getId())
                .assessmentDate(LocalDate.now().minusDays(7 - offset))
                .weight(patient.getWeight())
                .bodyFatPercent(bd("29.8").subtract(new BigDecimal(offset)))
                .leanMassKg(bd("49.2").add(new BigDecimal(offset)))
                .waterPercent(bd("52.1"))
                .visceralFatLevel(7 + offset)
                .bmrKcal(1410 + offset * 35)

                .notes("Boa evolucao e adesao parcial ao plano.")
                .build());
        historyEventRepository.save(EpisodeHistoryEvent.builder()
                .nutritionistId(nutritionistId)
                .episodeId(episode.getId())
                .eventType("BIOMETRY")
                .eventAt(LocalDateTime.now().minusDays(7 - offset))
                .title("Avaliacao biometrica registrada")
                .description("Peso e composicao corporal atualizados no acompanhamento.")
                .sourceRef("dev-seed")
                .metadataJson("{\"seed\":true}")
                .build());
    }

    private MealPlan createPlan(UUID nutritionistId, Episode episode, List<Food> foods, int offset) {
        MealPlan plan = mealPlanRepository.save(MealPlan.builder()
                .nutritionistId(nutritionistId)
                .episodeId(episode.getId())
                .title("Plano alimentar demo")
                .notes("Plano gerado para exploracao manual do ambiente dev.")
                .kcalTarget(bd(String.valueOf(1800 + offset * 150)))
                .protTarget(bd("120"))
                .carbTarget(bd("210"))
                .fatTarget(bd("55"))
                .build());
        createSlot(plan.getId(), "Cafe da manha", "07:30", 1, List.of(foods.get(5), foods.get(6), foods.get(7)));
        createSlot(plan.getId(), "Almoco", "12:30", 2, List.of(foods.get(0), foods.get(1), foods.get(2), foods.get(8)));
        createSlot(plan.getId(), "Jantar", "19:30", 3, List.of(foods.get(0), foods.get(3), foods.get(8), foods.get(9)));
        planExtraRepository.save(PlanExtra.builder()
                .planId(plan.getId())
                .name("Chocolate 70%")
                .quantity("20 g, ate 3x por semana")
                .kcal(bd("110"))
                .prot(bd("2"))
                .carb(bd("8"))
                .fat(bd("8"))
                .sortOrder(1)
                .build());
        return plan;
    }

    private void createSlot(UUID planId, String label, String time, int sortOrder, List<Food> foods) {
        MealSlot slot = mealSlotRepository.save(MealSlot.builder()
                .planId(planId)
                .label(label)
                .time(time)
                .sortOrder(sortOrder)
                .build());
        MealOption option = mealOptionRepository.save(MealOption.builder()
                .mealSlotId(slot.getId())
                .name("Opcao principal")
                .sortOrder(1)
                .build());
        for (int i = 0; i < foods.size(); i++) {
            Food food = foods.get(i);
            mealFoodRepository.save(MealFood.builder()
                    .optionId(option.getId())
                    .foodId(food.getId())
                    .foodName(food.getName())
                    .referenceAmount(food.getReferenceAmount())
                    .unit(food.getUnit())
                    .prep(food.getPrep())
                    .kcal(food.getKcal())
                    .prot(food.getProt())
                    .carb(food.getCarb())
                    .fat(food.getFat())
                    .sortOrder(i + 1)
                    .build());
        }
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
