package com.compas.api.service;

import com.compas.api.dto.prescription.CreatePrescriptionRequest;
import com.compas.api.dto.prescription.PrescriptionCatalogItemResponse;
import com.compas.api.dto.prescription.PrescriptionItemRequest;
import com.compas.api.dto.prescription.PrescriptionItemResponse;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PrescriptionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PrescriptionService.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.of("pt", "BR"));

    private static final Color COLOR_PRIMARY = new Color(22, 101, 52); // #166534
    private static final Color COLOR_PRIMARY_LIGHT = new Color(240, 253, 244); // #F0FDF4
    private static final Color COLOR_DARK = new Color(17, 24, 39); // #111827
    private static final Color COLOR_MUTED = new Color(100, 116, 139); // #64748B
    private static final Color COLOR_BORDER = new Color(226, 232, 240); // #E2E8F0
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252); // #F8FAFC
    private static final Color COLOR_WHITE = Color.WHITE;

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PatientRepository patientRepository;
    private final NutritionistRepository nutritionistRepository;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionItemRepository prescriptionItemRepository,
            PatientRepository patientRepository,
            NutritionistRepository nutritionistRepository
    ) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.patientRepository = patientRepository;
        this.nutritionistRepository = nutritionistRepository;
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> listPrescriptions(UUID nutritionistId, UUID patientId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        List<Prescription> prescriptions = prescriptionRepository
                .findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(patientId, nutritionistId);

        List<PrescriptionResponse> responses = new ArrayList<>();
        for (Prescription p : prescriptions) {
            List<PrescriptionItem> items = prescriptionItemRepository
                    .findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(p.getId(), nutritionistId);
            responses.add(buildPrescriptionResponse(p, items, patient));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescription(UUID nutritionistId, UUID patientId, UUID prescriptionId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Prescription prescription = prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId)
                .filter(p -> p.getPatientId().equals(patientId))
                .orElseThrow(() -> new ResourceNotFoundException("Prescrição", prescriptionId));

        List<PrescriptionItem> items = prescriptionItemRepository
                .findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
                        prescription.getId(), nutritionistId);
        return buildPrescriptionResponse(prescription, items, patient);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getActivePrescription(UUID nutritionistId, UUID patientId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Prescription prescription = prescriptionRepository
                .findFirstByPatientIdAndNutritionistIdAndStatusOrderByCreatedAtDesc(
                        patientId, nutritionistId, PrescriptionStatus.ACTIVE)
                .orElse(null);

        if (prescription == null) {
            return null;
        }

        List<PrescriptionItem> items = prescriptionItemRepository
                .findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
                        prescription.getId(), nutritionistId);
        return buildPrescriptionResponse(prescription, items, patient);
    }

    @Transactional
    public PrescriptionResponse createPrescription(
            UUID nutritionistId, UUID patientId, CreatePrescriptionRequest request) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);

        PrescriptionStatus status = request.status() != null ? request.status() : PrescriptionStatus.ACTIVE;
        if (status == PrescriptionStatus.ACTIVE) {
            archiveExistingActivePrescriptions(nutritionistId, patientId);
        }

        Prescription prescription = Prescription.builder()
                .patientId(patientId)
                .nutritionistId(nutritionistId)
                .title(request.title())
                .notes(request.notes())
                .status(status)
                .build();
        prescription = prescriptionRepository.save(prescription);

        List<PrescriptionItem> savedItems = savePrescriptionItems(
                nutritionistId, prescription.getId(), request.items());
        return buildPrescriptionResponse(prescription, savedItems, patient);
    }

    @Transactional
    public PrescriptionResponse updatePrescription(
            UUID nutritionistId, UUID patientId, UUID prescriptionId, UpdatePrescriptionRequest request) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Prescription prescription = prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId)
                .filter(p -> p.getPatientId().equals(patientId))
                .orElseThrow(() -> new ResourceNotFoundException("Prescrição", prescriptionId));

        PrescriptionStatus newStatus = request.status() != null ? request.status() : prescription.getStatus();
        if (newStatus == PrescriptionStatus.ACTIVE && prescription.getStatus() != PrescriptionStatus.ACTIVE) {
            archiveExistingActivePrescriptions(nutritionistId, patientId);
        }

        prescription.setTitle(request.title());
        prescription.setNotes(request.notes());
        prescription.setStatus(newStatus);
        prescription = prescriptionRepository.save(prescription);

        prescriptionItemRepository.deleteByPrescriptionIdAndNutritionistId(prescriptionId, nutritionistId);
        List<PrescriptionItem> savedItems = savePrescriptionItems(
                nutritionistId, prescriptionId, request.items());

        return buildPrescriptionResponse(prescription, savedItems, patient);
    }

    @Transactional
    public void deletePrescription(UUID nutritionistId, UUID patientId, UUID prescriptionId) {
        verifyPatientAndGet(nutritionistId, patientId);
        Prescription prescription = prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId)
                .filter(p -> p.getPatientId().equals(patientId))
                .orElseThrow(() -> new ResourceNotFoundException("Prescrição", prescriptionId));

        prescriptionItemRepository.deleteByPrescriptionIdAndNutritionistId(prescriptionId, nutritionistId);
        prescriptionRepository.delete(prescription);
    }

    @Transactional(readOnly = true)
    public byte[] generatePrescriptionPdf(UUID nutritionistId, UUID patientId, UUID prescriptionId) {
        Patient patient = verifyPatientAndGet(nutritionistId, patientId);
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Nutricionista", nutritionistId));
        Prescription prescription = prescriptionRepository.findByIdAndNutritionistId(prescriptionId, nutritionistId)
                .filter(p -> p.getPatientId().equals(patientId))
                .orElseThrow(() -> new ResourceNotFoundException("Prescrição", prescriptionId));
        List<PrescriptionItem> items = prescriptionItemRepository
                .findByPrescriptionIdAndNutritionistIdOrderByDisplayOrderAscCreatedAtAsc(
                        prescriptionId, nutritionistId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 44, 44);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PrescriptionPageEvent(
                    "Receituário & Suplementação · " + patient.getName() + " · " + nutritionist.getDisplayName()
            ));

            document.open();
            addPdfHeader(document, nutritionist, patient, prescription);
            addPdfItemsTable(document, items);
            if (prescription.getNotes() != null && !prescription.getNotes().isBlank()) {
                addPdfNotes(document, prescription.getNotes());
            }
            addPdfSignature(document, nutritionist);
            document.close();

            return out.toByteArray();
        } catch (DocumentException e) {
            LOGGER.error("Falha ao gerar PDF de prescrição para paciente {}", patientId, e);
            throw new IllegalStateException("Falha ao gerar PDF da prescrição", e);
        } catch (Exception e) {
            LOGGER.error("Erro inesperado gerando PDF de prescrição para paciente {}", patientId, e);
            throw new IllegalStateException("Erro ao gerar documento de prescrição", e);
        }
    }

    public List<PrescriptionCatalogItemResponse> getSupplementLibrary() {
        return List.of(
                new PrescriptionCatalogItemResponse(
                        "creatina",
                        "Creatina Monohidratada",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "5g",
                        "Pó",
                        "Logo após o treino ou pela manhã",
                        "Uso contínuo",
                        true,
                        "Preferir selo Creapure. Diluir em 200ml de água ou suco com carboidrato para melhor absorção.",
                        "Aumento de força muscular, potência e recuperação de estoques de ATP fosfocreatina."
                ),
                new PrescriptionCatalogItemResponse(
                        "whey-isolado",
                        "Whey Protein Isolado (WPI)",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "30g (1 scoop)",
                        "Pó",
                        "Pós-treino imediato ou lanche intermediário",
                        "Uso contínuo",
                        true,
                        "Bater com 200ml de água gelada ou leite vegetal.",
                        "Aporte proteico rápido com baixo teor de lactose e gorduras para síntese proteica."
                ),
                new PrescriptionCatalogItemResponse(
                        "omega-3-tg",
                        "Ômega 3 TG 1000mg",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "2 cápsulas",
                        "Cápsula",
                        "Junto com o almoço ou jantar",
                        "Uso contínuo",
                        true,
                        "Preferir matéria-prima com certificação IFOS (livre de metais pesados). Mínimo 800mg EPA+DHA.",
                        "Ação anti-inflamatória sistêmica, modulação lipídica e suporte cardiovascular."
                ),
                new PrescriptionCatalogItemResponse(
                        "vitamina-d3",
                        "Vitamina D3 (Colecalciferol)",
                        PrescriptionCategory.VITAMIN_MINERAL,
                        "Vitamina / Mineral",
                        "2.000 UI",
                        "Gotas ou Cápsula",
                        "Junto com a primeira refeição sólida rica em gorduras",
                        "60 a 90 dias",
                        false,
                        "Vitamina lipossolúvel; tomar junto a alimentos fontes de lipídios saudáveis.",
                        "Otimização da imunidade, homeostase do cálcio e densidade mineral óssea."
                ),
                new PrescriptionCatalogItemResponse(
                        "magnesio-dimalato",
                        "Magnésio Dimalato",
                        PrescriptionCategory.VITAMIN_MINERAL,
                        "Vitamina / Mineral",
                        "350mg",
                        "Cápsula",
                        "30 a 45 minutos antes de dormir",
                        "Uso contínuo",
                        true,
                        "Ingerir com um copo de água.",
                        "Relaxamento muscular, redução de fadiga neuromuscular e melhora da qualidade do sono."
                ),
                new PrescriptionCatalogItemResponse(
                        "melatonina",
                        "Melatonina Microdosada",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "0,5mg a 1mg",
                        "Gotas sublinguais ou Cápsula",
                        "30 a 60 minutos antes de se deitar, no escuro",
                        "30 a 60 dias",
                        false,
                        "Evitar telas luminosas (celular, TV) após a ingestão para eficácia do ciclo circadiano.",
                        "Indução e sincronização do sono reparador profundo."
                ),
                new PrescriptionCatalogItemResponse(
                        "coenzima-q10",
                        "Coenzima Q10 (Ubiquinona)",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "100mg",
                        "Cápsula",
                        "Após o café da manhã ou almoço",
                        "Uso contínuo",
                        true,
                        "Melhor absorvida na presença de lipídios.",
                        "Potente antioxidante celular e suporte à bioenergética mitocondrial."
                ),
                new PrescriptionCatalogItemResponse(
                        "cafeina-anidra",
                        "Cafeína Anidra",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "150mg a 200mg",
                        "Cápsula",
                        "45 minutos antes do treino",
                        "Dias de treino",
                        false,
                        "Não utilizar após as 16h para não prejudicar o sono.",
                        "Estímulo do sistema nervoso central, foco atencional e rendimento em treinos de alta intensidade."
                ),
                new PrescriptionCatalogItemResponse(
                        "beta-alanina",
                        "Beta-Alanina",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "3g",
                        "Pó",
                        "Dividir em 2 tomadas de 1,5g ao dia",
                        "Uso contínuo (carregamento crônico)",
                        true,
                        "Pode provocar sensação passageira de parestesia (formigamento inofensivo).",
                        "Aumento da carnosina muscular e tamponamento de íons H+ (reduz fadiga ácida)."
                ),
                new PrescriptionCatalogItemResponse(
                        "glutamina",
                        "L-Glutamina",
                        PrescriptionCategory.SUPPLEMENT,
                        "Suplemento",
                        "5g",
                        "Pó",
                        "Em jejum ao acordar ou antes de dormir",
                        "Uso contínuo",
                        true,
                        "Diluir em 100ml de água em temperatura ambiente.",
                        "Combustível para enterócitos e suporte à integridade da barreira intestinal."
                ),
                new PrescriptionCatalogItemResponse(
                        "multivitaminico",
                        "Complexo Multivitamínico Quelado",
                        PrescriptionCategory.VITAMIN_MINERAL,
                        "Vitamina / Mineral",
                        "1 cápsula",
                        "Cápsula",
                        "Após o café da manhã",
                        "Uso contínuo",
                        true,
                        "Preferir minerais quelados para biodisponibilidade superior.",
                        "Adequação diária de micronutrientes antioxidantes e cofatores metabólicos."
                )
        );
    }

    private void archiveExistingActivePrescriptions(UUID nutritionistId, UUID patientId) {
        List<Prescription> actives = prescriptionRepository
                .findByPatientIdAndNutritionistIdOrderByCreatedAtDesc(patientId, nutritionistId);
        for (Prescription p : actives) {
            if (p.getStatus() == PrescriptionStatus.ACTIVE) {
                p.setStatus(PrescriptionStatus.ARCHIVED);
                prescriptionRepository.save(p);
            }
        }
    }

    private List<PrescriptionItem> savePrescriptionItems(
            UUID nutritionistId, UUID prescriptionId, List<PrescriptionItemRequest> itemRequests) {
        List<PrescriptionItem> items = new ArrayList<>();
        int order = 0;
        for (PrescriptionItemRequest req : itemRequests) {
            PrescriptionCategory cat = req.category() != null ? req.category() : PrescriptionCategory.SUPPLEMENT;
            boolean isContinuous = req.isContinuous() != null ? req.isContinuous() : true;
            int itemOrder = req.displayOrder() != null ? req.displayOrder() : order;
            order = Math.max(order, itemOrder) + 1;
            PrescriptionItem item = PrescriptionItem.builder()
                    .prescriptionId(prescriptionId)
                    .nutritionistId(nutritionistId)
                    .name(req.name())
                    .category(cat)
                    .dosage(req.dosage())
                    .form(req.form() != null ? req.form() : "Pó")
                    .timing(req.timing())
                    .duration(req.duration() != null ? req.duration() : "Uso contínuo")
                    .isContinuous(isContinuous)
                    .instructions(req.instructions())
                    .displayOrder(itemOrder)
                    .build();
            items.add(prescriptionItemRepository.save(item));
        }
        return items;
    }

    private PrescriptionResponse buildPrescriptionResponse(
            Prescription prescription, List<PrescriptionItem> items, Patient patient) {
        List<PrescriptionItemResponse> itemResponses = new ArrayList<>();
        for (PrescriptionItem item : items) {
            itemResponses.add(new PrescriptionItemResponse(
                    item.getId(),
                    item.getPrescriptionId(),
                    item.getName(),
                    item.getCategory(),
                    item.getCategory().getPortugueseLabel(),
                    item.getDosage(),
                    item.getForm(),
                    item.getTiming(),
                    item.getDuration(),
                    item.getIsContinuous(),
                    item.getInstructions(),
                    item.getDisplayOrder()
            ));
        }

        String summary = buildTextSummary(prescription, itemResponses);
        String whatsapp = buildWhatsappMessage(prescription, itemResponses, patient);

        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getPatientId(),
                patient.getName(),
                prescription.getTitle(),
                prescription.getNotes(),
                prescription.getStatus(),
                prescription.getStatus().getPortugueseLabel(),
                prescription.getCreatedAt(),
                prescription.getUpdatedAt(),
                itemResponses,
                itemResponses.size(),
                summary,
                whatsapp
        );
    }

    private String buildTextSummary(Prescription p, List<PrescriptionItemResponse> items) {
        StringBuilder sb = new StringBuilder();
        sb.append(p.getTitle()).append(" (").append(items.size()).append(" itens): ");
        for (int i = 0; i < items.size(); i++) {
            PrescriptionItemResponse item = items.get(i);
            sb.append(item.name()).append(" [").append(item.dosage()).append("]");
            if (i < items.size() - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }

    private String buildWhatsappMessage(
            Prescription p, List<PrescriptionItemResponse> items, Patient patient) {
        StringBuilder sb = new StringBuilder();
        sb.append("📋 *PRESCRIÇÃO & SUPLEMENTAÇÃO*\n");
        sb.append("👤 *Paciente:* ").append(patient.getName()).append("\n");
        if (p.getCreatedAt() != null) {
            sb.append("📅 *Data:* ").append(p.getCreatedAt().format(DATE_FORMATTER)).append("\n");
        }
        sb.append("\n*").append(p.getTitle()).append("*\n");

        if (p.getNotes() != null && !p.getNotes().isBlank()) {
            sb.append("📝 _").append(p.getNotes().trim()).append("_\n");
        }
        sb.append("\n💊 *ITENS PRESCRITOS:*\n\n");

        for (int i = 0; i < items.size(); i++) {
            PrescriptionItemResponse it = items.get(i);
            sb.append((i + 1)).append("️⃣ *").append(it.name()).append("* (").append(it.form()).append(")\n");
            sb.append("   • *Posologia:* ").append(it.dosage()).append("\n");
            sb.append("   • *Horário:* ").append(it.timing()).append("\n");
            sb.append("   • *Duração:* ").append(it.duration()).append("\n");
            if (it.instructions() != null && !it.instructions().isBlank()) {
                sb.append("   • *Obs:* ").append(it.instructions().trim()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("Qualquer dúvida sobre dosagens ou manipulação, estou à disposição! 🚀");
        return sb.toString();
    }

    private Patient verifyPatientAndGet(UUID nutritionistId, UUID patientId) {
        return patientRepository.findById(patientId)
                .filter(p -> p.getNutritionistId().equals(nutritionistId))
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", patientId));
    }

    private void addPdfHeader(
            Document document, Nutritionist nutritionist, Patient patient, Prescription p)
            throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{3f, 2f});
        header.setSpacingAfter(16f);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f, COLOR_PRIMARY);
        leftCell.addElement(new Paragraph("COMPAS CLINICAL", brandFont));

        Font nutriFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, COLOR_DARK);
        leftCell.addElement(new Paragraph(nutritionist.getDisplayName(), nutriFont));

        String crnInfo = "CRN: " + (nutritionist.getCrn() != null ? nutritionist.getCrn() : "Não informado");
        if (nutritionist.getCrnRegional() != null && !nutritionist.getCrnRegional().isBlank()) {
            crnInfo += " - Regional " + nutritionist.getCrnRegional();
        }
        Font crnFont = FontFactory.getFont(FontFactory.HELVETICA, 9f, COLOR_MUTED);
        leftCell.addElement(new Paragraph(crnInfo, crnFont));

        if (nutritionist.getSpecialty() != null && !nutritionist.getSpecialty().isBlank()) {
            leftCell.addElement(new Paragraph(nutritionist.getSpecialty(), crnFont));
        }

        header.addCell(leftCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(0);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Font docTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, COLOR_DARK);
        Paragraph pTitle = new Paragraph("RECEITUÁRIO DE SUPLEMENTAÇÃO", docTitleFont);
        pTitle.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pTitle);

        Font patFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, COLOR_DARK);
        Paragraph pPat = new Paragraph("Paciente: " + patient.getName(), patFont);
        pPat.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pPat);

        String dateStr = p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FORMATTER) : "";
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_MUTED);
        Paragraph pDate = new Paragraph("Data de Emissão: " + dateStr, dateFont);
        pDate.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(pDate);

        header.addCell(rightCell);
        document.add(header);
    }

    private void addPdfItemsTable(Document document, List<PrescriptionItem> items) throws DocumentException {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 1.2f, 1.0f, 2.3f, 1.5f});
        table.setSpacingAfter(14f);

        addTableHeaderCell(table, "Item / Suplemento");
        addTableHeaderCell(table, "Dose");
        addTableHeaderCell(table, "Forma");
        addTableHeaderCell(table, "Horário & Instruções");
        addTableHeaderCell(table, "Duração");

        for (PrescriptionItem it : items) {
            String itemText = it.getName();
            if (it.getInstructions() != null && !it.getInstructions().isBlank()) {
                itemText += "\nObs: " + it.getInstructions().trim();
            }
            addTableCell(table, itemText, Element.ALIGN_LEFT);
            addTableCell(table, it.getDosage(), Element.ALIGN_LEFT);
            addTableCell(table, it.getForm(), Element.ALIGN_CENTER);
            addTableCell(table, it.getTiming(), Element.ALIGN_LEFT);
            addTableCell(table, it.getDuration(), Element.ALIGN_CENTER);
        }

        document.add(table);
    }

    private void addPdfNotes(Document document, String notes) throws DocumentException {
        PdfPTable notesBox = new PdfPTable(1);
        notesBox.setWidthPercentage(100);
        notesBox.setSpacingAfter(16f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8f);

        Font tFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, COLOR_DARK);
        cell.addElement(new Paragraph("Orientações e Observações Clínicas:", tFont));

        Font bFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_DARK);
        cell.addElement(new Paragraph(notes.trim(), bFont));

        notesBox.addCell(cell);
        document.add(notesBox);
    }

    private void addPdfSignature(Document document, Nutritionist nutritionist) throws DocumentException {
        PdfPTable signTable = new PdfPTable(1);
        signTable.setWidthPercentage(60);
        signTable.setSpacingBefore(30f);
        signTable.setHorizontalAlignment(Element.ALIGN_CENTER);

        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.TOP);
        cell.setBorderColor(COLOR_DARK);
        cell.setPaddingTop(4f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_DARK);
        Paragraph pName = new Paragraph(nutritionist.getDisplayName(), nameFont);
        pName.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pName);

        String crn = "Nutricionista · CRN " + (nutritionist.getCrn() != null ? nutritionist.getCrn() : "");
        Font crnFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_MUTED);
        Paragraph pCrn = new Paragraph(crn, crnFont);
        pCrn.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pCrn);

        signTable.addCell(cell);
        document.add(signTable);
    }

    private void addTableHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(
                text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_DARK)));
        cell.setBackgroundColor(COLOR_PRIMARY_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(
                text, FontFactory.getFont(FontFactory.HELVETICA, 8f, COLOR_DARK)));
        cell.setHorizontalAlignment(align);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private static class PrescriptionPageEvent extends PdfPageEventHelper {
        private final String label;

        PrescriptionPageEvent(String label) {
            this.label = label;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                PdfPTable footer = new PdfPTable(2);
                footer.setWidths(new float[]{3.5f, 1f});
                footer.setTotalWidth(document.right() - document.left());

                Font font = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_MUTED);

                PdfPCell textCell = new PdfPCell(new Phrase(label, font));
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
            } catch (Exception ignored) {
                // Ignore footer draw exceptions
            }
        }
    }
}
