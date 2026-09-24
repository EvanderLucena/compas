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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Clinical calculation engine for smart TACO food substitutions.
 * Provides isocaloric and isomacronutrient equivalencies prioritizing patient eating habits.
 */
@Service
public class FoodSubstitutionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(FoodSubstitutionService.class);
    private static final int DEFAULT_LIMIT = 8;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final FoodRepository foodRepository;
    private final PatientRepository patientRepository;
    private final MealExtractionRepository mealExtractionRepository;
    private final ExtractionItemRepository extractionItemRepository;

    public FoodSubstitutionService(
            FoodRepository foodRepository,
            PatientRepository patientRepository,
            MealExtractionRepository mealExtractionRepository,
            ExtractionItemRepository extractionItemRepository) {
        this.foodRepository = foodRepository;
        this.patientRepository = patientRepository;
        this.mealExtractionRepository = mealExtractionRepository;
        this.extractionItemRepository = extractionItemRepository;
    }

    @Transactional(readOnly = true)
    public FoodSubstitutionResponse calculateSubstitutionsForPatient(
            UUID nutritionistId, UUID patientId, FoodSubstitutionRequest request) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Map<String, Integer> patientHabitFrequency = loadPatientFoodHabits(nutritionistId, patient.getId());
        return computeSubstitutions(nutritionistId, request, patientHabitFrequency, patient.getName());
    }

    @Transactional(readOnly = true)
    public FoodSubstitutionResponse calculateGeneralSubstitutions(
            UUID nutritionistId, FoodSubstitutionRequest request) {
        return computeSubstitutions(nutritionistId, request, Collections.emptyMap(), null);
    }

    private FoodSubstitutionResponse computeSubstitutions(
            UUID nutritionistId,
            FoodSubstitutionRequest request,
            Map<String, Integer> habitFrequency,
            String patientName) {
        SourceFoodData source = resolveSourceFood(nutritionistId, request);
        String dominantMacro = determineDominantMacro(source);

        List<Food> candidates = loadCandidateFoods(nutritionistId, source, dominantMacro);
        List<FoodSubstitutionItemResponse> items = new ArrayList<>();

        for (Food candidate : candidates) {
            if (isSameFood(source, candidate)) {
                continue;
            }
            FoodSubstitutionItemResponse subItem = evaluateCandidate(source, candidate, dominantMacro, habitFrequency);
            if (subItem != null) {
                items.add(subItem);
            }
        }

        if (items.size() < 3) {
            List<Food> allFoods = foodRepository.findAllAvailableByNutritionistId(nutritionistId);
            for (Food candidate : allFoods) {
                if (isSameFood(source, candidate) || candidates.contains(candidate)) {
                    continue;
                }
                FoodSubstitutionItemResponse subItem = evaluateCandidate(
                        source, candidate, dominantMacro, habitFrequency);
                if (subItem != null) {
                    items.add(subItem);
                }
            }
        }

        items.sort(Comparator
                .comparing(FoodSubstitutionItemResponse::isPatientHabit).reversed()
                .thenComparing(Comparator.comparingInt(FoodSubstitutionItemResponse::matchScore).reversed()));

        int limit = request.limit() != null && request.limit() > 0 ? request.limit() : DEFAULT_LIMIT;
        List<FoodSubstitutionItemResponse> limited = items.stream().limit(limit).toList();

        String whatsappMsg = buildWhatsappMessage(source, limited, patientName);

        return new FoodSubstitutionResponse(
                source.name(),
                source.amount(),
                source.unit(),
                round1(source.kcal()),
                round1(source.prot()),
                round1(source.carb()),
                round1(source.fat()),
                dominantMacro,
                limited,
                whatsappMsg
        );
    }

    private SourceFoodData resolveSourceFood(UUID nutritionistId, FoodSubstitutionRequest request) {
        BigDecimal amount = request.sourceAmount();
        if (request.foodId() != null) {
            Optional<Food> foodOpt = foodRepository.findAvailableById(request.foodId(), nutritionistId);
            if (foodOpt.isPresent()) {
                Food food = foodOpt.get();
                BigDecimal ref = food.getReferenceAmount() != null && food.getReferenceAmount().compareTo(ZERO) > 0
                        ? food.getReferenceAmount() : HUNDRED;
                BigDecimal ratio = amount.divide(ref, 6, RoundingMode.HALF_UP);
                return new SourceFoodData(
                        food.getId(),
                        food.getName(),
                        amount,
                        food.getUnit() != null ? food.getUnit() : "GRAMAS",
                        food.getCategory(),
                        food.getKcal().multiply(ratio),
                        food.getProt().multiply(ratio),
                        food.getCarb().multiply(ratio),
                        food.getFat().multiply(ratio),
                        food.getFiber() != null ? food.getFiber().multiply(ratio) : ZERO
                );
            }
            if (request.sourceFoodName() == null || request.sourceFoodName().trim().isBlank()) {
                throw new ResourceNotFoundException(
                        "Alimento de origem com ID " + request.foodId() + " não encontrado no catálogo.");
            }
            LOGGER.info("Alimento ID {} não encontrado no catálogo para nutricionista {}. Usando macros fornecidos.",
                    request.foodId(), nutritionistId);
        }

        if (request.sourceFoodName() == null || request.sourceFoodName().trim().isBlank()) {
            throw new IllegalArgumentException(
                    "Nome do alimento de origem é obrigatório quando foodId não é informado.");
        }

        String name = request.sourceFoodName().trim();
        String unit = request.sourceUnit() != null ? request.sourceUnit().toUpperCase(Locale.ROOT) : "GRAMAS";
        String cat = request.category() != null ? request.category().toUpperCase(Locale.ROOT) : null;
        BigDecimal kcal = request.sourceKcal() != null ? request.sourceKcal() : BigDecimal.valueOf(100);
        BigDecimal prot = request.sourceProt() != null ? request.sourceProt() : ZERO;
        BigDecimal carb = request.sourceCarb() != null ? request.sourceCarb() : ZERO;
        BigDecimal fat = request.sourceFat() != null ? request.sourceFat() : ZERO;

        return new SourceFoodData(null, name, amount, unit, cat, kcal, prot, carb, fat, ZERO);
    }

    private String determineDominantMacro(SourceFoodData source) {
        if ("PROTEINA".equalsIgnoreCase(source.category())) return "PROTEINA";
        if ("CARBOIDRATO".equalsIgnoreCase(source.category())) return "CARBOIDRATO";
        if ("GORDURA".equalsIgnoreCase(source.category())) return "GORDURA";
        if ("VEGETAL".equalsIgnoreCase(source.category())) return "VEGETAL";
        if ("FRUTA".equalsIgnoreCase(source.category())) return "FRUTA";

        double kcal = source.kcal().doubleValue();
        if (kcal <= 5) return "CALORIAS";

        double pCal = source.prot().doubleValue() * 4.0;
        double cCal = source.carb().doubleValue() * 4.0;
        double fCal = source.fat().doubleValue() * 9.0;

        if (cCal / kcal >= 0.50) return "CARBOIDRATO";
        if (pCal / kcal >= 0.28 || (source.prot().doubleValue() >= 8.0 && pCal / kcal >= 0.20)) return "PROTEINA";
        if (cCal / kcal >= 0.40) return "CARBOIDRATO";
        if (fCal / kcal >= 0.45) return "GORDURA";
        return "CALORIAS";
    }

    private List<Food> loadCandidateFoods(UUID nutritionistId, SourceFoodData source, String dominantMacro) {
        String targetCategory = source.category() != null && !"OUTRO".equalsIgnoreCase(source.category())
                ? source.category()
                : dominantMacro;
        List<Food> foods = foodRepository.findAvailableByNutritionistIdAndCategory(nutritionistId, targetCategory);
        if (foods.isEmpty() || "CALORIAS".equalsIgnoreCase(targetCategory)) {
            foods = foodRepository.findAllAvailableByNutritionistId(nutritionistId);
        }
        return foods;
    }

    private boolean isSameFood(SourceFoodData source, Food candidate) {
        if (source.id() != null && source.id().equals(candidate.getId())) {
            return true;
        }
        String sName = normalize(source.name());
        String cName = normalize(candidate.getName());
        return sName.equalsIgnoreCase(cName);
    }

    private boolean isUnitBased(String unit) {
        if (unit == null) return false;
        String u = unit.trim().toLowerCase(Locale.ROOT);
        return u.equals("un") || u.equals("unidade") || u.equals("und") || u.equals("unidades");
    }

    private FoodSubstitutionItemResponse evaluateCandidate(
            SourceFoodData source,
            Food candidate,
            String dominantMacro,
            Map<String, Integer> habitFrequency) {
        BigDecimal candRef = candidate.getReferenceAmount() != null && candidate.getReferenceAmount().compareTo(ZERO) > 0
                ? candidate.getReferenceAmount() : HUNDRED;

        BigDecimal suggestedAmount = calculateSuggestedAmount(source, candidate, candRef, dominantMacro);
        if (suggestedAmount == null) {
            return null;
        }
        boolean isUnit = isUnitBased(candidate.getUnit());
        BigDecimal minThreshold = isUnit ? BigDecimal.valueOf(0.5) : BigDecimal.valueOf(5);
        if (suggestedAmount.compareTo(minThreshold) < 0) {
            return null;
        }

        BigDecimal candRatio = suggestedAmount.divide(candRef, 6, RoundingMode.HALF_UP);
        BigDecimal candKcal = candidate.getKcal().multiply(candRatio);
        BigDecimal candProt = candidate.getProt().multiply(candRatio);
        BigDecimal candCarb = candidate.getCarb().multiply(candRatio);
        BigDecimal candFat = candidate.getFat().multiply(candRatio);
        BigDecimal candFiber = candidate.getFiber() != null ? candidate.getFiber().multiply(candRatio) : ZERO;

        BigDecimal deltaKcal = candKcal.subtract(source.kcal());
        BigDecimal deltaProt = candProt.subtract(source.prot());
        BigDecimal deltaCarb = candCarb.subtract(source.carb());
        BigDecimal deltaFat = candFat.subtract(source.fat());

        if (source.kcal().compareTo(ZERO) > 0) {
            double deltaKcalAbs = Math.abs(deltaKcal.doubleValue());
            double devPct = deltaKcalAbs / source.kcal().doubleValue();
            if (deltaKcalAbs > 35.0 && devPct > 0.45) {
                return null;
            }
        }

        if ("PROTEINA".equalsIgnoreCase(dominantMacro) && source.prot().compareTo(BigDecimal.valueOf(5.0)) >= 0) {
            double sourceP = source.prot().doubleValue();
            double candP = candProt.doubleValue();
            if (candP < sourceP * 0.55 || candP > sourceP * 1.60) {
                return null;
            }
        } else if ("CARBOIDRATO".equalsIgnoreCase(dominantMacro) && source.carb().compareTo(BigDecimal.valueOf(15.0)) >= 0) {
            double sourceC = source.carb().doubleValue();
            double candC = candCarb.doubleValue();
            if (candC < sourceC * 0.55 || candC > sourceC * 1.60) {
                return null;
            }
        }

        int habitCount = getHabitCount(candidate.getName(), habitFrequency);
        boolean isHabit = habitCount > 0;
        String habitBadge = isHabit ? String.format("Consumido %dx pelo paciente", habitCount) : null;

        int score = calculateScore(source, candidate, deltaKcal, deltaProt, deltaCarb, isHabit, dominantMacro);
        String reason = buildClinicalReason(dominantMacro, deltaKcal, isHabit);
        String portionDesc = buildPortionDescription(candidate, suggestedAmount);

        return new FoodSubstitutionItemResponse(
                candidate.getId(),
                candidate.getName(),
                candidate.getCategory(),
                candidate.getUnit(),
                round1(suggestedAmount),
                portionDesc,
                round1(candKcal),
                round1(candProt),
                round1(candCarb),
                round1(candFat),
                round1(candFiber),
                round1(deltaKcal),
                round1(deltaProt),
                round1(deltaCarb),
                round1(deltaFat),
                isHabit,
                habitCount,
                habitBadge,
                score,
                reason
        );
    }

    private BigDecimal calculateSuggestedAmount(
            SourceFoodData source, Food candidate, BigDecimal candRef, String dominantMacro) {
        BigDecimal target = null;
        BigDecimal candProtPerUnit = candidate.getProt().divide(candRef, 6, RoundingMode.HALF_UP);
        BigDecimal candCarbPerUnit = candidate.getCarb().divide(candRef, 6, RoundingMode.HALF_UP);
        BigDecimal candFatPerUnit = candidate.getFat().divide(candRef, 6, RoundingMode.HALF_UP);
        BigDecimal candKcalPerUnit = candidate.getKcal().divide(candRef, 6, RoundingMode.HALF_UP);

        if ("PROTEINA".equals(dominantMacro) && candProtPerUnit.compareTo(BigDecimal.valueOf(0.03)) > 0) {
            target = source.prot().divide(candProtPerUnit, 2, RoundingMode.HALF_UP);
        } else if ("CARBOIDRATO".equals(dominantMacro) && candCarbPerUnit.compareTo(BigDecimal.valueOf(0.03)) > 0) {
            target = source.carb().divide(candCarbPerUnit, 2, RoundingMode.HALF_UP);
        } else if ("GORDURA".equals(dominantMacro) && candFatPerUnit.compareTo(BigDecimal.valueOf(0.03)) > 0) {
            target = source.fat().divide(candFatPerUnit, 2, RoundingMode.HALF_UP);
        } else if (candKcalPerUnit.compareTo(BigDecimal.valueOf(0.05)) > 0) {
            target = source.kcal().divide(candKcalPerUnit, 2, RoundingMode.HALF_UP);
        }

        if (target == null) return null;
        return roundPractically(target, candidate.getUnit());
    }

    private BigDecimal roundPractically(BigDecimal raw, String unit) {
        if (isUnitBased(unit)) {
            double val = raw.doubleValue();
            double rounded = Math.round(val * 2.0) / 2.0;
            return BigDecimal.valueOf(Math.max(0.5, rounded));
        }

        double val = raw.doubleValue();
        if (val < 30) {
            long r = Math.round(val / 5.0) * 5;
            return BigDecimal.valueOf(Math.max(5, r));
        } else if (val < 200) {
            long r = Math.round(val / 10.0) * 10;
            return BigDecimal.valueOf(r);
        } else {
            long r = Math.round(val / 20.0) * 20;
            return BigDecimal.valueOf(r);
        }
    }

    private int calculateScore(
            SourceFoodData source,
            Food candidate,
            BigDecimal deltaKcal,
            BigDecimal deltaProt,
            BigDecimal deltaCarb,
            boolean isHabit,
            String dominantMacro) {
        double kcalDev = source.kcal().compareTo(ZERO) > 0
                ? Math.abs(deltaKcal.doubleValue()) / source.kcal().doubleValue() : 0.0;
        double kcalCloseness = Math.max(0, 1.0 - (kcalDev / 0.45));
        double score = kcalCloseness * 45.0;

        if ("PROTEINA".equalsIgnoreCase(dominantMacro) && source.prot().compareTo(ZERO) > 0) {
            double protDev = Math.abs(deltaProt.doubleValue()) / source.prot().doubleValue();
            double protCloseness = Math.max(0, 1.0 - (protDev / 0.50));
            score += protCloseness * 25.0;
        } else if ("CARBOIDRATO".equalsIgnoreCase(dominantMacro) && source.carb().compareTo(ZERO) > 0) {
            double carbDev = Math.abs(deltaCarb.doubleValue()) / source.carb().doubleValue();
            double carbCloseness = Math.max(0, 1.0 - (carbDev / 0.50));
            score += carbCloseness * 25.0;
        } else {
            score += kcalCloseness * 25.0;
        }

        if (candidate.getCategory() != null && candidate.getCategory().equalsIgnoreCase(dominantMacro)) {
            score += 10.0;
        }

        int affinity = computeAffinityBonus(source.name(), candidate.getName());
        score += affinity;

        if (isHabit) {
            score += 10.0;
        }

        return Math.min(100, Math.max(10, (int) Math.round(score)));
    }

    private int computeAffinityBonus(String sourceName, String candidateName) {
        String s = normalize(sourceName);
        String c = normalize(candidateName);

        int bonus = 0;

        boolean sourceRaw = s.contains("cru") || s.contains("crua");
        boolean candRaw = c.contains("cru") || c.contains("crua");
        if (candRaw && !sourceRaw) {
            boolean rawRequiringCooking = c.contains("carne") || c.contains("bovin") || c.contains("frango")
                    || c.contains("galinha") || c.contains("suin") || c.contains("porco") || c.contains("peixe")
                    || c.contains("atum") || c.contains("bacalhau") || c.contains("camarao") || c.contains("picanha")
                    || c.contains("charque") || c.contains("acem") || c.contains("patinho") || c.contains("contrafile")
                    || c.contains("mignon") || c.contains("peru") || c.contains("abadejo") || c.contains("arroz")
                    || c.contains("macarrao") || c.contains("massa") || c.contains("pastel") || c.contains("farinha")
                    || c.contains("fuba") || c.contains("amido") || c.contains("feijao") || c.contains("mandioca")
                    || c.contains("batata") || c.contains("ovo");
            if (rawRequiringCooking) {
                bonus -= 35;
            }
        }

        boolean sEgg = s.contains("ovo") || s.contains("ovos") || s.contains("omelete");
        boolean cEgg = c.contains("ovo") || c.contains("ovos") || c.contains("omelete") || c.contains("clara");
        if (sEgg) {
            if (cEgg) {
                bonus += 25;
            } else if (c.contains("ricota") || c.contains("minas") || c.contains("cottage")
                    || c.contains("tofu") || c.contains("requeijao") || c.contains("queijo")) {
                bonus += 15;
            }
            return bonus;
        }

        boolean sPoultry = s.contains("frango") || s.contains("galinha") || s.contains("peru") || s.contains("chester");
        boolean cPoultry = c.contains("frango") || c.contains("galinha") || c.contains("peru") || c.contains("chester");
        if (sPoultry) {
            if (cPoultry) {
                bonus += 20;
            } else if (c.contains("peixe") || c.contains("atum") || c.contains("tilapia") || c.contains("patinho") || c.contains("bovin")) {
                bonus += 10;
            }
            return bonus;
        }

        boolean sBeef = s.contains("carne") || s.contains("bovin") || s.contains("patinho")
                || s.contains("alcatra") || s.contains("mignon") || s.contains("acem") || s.contains("contrafile");
        boolean cBeef = c.contains("carne") || c.contains("bovin") || c.contains("patinho")
                || c.contains("alcatra") || c.contains("mignon") || c.contains("acem") || c.contains("contrafile");
        if (sBeef) {
            if (cBeef) {
                bonus += 20;
            } else if (cPoultry || c.contains("peixe") || c.contains("suin")) {
                bonus += 10;
            }
            return bonus;
        }

        boolean sFish = s.contains("peixe") || s.contains("atum") || s.contains("tilapia")
                || s.contains("salmao") || s.contains("pescada") || s.contains("camarao") || s.contains("bacalhau");
        boolean cFish = c.contains("peixe") || c.contains("atum") || c.contains("tilapia")
                || c.contains("salmao") || c.contains("pescada") || c.contains("camarao") || c.contains("bacalhau");
        if (sFish) {
            if (cFish) {
                bonus += 20;
            } else if (cPoultry) {
                bonus += 10;
            }
            return bonus;
        }

        boolean sRice = s.contains("arroz");
        boolean cRice = c.contains("arroz");
        if (sRice && cRice) {
            bonus += 20;
            return bonus;
        }

        boolean sTuber = s.contains("batata") || s.contains("mandioca") || s.contains("aipim")
                || s.contains("macaxeira") || s.contains("inhame") || s.contains("mandioquinha");
        boolean cTuber = c.contains("batata") || c.contains("mandioca") || c.contains("aipim")
                || c.contains("macaxeira") || c.contains("inhame") || c.contains("mandioquinha");
        if (sTuber && cTuber) {
            bonus += 20;
            return bonus;
        }

        boolean sBread = s.contains("pao") || s.contains("torrada") || s.contains("tapioca") || s.contains("wrap");
        boolean cBread = c.contains("pao") || c.contains("torrada") || c.contains("tapioca") || c.contains("wrap");
        if (sBread && cBread) {
            bonus += 20;
            return bonus;
        }

        return bonus;
    }

    private String buildClinicalReason(String dominantMacro, BigDecimal deltaKcal, boolean isHabit) {
        String deltaStr = deltaKcal.compareTo(ZERO) >= 0 ? "+" + round1(deltaKcal) : String.valueOf(round1(deltaKcal));
        String base = String.format("Equivalente em %s (%s kcal)", dominantMacro.toLowerCase(Locale.ROOT), deltaStr);
        if (isHabit) {
            return "Alimento frequente no hábito do paciente com " + base;
        }
        return "Opção isonutricional do grupo TACO: " + base;
    }

    private String buildPortionDescription(Food food, BigDecimal suggestedAmount) {
        String rawUnit = food.getUnit() != null ? food.getUnit().trim() : "g";
        String amountFormatted;
        if (isUnitBased(rawUnit)) {
            String u = suggestedAmount.compareTo(BigDecimal.ONE) == 0 ? "unidade" : "unidades";
            amountFormatted = formatNumber(suggestedAmount) + " " + u;
        } else if (rawUnit.equalsIgnoreCase("gramas") || rawUnit.equalsIgnoreCase("g")) {
            amountFormatted = formatNumber(suggestedAmount) + "g";
        } else if (rawUnit.equalsIgnoreCase("mililitros") || rawUnit.equalsIgnoreCase("ml")) {
            amountFormatted = formatNumber(suggestedAmount) + "ml";
        } else {
            amountFormatted = formatNumber(suggestedAmount) + " " + rawUnit.toLowerCase(Locale.ROOT);
        }

        if (food.getPortionLabel() != null && !food.getPortionLabel().isBlank()) {
            String label = food.getPortionLabel().trim();
            String normLabel = normalize(label);
            String normAmount = normalize(amountFormatted);
            if (!normLabel.equalsIgnoreCase(normAmount) && !label.equalsIgnoreCase(formatNumber(suggestedAmount) + " un")) {
                return amountFormatted + " (" + label + ")";
            }
        }
        return amountFormatted;
    }

    private String buildWhatsappMessage(
            SourceFoodData source, List<FoodSubstitutionItemResponse> items, String patientName) {
        StringBuilder sb = new StringBuilder();
        if (patientName != null && !patientName.isBlank()) {
            sb.append("Olá, ").append(patientName).append("! 👋\n");
        }
        sb.append("Aqui estão suas *opções de substituição equivalente* para o alimento:\n\n");
        sb.append("📌 *Substituir: ").append(formatNumber(source.amount())).append(source.unit().toLowerCase(Locale.ROOT))
                .append(" de ").append(source.name()).append("*\n");
        sb.append("   ↳ ").append(formatNumber(source.kcal())).append(" kcal | ")
                .append(formatNumber(source.prot())).append("g P | ")
                .append(formatNumber(source.carb())).append("g C | ")
                .append(formatNumber(source.fat())).append("g G\n\n");

        if (items.isEmpty()) {
            sb.append("Não encontramos substituições diretas no grupo selecionado.\n");
            return sb.toString();
        }

        sb.append("Você pode trocar por qualquer uma das opções abaixo:\n\n");
        int idx = 1;
        for (FoodSubstitutionItemResponse it : items) {
            String habitBadge = it.isPatientHabit() ? " ⭐ _Hábito frequente_" : "";
            sb.append(idx).append("️⃣ *").append(it.householdPortion()).append(" de ").append(it.name()).append("*")
                    .append(habitBadge).append("\n");
            sb.append("   ↳ ").append(formatNumber(it.kcal())).append(" kcal | ")
                    .append(formatNumber(it.prot())).append("g P | ")
                    .append(formatNumber(it.carb())).append("g C");
            String deltaKcalStr = it.deltaKcal().compareTo(ZERO) >= 0 ? "+" + formatNumber(it.deltaKcal()) : formatNumber(it.deltaKcal());
            sb.append(" (").append(deltaKcalStr).append(" kcal)\n\n");
            idx++;
        }

        sb.append("💡 *Dica:* Mantenha o equilíbrio do prato com a mesma porção habitual de vegetais e salada!");
        return sb.toString();
    }

    private Map<String, Integer> loadPatientFoodHabits(UUID nutritionistId, UUID patientId) {
        Map<String, Integer> freq = new HashMap<>();
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(45);

        List<MealExtraction> extractions = mealExtractionRepository
                .findByPatientIdAndNutritionistIdAndExtractedAtBetween(patientId, nutritionistId, start, end);
        if (extractions.isEmpty()) {
            return freq;
        }

        List<UUID> extIds = extractions.stream().map(MealExtraction::getId).toList();
        List<ExtractionItem> items = extractionItemRepository.findByExtractionIdIn(extIds);

        for (ExtractionItem item : items) {
            String name = normalize(item.getName());
            if (!name.isBlank()) {
                freq.put(name, freq.getOrDefault(name, 0) + 1);
            }
        }
        return freq;
    }

    private int getHabitCount(String candidateName, Map<String, Integer> frequencyMap) {
        if (frequencyMap == null || frequencyMap.isEmpty() || candidateName == null) return 0;
        String normCand = normalize(candidateName);
        int total = 0;
        for (Map.Entry<String, Integer> entry : frequencyMap.entrySet()) {
            String logged = entry.getKey();
            if (normCand.contains(logged) || logged.contains(normCand)) {
                total += entry.getValue();
            }
        }
        return total;
    }

    private String normalize(String str) {
        if (str == null) return "";
        return str.toLowerCase(Locale.ROOT)
                .replaceAll("[áàãâä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[íìîï]", "i")
                .replaceAll("[óòõôö]", "o")
                .replaceAll("[úùûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9 ]", "")
                .trim();
    }

    private Patient verifyPatientAndGet(UUID nutritionistId, UUID patientId) {
        return patientRepository.findByIdAndNutritionistId(patientId, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente não encontrado"));
    }

    private BigDecimal round1(BigDecimal val) {
        if (val == null) return ZERO;
        return val.setScale(1, RoundingMode.HALF_UP);
    }

    private String formatNumber(BigDecimal val) {
        if (val == null) return "0";
        BigDecimal rounded = round1(val);
        if (rounded.stripTrailingZeros().scale() <= 0) {
            return String.valueOf(rounded.intValue());
        }
        return rounded.toString().replace('.', ',');
    }

    private record SourceFoodData(
            UUID id,
            String name,
            BigDecimal amount,
            String unit,
            String category,
            BigDecimal kcal,
            BigDecimal prot,
            BigDecimal carb,
            BigDecimal fat,
            BigDecimal fiber
    ) {
    }
}
