package com.compas.api.service;

import com.compas.api.dto.whatsapp.fleet.CreateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.FleetSummaryDTO;
import com.compas.api.dto.whatsapp.fleet.InstancePatientDTO;
import com.compas.api.dto.whatsapp.fleet.InstanceQrCodeResponse;
import com.compas.api.dto.whatsapp.fleet.UpdateWhatsAppInstanceRequest;
import com.compas.api.dto.whatsapp.fleet.WhatsAppFleetInstanceDTO;
import com.compas.api.model.Patient;
import com.compas.api.model.WhatsAppInstance;
import com.compas.api.model.WhatsAppInstanceStatus;
import com.compas.api.repository.PatientRepository;
import com.compas.api.repository.WhatsAppInstanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WhatsAppFleetService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppFleetService.class);

    private final WhatsAppInstanceRepository instanceRepository;
    private final PatientRepository patientRepository;
    private final EvolutionApiService evolutionApiService;
    private final TransactionTemplate transactionTemplate;

    public WhatsAppFleetService(
            WhatsAppInstanceRepository instanceRepository,
            PatientRepository patientRepository,
            EvolutionApiService evolutionApiService,
            PlatformTransactionManager transactionManager) {
        this.instanceRepository = instanceRepository;
        this.patientRepository = patientRepository;
        this.evolutionApiService = evolutionApiService;
        this.transactionTemplate = transactionManager != null ? new TransactionTemplate(transactionManager) : null;
    }

    @Transactional(readOnly = true)
    public List<WhatsAppFleetInstanceDTO> listFleetInstances() {
        List<WhatsAppInstance> instances = instanceRepository.findAllByOrderByCreatedAtDesc();
        return instances.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public FleetSummaryDTO getFleetSummary() {
        List<WhatsAppInstance> instances = instanceRepository.findAll();
        int totalInstances = instances.size();
        int connected = 0;
        int disconnected = 0;
        long totalAssigned = 0;
        long totalCapacity = 0;
        int alerts = 0;

        for (WhatsAppInstance inst : instances) {
            long pCount = patientRepository.countByWhatsappInstanceIdAndActiveTrue(inst.getId());
            totalAssigned += pCount;
            totalCapacity += inst.getMaxPatients();

            boolean isActive = Boolean.TRUE.equals(inst.getActive());

            if (inst.getStatus() == WhatsAppInstanceStatus.CONNECTED) {
                connected++;
            } else if (inst.getStatus() == WhatsAppInstanceStatus.DISCONNECTED
                    || inst.getStatus() == WhatsAppInstanceStatus.BANNED) {
                disconnected++;
                if (isActive) {
                    alerts++;
                }
            }

            if (isActive && inst.getMaxPatients() > 0 && pCount >= inst.getMaxPatients() * 0.9) {
                alerts++;
            }
        }

        return new FleetSummaryDTO(totalInstances, connected, disconnected, totalAssigned, totalCapacity, alerts);
    }

    @Transactional(readOnly = true)
    public WhatsAppFleetInstanceDTO getInstance(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);
        return toDTO(instance);
    }

    public WhatsAppFleetInstanceDTO createInstance(CreateWhatsAppInstanceRequest request) {
        String normalizedName = request.name().trim().toLowerCase();
        if (instanceRepository.findByName(normalizedName).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe uma instância com o nome '" + normalizedName + "'"
            );
        }

        int maxPatients = request.maxPatients() != null ? request.maxPatients() : 180;
        WhatsAppInstance instance = WhatsAppInstance.builder()
                .name(normalizedName)
                .phoneNumber(request.phoneNumber() != null ? request.phoneNumber().trim() : null)
                .description(request.description() != null ? request.description().trim() : null)
                .status(WhatsAppInstanceStatus.DISCONNECTED)
                .maxPatients(maxPatients)
                .active(true)
                .build();

        WhatsAppInstance saved = instanceRepository.save(instance);

        // Async or non-blocking attempt to create instance in Evolution API
        try {
            evolutionApiService.createInstance(normalizedName);
        } catch (Exception e) {
            log.warn("Could not register instance {} in Evolution API immediately: {}", normalizedName, e.getMessage());
        }

        return toDTO(saved);
    }

    @Transactional
    public WhatsAppFleetInstanceDTO updateInstance(UUID id, UpdateWhatsAppInstanceRequest request) {
        WhatsAppInstance instance = findInstanceOrThrow(id);

        if (request.phoneNumber() != null) {
            instance.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.description() != null) {
            instance.setDescription(request.description().trim());
        }
        if (request.maxPatients() != null && request.maxPatients() > 0) {
            instance.setMaxPatients(request.maxPatients());
        }
        if (request.active() != null) {
            instance.setActive(request.active());
        }
        if (request.status() != null) {
            instance.setStatus(request.status());
            if (request.status() == WhatsAppInstanceStatus.BANNED || request.status() == WhatsAppInstanceStatus.DISABLED) {
                if (instance.getDisconnectedAt() == null) {
                    instance.setDisconnectedAt(LocalDateTime.now());
                }
            }
        }

        WhatsAppInstance updated = instanceRepository.save(instance);

        if (request.status() == WhatsAppInstanceStatus.BANNED || request.status() == WhatsAppInstanceStatus.DISABLED) {
            autoFailover(id);
        }

        return toDTO(updated);
    }

    public InstanceQrCodeResponse connectInstance(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);

        Optional<String> qrCodeOpt = evolutionApiService.fetchQrCode(instance.getName());
        String qrCode = qrCodeOpt.orElse(null);

        if (qrCode != null && !qrCode.isBlank()) {
            instance.setQrCodeBase64(qrCode);
            instance.setStatus(WhatsAppInstanceStatus.CONNECTING);
            instanceRepository.save(instance);
            return new InstanceQrCodeResponse(
                    instance.getId(),
                    instance.getName(),
                    qrCode,
                    WhatsAppInstanceStatus.CONNECTING,
                    "QR Code obtido com sucesso. Aponte a câmera do WhatsApp para conectar."
            );
        }

        // Check if it was already connected
        Optional<String> stateOpt = evolutionApiService.fetchConnectionState(instance.getName());
        if (stateOpt.isPresent() && "open".equalsIgnoreCase(stateOpt.get())) {
            instance.setStatus(WhatsAppInstanceStatus.CONNECTED);
            instance.setQrCodeBase64(null);
            instance.setLastHeartbeatAt(LocalDateTime.now());
            instanceRepository.save(instance);
            return new InstanceQrCodeResponse(
                    instance.getId(),
                    instance.getName(),
                    null,
                    WhatsAppInstanceStatus.CONNECTED,
                    "Esta instância já se encontra conectada."
            );
        }

        return new InstanceQrCodeResponse(
                instance.getId(),
                instance.getName(),
                instance.getQrCodeBase64(),
                instance.getStatus(),
                "Aguardando geração do QR Code pela Evolution API. Tente novamente em alguns segundos."
        );
    }

    public WhatsAppFleetInstanceDTO syncInstanceStatus(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);

        Optional<String> stateOpt = evolutionApiService.fetchConnectionState(instance.getName());
        if (stateOpt.isPresent()) {
            String state = stateOpt.get();
            if ("open".equalsIgnoreCase(state)) {
                instance.setStatus(WhatsAppInstanceStatus.CONNECTED);
                instance.setLastHeartbeatAt(LocalDateTime.now());
                instance.setQrCodeBase64(null);
            } else if ("close".equalsIgnoreCase(state)) {
                if (instance.getStatus() == WhatsAppInstanceStatus.CONNECTED) {
                    instance.setDisconnectedAt(LocalDateTime.now());
                }
                instance.setStatus(WhatsAppInstanceStatus.DISCONNECTED);
            } else if ("connecting".equalsIgnoreCase(state)) {
                instance.setStatus(WhatsAppInstanceStatus.CONNECTING);
            } else if ("banned".equalsIgnoreCase(state) || "unpaired".equalsIgnoreCase(state)) {
                instance.setStatus(WhatsAppInstanceStatus.BANNED);
                instance.setDisconnectedAt(LocalDateTime.now());
            }
            instanceRepository.save(instance);

            if (instance.getStatus() == WhatsAppInstanceStatus.BANNED) {
                autoFailover(id);
            }
        }

        return toDTO(instance);
    }

    public void restartInstance(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);
        boolean success = evolutionApiService.restartInstance(instance.getName());
        if (!success) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Falha ao reiniciar instância no gateway Evolution");
        }
        instance.setStatus(WhatsAppInstanceStatus.CONNECTING);
        instanceRepository.save(instance);
    }

    public void disconnectInstance(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);
        boolean success = evolutionApiService.logoutInstance(instance.getName());
        if (!success) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Falha ao desconectar instância no gateway Evolution");
        }

        instance.setStatus(WhatsAppInstanceStatus.DISCONNECTED);
        instance.setDisconnectedAt(LocalDateTime.now());
        instance.setQrCodeBase64(null);
        instanceRepository.save(instance);
    }

    public void deleteInstance(UUID id) {
        WhatsAppInstance instance = findInstanceOrThrow(id);
        boolean success = evolutionApiService.deleteInstance(instance.getName());
        if (!success) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Falha ao remover instância no gateway Evolution");
        }
        Runnable deleteRecords = () -> {
            patientRepository.clearInstanceFromPatients(id, null);
            instanceRepository.delete(instance);
        };
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> deleteRecords.run());
        } else {
            deleteRecords.run();
        }
    }

    @Transactional
    public int migratePatients(UUID sourceId, UUID targetId) {
        return migratePatients(sourceId, targetId, null);
    }

    @Transactional
    public int migratePatients(UUID sourceId, UUID targetId, UUID nutritionistId) {
        if (sourceId.equals(targetId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Instância de origem e destino devem ser distintas."
            );
        }
        findInstanceOrThrow(sourceId);
        WhatsAppInstance target = findInstanceOrThrow(targetId);
        if (!Boolean.TRUE.equals(target.getActive()) || target.getStatus() == WhatsAppInstanceStatus.BANNED
                || target.getStatus() == WhatsAppInstanceStatus.DISABLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Instância de destino não está ativa para receber pacientes."
            );
        }

        long targetCount = patientRepository.countByWhatsappInstanceIdAndActiveTrue(targetId);
        long movingCount = nutritionistId != null
                ? patientRepository.countByWhatsappInstanceIdAndNutritionistIdAndActiveTrue(sourceId, nutritionistId)
                : patientRepository.countByWhatsappInstanceIdAndActiveTrue(sourceId);
        if (targetCount + movingCount > target.getMaxPatients()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Migração excederia a capacidade da instância de destino (%d + %d > %d)",
                            targetCount, movingCount, target.getMaxPatients())
            );
        }

        int count = patientRepository.reassignPatients(sourceId, targetId, nutritionistId);
        log.info("Migrated {} patients from WhatsApp instance {} to {} (nutritionistId={})",
                count, sourceId, targetId, nutritionistId);
        return count;
    }

    @Transactional(readOnly = true)
    public Page<InstancePatientDTO> listInstancePatients(UUID instanceId, Pageable pageable) {
        findInstanceOrThrow(instanceId);
        Page<Patient> page = patientRepository.findByWhatsappInstanceIdAndActiveTrue(instanceId, pageable);
        return page.map(p -> new InstancePatientDTO(
                p.getId(),
                p.getName(),
                p.getWhatsapp(),
                p.getNutritionistId(),
                p.getStatus() != null ? p.getStatus().name() : "ONTRACK"
        ));
    }

    /**
     * Automatic failover when an instance is BANNED, disconnected, or disabled.
     * Reassigns all active patients from the unhealthy instance to the healthiest available active instance.
     *
     * @param unhealthyInstanceId ID of the instance to evacuate
     * @return number of patients migrated
     */
    @Transactional
    public int autoFailover(UUID unhealthyInstanceId) {
        WhatsAppInstance unhealthy = findInstanceOrThrow(unhealthyInstanceId);
        long patientCount = patientRepository.countByWhatsappInstanceIdAndActiveTrue(unhealthyInstanceId);
        if (patientCount == 0) {
            log.info("Auto-failover for instance '{}' ({}): no active patients assigned",
                    unhealthy.getName(), unhealthyInstanceId);
            return 0;
        }

        List<WhatsAppInstance> eligibleTargets = instanceRepository.findByActiveTrueOrderByCreatedAtAsc()
                .stream()
                .filter(inst -> !inst.getId().equals(unhealthyInstanceId)
                        && inst.getStatus() != WhatsAppInstanceStatus.BANNED
                        && inst.getStatus() != WhatsAppInstanceStatus.DISABLED)
                .toList();

        if (eligibleTargets.isEmpty()) {
            log.warn("Auto-failover triggered for instance '{}' ({} patients), but NO eligible healthy targets found",
                    unhealthy.getName(), patientCount);
            return 0;
        }

        record TargetCandidate(WhatsAppInstance instance, long count) {}
        List<TargetCandidate> candidates = eligibleTargets.stream()
                .map(t -> new TargetCandidate(t, patientRepository.countByWhatsappInstanceIdAndActiveTrue(t.getId())))
                .sorted(Comparator.comparingLong(TargetCandidate::count))
                .toList();

        // 1st preference: CONNECTED and under maxPatients
        WhatsAppInstance target = candidates.stream()
                .filter(c -> c.instance().getStatus() == WhatsAppInstanceStatus.CONNECTED
                        && c.count() < c.instance().getMaxPatients())
                .map(TargetCandidate::instance)
                .findFirst()
                .or(() -> candidates.stream()
                        .filter(c -> c.count() < c.instance().getMaxPatients())
                        .map(TargetCandidate::instance)
                        .findFirst())
                .or(() -> candidates.stream().map(TargetCandidate::instance).findFirst())
                .orElse(eligibleTargets.get(0));

        int moved = patientRepository.reassignPatients(unhealthyInstanceId, target.getId(), null);
        log.warn("AUTO-FAILOVER: Reassigned {} patients from unhealthy instance '{}' ({}) to healthy instance '{}' ({})",
                moved, unhealthy.getName(), unhealthyInstanceId, target.getName(), target.getId());

        return moved;
    }

    /**
     * Sticky Affinity + Least Loaded Active Routing:
     * 1. If patient already assigned to an existing active, non-banned instance, keep it!
     * 2. If unassigned, find eligible (active, non-banned, non-disabled) CONNECTED instance under maxPatients.
     * 3. Fallback: eligible active instance under maxPatients.
     * 4. Fallback: eligible CONNECTED instance with lowest count.
     * 5. Fallback: any eligible instance with lowest count.
     */
    @Transactional
    public Optional<WhatsAppInstance> assignPatientToInstance(Patient patient) {
        if (patient.getWhatsappInstanceId() != null) {
            Optional<WhatsAppInstance> current = instanceRepository.findById(patient.getWhatsappInstanceId());
            if (current.isPresent() && Boolean.TRUE.equals(current.get().getActive())
                    && current.get().getStatus() != WhatsAppInstanceStatus.BANNED
                    && current.get().getStatus() != WhatsAppInstanceStatus.DISABLED) {
                return current;
            }
        }

        List<WhatsAppInstance> eligibleInstances = instanceRepository.findByActiveTrueOrderByCreatedAtAsc()
                .stream()
                .filter(inst -> inst.getStatus() != WhatsAppInstanceStatus.BANNED
                        && inst.getStatus() != WhatsAppInstanceStatus.DISABLED)
                .toList();
        if (eligibleInstances.isEmpty()) {
            return Optional.empty();
        }

        record InstanceCandidate(WhatsAppInstance instance, long count) {}

        List<InstanceCandidate> candidates = eligibleInstances.stream()
                .map(inst -> new InstanceCandidate(
                        inst,
                        patientRepository.countByWhatsappInstanceIdAndActiveTrue(inst.getId())
                ))
                .sorted(Comparator.comparingLong(InstanceCandidate::count))
                .toList();

        // 1st preference: Connected and under maxPatients
        Optional<WhatsAppInstance> selected = candidates.stream()
                .filter(c -> c.instance().getStatus() == WhatsAppInstanceStatus.CONNECTED
                        && c.count() < c.instance().getMaxPatients())
                .map(InstanceCandidate::instance)
                .findFirst();

        // 2nd preference: Any eligible state under maxPatients
        if (selected.isEmpty()) {
            selected = candidates.stream()
                    .filter(c -> c.count() < c.instance().getMaxPatients())
                    .map(InstanceCandidate::instance)
                    .findFirst();
        }

        // 3rd preference: Connected instance with lowest count
        if (selected.isEmpty()) {
            selected = candidates.stream()
                    .filter(c -> c.instance().getStatus() == WhatsAppInstanceStatus.CONNECTED)
                    .map(InstanceCandidate::instance)
                    .findFirst();
        }

        // 4th preference: Any eligible instance with lowest count
        if (selected.isEmpty()) {
            selected = candidates.stream()
                    .map(InstanceCandidate::instance)
                    .findFirst();
        }

        selected.ifPresent(inst -> {
            patient.setWhatsappInstanceId(inst.getId());
            patientRepository.save(patient);
            log.info("Assigned patient {} to WhatsApp fleet instance '{}' (id={})",
                    patient.getId(), inst.getName(), inst.getId());
        });

        return selected;
    }

    private WhatsAppInstance findInstanceOrThrow(UUID id) {
        return instanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instância de WhatsApp não encontrada"
                ));
    }

    private WhatsAppFleetInstanceDTO toDTO(WhatsAppInstance inst) {
        long patientCount = patientRepository.countByWhatsappInstanceIdAndActiveTrue(inst.getId());
        long nutritionistCount = patientRepository.countDistinctNutritionistIdsByWhatsappInstanceId(inst.getId());
        int max = inst.getMaxPatients() != null && inst.getMaxPatients() > 0 ? inst.getMaxPatients() : 180;
        int capacityPercentage = (int) Math.min(100, (patientCount * 100) / max);
        boolean isNearCapacity = capacityPercentage >= 80;

        return new WhatsAppFleetInstanceDTO(
                inst.getId(),
                inst.getName(),
                inst.getPhoneNumber(),
                inst.getDescription(),
                inst.getStatus(),
                inst.getQrCodeBase64(),
                inst.getMaxPatients(),
                inst.getActive(),
                patientCount,
                nutritionistCount,
                capacityPercentage,
                isNearCapacity,
                inst.getLastHeartbeatAt(),
                inst.getDisconnectedAt(),
                inst.getCreatedAt()
        );
    }
}
