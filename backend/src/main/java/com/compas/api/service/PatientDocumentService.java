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
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Service for generating patient documents as PDF:
 * 1. Plano Alimentar Oficial (Meal Plan)
 * 2. Lista de Compras da Semana (Grocery List)
 * 3. Relatório de Evolução Biométrica (Biometry Report)
 */
@Service
public class PatientDocumentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PatientDocumentService.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.of("pt", "BR"));

    // Brand Palette
    private static final Color COLOR_PRIMARY = new Color(22, 101, 52); // #166534 Emerald/Forest
    private static final Color COLOR_PRIMARY_LIGHT = new Color(240, 253, 244); // #F0FDF4
    private static final Color COLOR_DARK = new Color(17, 24, 39); // #111827 Dark Slate
    private static final Color COLOR_MUTED = new Color(100, 116, 139); // #64748B Slate Muted
    private static final Color COLOR_BORDER = new Color(226, 232, 240); // #E2E8F0
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252); // #F8FAFC
    private static final Color COLOR_WHITE = Color.WHITE;

    private static final List<String> HORTIFRUTI_KEYWORDS = List.of(
            "banana", "maçã", "maca", "morango", "laranja", "uva", "abacaxi", "mamão", "mamao",
            "melancia", "limão", "limao", "alface", "rúcula", "rucula", "espinafre", "tomate",
            "cenoura", "brócolis", "brocolis", "couve", "pepino", "cebola", "alho", "abobrinha",
            "batata", "mandioca", "aipim", "inhame", "beterraba"
    );

    private static final List<String> ACOUGUE_KEYWORDS = List.of(
            "frango", "carne", "patinho", "alcatra", "filé", "file", "peixe", "tilápia", "tilapia",
            "salmão", "salmao", "atum", "ovo", "clara"
    );

    private static final List<String> LATICINIOS_KEYWORDS = List.of(
            "leite", "iogurte", "queijo", "cottage", "ricota", "mussarela", "manteiga", "requeijão", "requeijao"
    );

    private static final List<String> SUPLEMENTOS_KEYWORDS = List.of(
            "whey", "creatina", "proteína", "canela", "cacau", "orégano", "oregano", "açafrão", "tempero",
            "chá", "cha", "café", "cafe"
    );

    private final PatientRepository patientRepository;
    private final NutritionistRepository nutritionistRepository;
    private final MealPlanService mealPlanService;
    private final BiometryService biometryService;

    public PatientDocumentService(
            PatientRepository patientRepository,
            NutritionistRepository nutritionistRepository,
            MealPlanService mealPlanService,
            BiometryService biometryService
    ) {
        this.patientRepository = patientRepository;
        this.nutritionistRepository = nutritionistRepository;
        this.mealPlanService = mealPlanService;
        this.biometryService = biometryService;
    }

    /**
     * Generates the Official Meal Plan PDF for the given patient.
     */
    @Transactional(readOnly = true)
    public byte[] generateMealPlanPdf(UUID nutritionistId, UUID patientId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Nutritionist nutritionist = getNutritionist(nutritionistId);
        PlanResponse plan = mealPlanService.getPlan(nutritionistId, patientId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 44, 44);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent(
                    "Plano Alimentar · " + patient.getName() + " · " + nutritionist.getDisplayName()
            ));

            document.open();

            // 1. Header with Professional CRN & Patient Data
            addHeaderBlock(document, "PLANO ALIMENTAR INDIVIDUALIZADO", nutritionist, patient);

            // 2. Target Macros Box
            addMacrosSummaryBox(document, plan);

            // 3. General Notes (if any)
            if (plan.notes() != null && !plan.notes().isBlank()) {
                addNotesSection(document, plan.notes());
            }

            // 4. Meals and Options
            addMealsSection(document, plan.meals());

            // 5. Extras / Substituições Autorizadas
            if (plan.extras() != null && !plan.extras().isEmpty()) {
                addExtrasSection(document, plan.extras());
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            LOGGER.error("Error generating Meal Plan PDF for patient {}", patientId, e);
            throw new IllegalStateException("Falha ao gerar o PDF do plano alimentar", e);
        } catch (Exception e) {
            LOGGER.error("Unexpected error generating Meal Plan PDF for patient {}", patientId, e);
            throw new IllegalStateException("Erro ao gerar documento", e);
        }
    }

    /**
     * Generates the Weekly Grocery List PDF organized by supermarket sections.
     */
    @Transactional(readOnly = true)
    public byte[] generateGroceryListPdf(UUID nutritionistId, UUID patientId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Nutritionist nutritionist = getNutritionist(nutritionistId);
        PlanResponse plan = mealPlanService.getPlan(nutritionistId, patientId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 44, 44);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent(
                    "Lista de Compras · " + patient.getName() + " · " + nutritionist.getDisplayName()
            ));

            document.open();

            // 1. Header
            addHeaderBlock(document, "LISTA DE COMPRAS DA SEMANA", nutritionist, patient);

            // 2. Info Box
            PdfPTable infoBox = new PdfPTable(1);
            infoBox.setWidthPercentage(100);
            infoBox.setSpacingBefore(4f);
            infoBox.setSpacingAfter(10f);

            PdfPCell cell = new PdfPCell(new Phrase(
                    "Esta lista foi gerada com base nas refeições e opções prescritas no seu plano alimentar. "
                            + "Os itens estão organizados por setores de supermercado com estimativa semanal.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_MUTED)
            ));
            cell.setBackgroundColor(COLOR_BG_LIGHT);
            cell.setBorderColor(COLOR_BORDER);
            cell.setPadding(8f);
            infoBox.addCell(cell);
            document.add(infoBox);

            // 3. Categorized Items
            Map<String, List<GroceryItem>> sections = categorizePlanFoods(plan);
            for (Map.Entry<String, List<GroceryItem>> entry : sections.entrySet()) {
                if (!entry.getValue().isEmpty()) {
                    addGrocerySection(document, entry.getKey(), entry.getValue());
                }
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            LOGGER.error("Error generating Grocery List PDF for patient {}", patientId, e);
            throw new IllegalStateException("Falha ao gerar lista de compras em PDF", e);
        } catch (Exception e) {
            LOGGER.error("Unexpected error generating Grocery List PDF for patient {}", patientId, e);
            throw new IllegalStateException("Erro ao gerar documento", e);
        }
    }

    /**
     * Generates the Biometric Evolution Report PDF for the given patient.
     */
    @Transactional(readOnly = true)
    public byte[] generateBiometryReportPdf(UUID nutritionistId, UUID patientId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Nutritionist nutritionist = getNutritionist(nutritionistId);
        BiometryEvolutionSummaryResponse summary =
                biometryService.getBiometryEvolutionSummary(nutritionistId, patientId);
        List<BiometryAssessmentResponse> assessments = biometryService.listAssessments(nutritionistId, patientId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 44, 44);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent(
                    "Evolução Biométrica · " + patient.getName() + " · " + nutritionist.getDisplayName()
            ));

            document.open();

            // 1. Header
            addHeaderBlock(document, "RELATÓRIO DE EVOLUÇÃO BIOMÉTRICA", nutritionist, patient);

            // 2. Summary KPIs Box
            addBiometryKpisSummary(document, summary);

            // 3. Assessments History Table
            addAssessmentsHistoryTable(document, assessments);

            // 4. Latest Perimetry Measurements (if available)
            if (summary.perimetryDeltas() != null && !summary.perimetryDeltas().isEmpty()) {
                addPerimetrySection(document, summary.perimetryDeltas());
            }

            // 5. Clinical Observations
            addClinicalGuidanceFooter(document, nutritionist);

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            LOGGER.error("Error generating Biometry Report PDF for patient {}", patientId, e);
            throw new IllegalStateException("Falha ao gerar relatório de evolução biométrica em PDF", e);
        } catch (Exception e) {
            LOGGER.error("Unexpected error generating Biometry Report PDF for patient {}", patientId, e);
            throw new IllegalStateException("Erro ao gerar documento", e);
        }
    }

    // =========================================================================
    // Layout and PDF Construction Helpers
    // =========================================================================

    private void addHeaderBlock(Document doc, String documentTitle, Nutritionist nutri, Patient patient)
            throws DocumentException {
        PdfPTable headerTable = new PdfPTable(new float[]{1.4f, 1f});
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(10f);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);

        Paragraph appBrand = new Paragraph("COMPAS 🧭 · NUTRIÇÃO CLÍNICA",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, COLOR_PRIMARY));
        leftCell.addElement(appBrand);

        Paragraph docTitle = new Paragraph(documentTitle,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f, COLOR_DARK));
        docTitle.setSpacingBefore(2f);
        leftCell.addElement(docTitle);

        headerTable.addCell(leftCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(0);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        String regText = (nutri.getCrnRegional() != null ? nutri.getCrnRegional() : "CRN")
                + " " + (nutri.getCrn() != null ? nutri.getCrn() : "");

        Paragraph nutriName = new Paragraph(nutri.getDisplayName(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, COLOR_DARK));
        nutriName.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(nutriName);

        Paragraph nutriCrn = new Paragraph(regText,
                FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_MUTED));
        nutriCrn.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(nutriCrn);

        if (nutri.getSpecialty() != null && !nutri.getSpecialty().isBlank()) {
            Paragraph spec = new Paragraph(nutri.getSpecialty(),
                    FontFactory.getFont(FontFactory.HELVETICA, 8f, COLOR_MUTED));
            spec.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(spec);
        }

        headerTable.addCell(rightCell);
        doc.add(headerTable);

        PdfPTable patientTable = new PdfPTable(new float[]{1f, 1f, 1f, 1f});
        patientTable.setWidthPercentage(100);
        patientTable.setSpacingAfter(12f);

        String ageStr = patient.getAge() != null ? patient.getAge() + " anos" : "—";
        String heightStr = patient.getHeightCm() != null ? patient.getHeightCm() + " cm" : "—";
        String objStr = patient.getObjective() != null ? patient.getObjective().name().replace('_', ' ') : "Geral";
        String dateStr = LocalDate.now().format(DATE_FORMATTER);

        addMetaBox(patientTable, "PACIENTE", patient.getName());
        addMetaBox(patientTable, "IDADE / ALTURA", ageStr + " · " + heightStr);
        addMetaBox(patientTable, "OBJETIVO", objStr);
        addMetaBox(patientTable, "EMISSÃO", dateStr);

        doc.add(patientTable);
    }

    private void addMetaBox(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7f, COLOR_MUTED));
        Paragraph pVal = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_DARK));
        cell.addElement(pLabel);
        cell.addElement(pVal);

        table.addCell(cell);
    }

    private void addMacrosSummaryBox(Document doc, PlanResponse plan) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(12f);

        String kcal = plan.kcalTarget() != null ? plan.kcalTarget().toPlainString() + " kcal" : "—";
        String prot = plan.protTarget() != null ? plan.protTarget().toPlainString() + " g" : "—";
        String carb = plan.carbTarget() != null ? plan.carbTarget().toPlainString() + " g" : "—";
        String fat = plan.fatTarget() != null ? plan.fatTarget().toPlainString() + " g" : "—";

        addMacroCell(table, "ENERGIA TOTAL", kcal, COLOR_PRIMARY);
        addMacroCell(table, "PROTEÍNAS", prot, new Color(59, 130, 246));
        addMacroCell(table, "CARBOIDRATOS", carb, new Color(234, 88, 12));
        addMacroCell(table, "GORDURAS", fat, new Color(13, 148, 136));

        doc.add(table);
    }

    private void addMacroCell(PdfPTable table, String label, String value, Color accentColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, COLOR_MUTED));
        Paragraph pVal = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12f, accentColor));
        cell.addElement(pLabel);
        cell.addElement(pVal);

        table.addCell(cell);
    }

    private void addNotesSection(Document doc, String notes) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingAfter(12f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PRIMARY_LIGHT);
        cell.setBorderColor(new Color(187, 247, 208));
        cell.setPadding(8f);

        Paragraph pLabel = new Paragraph("ORIENTAÇÕES GERAIS DA NUTRICIONISTA",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, COLOR_PRIMARY));
        Paragraph pContent = new Paragraph(notes,
                FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_DARK));
        pContent.setSpacingBefore(2f);

        cell.addElement(pLabel);
        cell.addElement(pContent);
        table.addCell(cell);
        doc.add(table);
    }

    private void addMealsSection(Document doc, List<MealSlotResponse> meals) throws DocumentException {
        if (meals == null || meals.isEmpty()) {
            return;
        }

        for (MealSlotResponse slot : meals) {
            PdfPTable slotHeader = new PdfPTable(1);
            slotHeader.setWidthPercentage(100);
            slotHeader.setSpacingBefore(6f);

            String timeStr = slot.time() != null && !slot.time().isBlank() ? slot.time() + " · " : "";
            PdfPCell headerCell = new PdfPCell(new Phrase(
                    timeStr + slot.label().toUpperCase(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_WHITE)
            ));
            headerCell.setBackgroundColor(COLOR_PRIMARY);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(6f);
            slotHeader.addCell(headerCell);
            doc.add(slotHeader);

            if (slot.options() != null) {
                for (MealOptionResponse option : slot.options()) {
                    addMealOptionFoodsTable(doc, option, slot.options().size());
                }
            }
        }
    }

    private void addMealOptionFoodsTable(Document doc, MealOptionResponse option, int totalOptions)
            throws DocumentException {
        if (totalOptions > 1 || !"Opção 1 · Clássico".equals(option.name())) {
            Paragraph optName = new Paragraph("  " + option.name(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_PRIMARY));
            optName.setSpacingBefore(4f);
            optName.setSpacingAfter(3f);
            doc.add(optName);
        }

        PdfPTable foodsTable = new PdfPTable(new float[]{3.2f, 1.6f, 1.8f, 1f, 1f, 1f, 1f});
        foodsTable.setWidthPercentage(100);
        foodsTable.setSpacingAfter(8f);

        addTableHeaderCell(foodsTable, "Alimento");
        addTableHeaderCell(foodsTable, "Quantidade");
        addTableHeaderCell(foodsTable, "Preparo");
        addTableHeaderCell(foodsTable, "Kcal");
        addTableHeaderCell(foodsTable, "Prot");
        addTableHeaderCell(foodsTable, "Carb");
        addTableHeaderCell(foodsTable, "Gord");

        if (option.items() == null || option.items().isEmpty()) {
            PdfPCell emptyCell = new PdfPCell(new Phrase("Nenhum item configurado nesta opção.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8f, COLOR_MUTED)));
            emptyCell.setColspan(7);
            emptyCell.setPadding(6f);
            emptyCell.setBorderColor(COLOR_BORDER);
            foodsTable.addCell(emptyCell);
        } else {
            for (MealFoodResponse item : option.items()) {
                String qty = formatQuantity(item.referenceAmount(), item.unit());
                String prep = item.prep() != null && !item.prep().isBlank() ? item.prep() : "—";
                String kcal = item.kcal() != null ? item.kcal().toPlainString() : "—";
                String prot = item.prot() != null ? item.prot().toPlainString() + "g" : "—";
                String carb = item.carb() != null ? item.carb().toPlainString() + "g" : "—";
                String fat = item.fat() != null ? item.fat().toPlainString() + "g" : "—";

                addTableRowCell(foodsTable, item.foodName(), Element.ALIGN_LEFT);
                addTableRowCell(foodsTable, qty, Element.ALIGN_LEFT);
                addTableRowCell(foodsTable, prep, Element.ALIGN_LEFT);
                addTableRowCell(foodsTable, kcal, Element.ALIGN_RIGHT);
                addTableRowCell(foodsTable, prot, Element.ALIGN_RIGHT);
                addTableRowCell(foodsTable, carb, Element.ALIGN_RIGHT);
                addTableRowCell(foodsTable, fat, Element.ALIGN_RIGHT);
            }
        }

        doc.add(foodsTable);
    }

    private void addExtrasSection(Document doc, List<ExtraResponse> extras) throws DocumentException {
        PdfPTable sectionHeader = new PdfPTable(1);
        sectionHeader.setWidthPercentage(100);
        sectionHeader.setSpacingBefore(10f);

        PdfPCell headerCell = new PdfPCell(new Phrase("EXTRAS E SUBSTITUIÇÕES AUTORIZADAS",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, COLOR_WHITE)));
        headerCell.setBackgroundColor(COLOR_DARK);
        headerCell.setBorder(Rectangle.NO_BORDER);
        headerCell.setPadding(5f);
        sectionHeader.addCell(headerCell);
        doc.add(sectionHeader);

        PdfPTable table = new PdfPTable(new float[]{3.5f, 2f, 1f, 1f, 1f, 1f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(8f);

        addTableHeaderCell(table, "Item / Alimento");
        addTableHeaderCell(table, "Quantidade Permitida");
        addTableHeaderCell(table, "Kcal");
        addTableHeaderCell(table, "Prot");
        addTableHeaderCell(table, "Carb");
        addTableHeaderCell(table, "Gord");

        for (ExtraResponse extra : extras) {
            addTableRowCell(table, extra.name(), Element.ALIGN_LEFT);
            addTableRowCell(table, extra.quantity() != null ? extra.quantity() : "—", Element.ALIGN_LEFT);
            addTableRowCell(table, extra.kcal() != null ? extra.kcal().toPlainString() : "—", Element.ALIGN_RIGHT);
            addTableRowCell(table, extra.prot() != null ? extra.prot().toPlainString() + "g" : "—",
                    Element.ALIGN_RIGHT);
            addTableRowCell(table, extra.carb() != null ? extra.carb().toPlainString() + "g" : "—",
                    Element.ALIGN_RIGHT);
            addTableRowCell(table, extra.fat() != null ? extra.fat().toPlainString() + "g" : "—",
                    Element.ALIGN_RIGHT);
        }

        doc.add(table);
    }

    private void addGrocerySection(Document doc, String sectionTitle, List<GroceryItem> items)
            throws DocumentException {
        PdfPTable titleTable = new PdfPTable(1);
        titleTable.setWidthPercentage(100);
        titleTable.setSpacingBefore(6f);

        PdfPCell titleCell = new PdfPCell(new Phrase(sectionTitle,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_PRIMARY)));
        titleCell.setBackgroundColor(COLOR_PRIMARY_LIGHT);
        titleCell.setBorderColor(new Color(187, 247, 208));
        titleCell.setPadding(5f);
        titleTable.addCell(titleCell);
        doc.add(titleTable);

        PdfPTable table = new PdfPTable(new float[]{0.6f, 3.5f, 2.2f, 2.2f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(8f);

        addTableHeaderCell(table, "[ ]");
        addTableHeaderCell(table, "Item / Alimento");
        addTableHeaderCell(table, "Porção Diária");
        addTableHeaderCell(table, "Estimativa 7 Dias");

        for (GroceryItem item : items) {
            addTableRowCell(table, "[  ]", Element.ALIGN_CENTER);
            addTableRowCell(table, item.foodName(), Element.ALIGN_LEFT);
            addTableRowCell(table, item.dailyPortion(), Element.ALIGN_LEFT);
            addTableRowCell(table, item.weeklyEstimate(), Element.ALIGN_LEFT);
        }

        doc.add(table);
    }

    private void addBiometryKpisSummary(Document doc, BiometryEvolutionSummaryResponse summary)
            throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(12f);

        String weightStr = summary.currentWeight() != null
                ? summary.currentWeight().toPlainString() + " kg" : "—";
        String fatStr = summary.currentBodyFatPercent() != null
                ? summary.currentBodyFatPercent().toPlainString() + "%" : "—";
        String leanStr = summary.currentLeanMassKg() != null
                ? summary.currentLeanMassKg().toPlainString() + " kg" : "—";
        String fatMassStr = summary.currentFatMassKg() != null
                ? summary.currentFatMassKg().toPlainString() + " kg" : "—";

        addMacroCell(table, "PESO ATUAL", weightStr, COLOR_DARK);
        addMacroCell(table, "% GORDURA", fatStr, new Color(234, 88, 12));
        addMacroCell(table, "MASSA MAGRA", leanStr, COLOR_PRIMARY);
        addMacroCell(table, "MASSA GORDA", fatMassStr, new Color(59, 130, 246));

        doc.add(table);
    }

    private void addAssessmentsHistoryTable(Document doc, List<BiometryAssessmentResponse> assessments)
            throws DocumentException {
        Paragraph heading = new Paragraph("HISTÓRICO DE AVALIAÇÕES BIOMÉTRICAS",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_PRIMARY));
        heading.setSpacingBefore(6f);
        heading.setSpacingAfter(4f);
        doc.add(heading);

        PdfPTable table = new PdfPTable(new float[]{1.5f, 1.2f, 1.2f, 1.2f, 1.2f, 1.2f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(10f);

        addTableHeaderCell(table, "Data");
        addTableHeaderCell(table, "Peso (kg)");
        addTableHeaderCell(table, "% Gordura");
        addTableHeaderCell(table, "Massa Magra");
        addTableHeaderCell(table, "% Água");
        addTableHeaderCell(table, "Gord. Visceral");

        if (assessments == null || assessments.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Nenhuma avaliação cadastrada.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8f, COLOR_MUTED)));
            empty.setColspan(6);
            empty.setPadding(6f);
            table.addCell(empty);
        } else {
            for (BiometryAssessmentResponse a : assessments) {
                String d = a.assessmentDate() != null ? a.assessmentDate().format(DATE_FORMATTER) : "—";
                String w = a.weight() != null ? a.weight().toPlainString() : "—";
                String f = a.bodyFatPercent() != null ? a.bodyFatPercent().toPlainString() + "%" : "—";
                String l = a.leanMassKg() != null ? a.leanMassKg().toPlainString() + " kg" : "—";
                String water = a.waterPercent() != null ? a.waterPercent().toPlainString() + "%" : "—";
                String v = a.visceralFatLevel() != null ? a.visceralFatLevel().toString() : "—";

                addTableRowCell(table, d, Element.ALIGN_CENTER);
                addTableRowCell(table, w, Element.ALIGN_RIGHT);
                addTableRowCell(table, f, Element.ALIGN_RIGHT);
                addTableRowCell(table, l, Element.ALIGN_RIGHT);
                addTableRowCell(table, water, Element.ALIGN_RIGHT);
                addTableRowCell(table, v, Element.ALIGN_CENTER);
            }
        }

        doc.add(table);
    }

    private void addPerimetrySection(Document doc, List<PerimetryDeltaResponse> deltas)
            throws DocumentException {
        Paragraph heading = new Paragraph("MEDIDAS CORPORAIS & CIRCUNFERÊNCIAS (cm)",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_PRIMARY));
        heading.setSpacingBefore(6f);
        heading.setSpacingAfter(4f);
        doc.add(heading);

        PdfPTable table = new PdfPTable(new float[]{2.5f, 1.5f, 1.5f, 1.5f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(10f);

        addTableHeaderCell(table, "Região Anatômica");
        addTableHeaderCell(table, "Medida Inicial");
        addTableHeaderCell(table, "Medida Atual");
        addTableHeaderCell(table, "Variação");

        for (PerimetryDeltaResponse p : deltas) {
            String label = p.label() != null ? p.label() : p.measureKey();
            String initial = p.initialCm() != null ? p.initialCm().toPlainString() + " cm" : "—";
            String current = p.currentCm() != null ? p.currentCm().toPlainString() + " cm" : "—";
            String deltaStr = p.deltaCm() != null
                    ? (p.deltaCm().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + p.deltaCm().toPlainString() + " cm"
                    : "—";

            addTableRowCell(table, label, Element.ALIGN_LEFT);
            addTableRowCell(table, initial, Element.ALIGN_RIGHT);
            addTableRowCell(table, current, Element.ALIGN_RIGHT);
            addTableRowCell(table, deltaStr, Element.ALIGN_RIGHT);
        }

        doc.add(table);
    }

    private void addClinicalGuidanceFooter(Document doc, Nutritionist nutri) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingBefore(12f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8f);

        String regText = (nutri.getCrnRegional() != null ? nutri.getCrnRegional() : "CRN")
                + " " + (nutri.getCrn() != null ? nutri.getCrn() : "");

        Paragraph pDisclaimer = new Paragraph(
                "Relatório de acompanhamento individual e confidencial emitido pela plataforma Compas. "
                        + "Os dados biométricos refletem as avaliações registradas por "
                        + nutri.getDisplayName() + " (" + regText + ").",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7.5f, COLOR_MUTED)
        );
        cell.addElement(pDisclaimer);
        table.addCell(cell);

        doc.add(table);
    }

    // =========================================================================
    // Grocery Categorization & Helper Logic
    // =========================================================================

    private record GroceryItem(String foodName, String dailyPortion, String weeklyEstimate) {}

    private Map<String, List<GroceryItem>> categorizePlanFoods(PlanResponse plan) {
        Map<String, List<GroceryItem>> sections = new LinkedHashMap<>();
        sections.put("🥦 HORTIFRÚTI, VEGETAIS & FRUTAS", new ArrayList<>());
        sections.put("🥩 AÇOUGUE, OVOS & PESCADOS", new ArrayList<>());
        sections.put("🥛 LATICÍNIOS & DERIVADOS", new ArrayList<>());
        sections.put("🌾 MERCEARIA, GRÃOS & CEREAIS", new ArrayList<>());
        sections.put("🌿 SUPLEMENTOS, TEMPEROS & OUTROS", new ArrayList<>());

        if (plan.meals() == null) {
            return sections;
        }

        for (MealSlotResponse slot : plan.meals()) {
            if (slot.options() == null || slot.options().isEmpty()) {
                continue;
            }
            MealOptionResponse primaryOpt = slot.options().get(0);
            if (primaryOpt.items() == null) {
                continue;
            }

            for (MealFoodResponse food : primaryOpt.items()) {
                String name = food.foodName();
                String category = detectCategory(name);
                String daily = formatQuantity(food.referenceAmount(), food.unit());
                String weekly = estimateWeekly(food.referenceAmount(), food.unit());

                sections.get(category).add(new GroceryItem(name, daily, weekly));
            }
        }

        return sections;
    }

    private String detectCategory(String foodName) {
        if (foodName == null) {
            return "🌾 MERCEARIA, GRÃOS & CEREAIS";
        }
        String lower = foodName.toLowerCase(Locale.ROOT);

        if (HORTIFRUTI_KEYWORDS.stream().anyMatch(lower::contains)) {
            return "🥦 HORTIFRÚTI, VEGETAIS & FRUTAS";
        }
        if (ACOUGUE_KEYWORDS.stream().anyMatch(lower::contains)) {
            return "🥩 AÇOUGUE, OVOS & PESCADOS";
        }
        if (LATICINIOS_KEYWORDS.stream().anyMatch(lower::contains)) {
            return "🥛 LATICÍNIOS & DERIVADOS";
        }
        if (SUPLEMENTOS_KEYWORDS.stream().anyMatch(lower::contains)) {
            return "🌿 SUPLEMENTOS, TEMPEROS & OUTROS";
        }

        return "🌾 MERCEARIA, GRÃOS & CEREAIS";
    }

    private String estimateWeekly(BigDecimal amount, String unit) {
        if (amount == null) {
            return "Conforme rotina";
        }
        BigDecimal weeklyAmount = amount.multiply(BigDecimal.valueOf(7));
        String unitSafe = unit != null ? unit.trim() : "g";

        if ("g".equalsIgnoreCase(unitSafe) && weeklyAmount.compareTo(BigDecimal.valueOf(1000)) >= 0) {
            BigDecimal kg = weeklyAmount.divide(BigDecimal.valueOf(1000), 1, java.math.RoundingMode.HALF_UP);
            return "~" + kg.toPlainString() + " kg";
        }
        return "~" + weeklyAmount.toPlainString() + " " + unitSafe;
    }

    private void addTableHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(
                new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, COLOR_MUTED)));
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(4.5f);
        table.addCell(cell);
    }

    private void addTableRowCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(
                new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 8f, COLOR_DARK)));
        cell.setHorizontalAlignment(alignment);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(4.5f);
        table.addCell(cell);
    }

    private String formatQuantity(BigDecimal amount, String unit) {
        if (amount == null) {
            return "A gosto";
        }
        return amount.toPlainString() + (unit != null && !unit.isBlank() ? " " + unit : "g");
    }

    private Patient verifyPatientAndGet(UUID nutritionistId, UUID patientId) {
        return patientRepository.findById(patientId)
                .filter(p -> p.getNutritionistId().equals(nutritionistId))
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
    }

    private Nutritionist getNutritionist(UUID nutritionistId) {
        return nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Nutricionista", nutritionistId));
    }

    // =========================================================================
    // Header & Footer Page Event Helper
    // =========================================================================

    private static class HeaderFooterPageEvent extends PdfPageEventHelper {
        private final String footerDocLabel;

        HeaderFooterPageEvent(String footerDocLabel) {
            this.footerDocLabel = footerDocLabel;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                PdfPTable footer = new PdfPTable(2);
                footer.setWidths(new float[]{3.5f, 1f});
                footer.setTotalWidth(document.right() - document.left());

                Font font = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_MUTED);

                PdfPCell textCell = new PdfPCell(new Phrase(footerDocLabel, font));
                textCell.setBorder(Rectangle.TOP);
                textCell.setBorderColor(COLOR_BORDER);
                textCell.setPaddingTop(4f);
                footer.addCell(textCell);

                PdfPCell pageCell = new PdfPCell(new Phrase("Pág. " + writer.getPageNumber(), font));
                pageCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                pageCell.setBorder(Rectangle.TOP);
                pageCell.setBorderColor(COLOR_BORDER);
                pageCell.setPaddingTop(4f);
                footer.addCell(pageCell);

                footer.writeSelectedRows(0, -1, document.left(), document.bottom() - 10, writer.getDirectContent());
            } catch (Exception e) {
                // Ignore footer draw exceptions
            }
        }
    }
}
