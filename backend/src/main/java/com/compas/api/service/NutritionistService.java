package com.compas.api.service;

import com.compas.api.dto.nutritionist.ChangePasswordRequest;
import com.compas.api.dto.nutritionist.NutritionistProfileResponse;
import com.compas.api.dto.nutritionist.UpdateProfileRequest;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class NutritionistService {

    private final NutritionistRepository nutritionistRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public NutritionistService(
            NutritionistRepository nutritionistRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.nutritionistRepository = nutritionistRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public NutritionistProfileResponse getProfile(UUID nutritionistId) {
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));

        long activePatients = patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId);
        return toProfileResponse(nutritionist, activePatients);
    }

    @Transactional
    public NutritionistProfileResponse updateProfile(UUID nutritionistId, UpdateProfileRequest request) {
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));

        nutritionist.setName(request.name().trim());
        nutritionist.setProfessionalName(request.professionalName() != null ? request.professionalName().trim() : null);
        nutritionist.setCrn(request.crn() != null ? request.crn().trim() : null);
        nutritionist.setCrnRegional(request.crnRegional() != null ? request.crnRegional().trim() : null);
        nutritionist.setSpecialty(request.specialty() != null ? request.specialty().trim() : null);
        nutritionist.setWhatsapp(request.whatsapp() != null ? request.whatsapp().trim() : null);

        Nutritionist saved = nutritionistRepository.save(nutritionist);
        long activePatients = patientRepository.countByNutritionistIdAndActiveTrue(nutritionistId);
        return toProfileResponse(saved, activePatients);
    }

    @Transactional
    public void changePassword(UUID nutritionistId, ChangePasswordRequest request) {
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));

        if (!passwordEncoder.matches(request.currentPassword(), nutritionist.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha atual está incorreta");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nova senha e a confirmação não conferem");
        }

        if (request.newPassword().equals(request.currentPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ser diferente da senha atual"
            );
        }

        nutritionist.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        nutritionistRepository.save(nutritionist);
    }

    private NutritionistProfileResponse toProfileResponse(Nutritionist nutritionist, long activePatientCount) {
        return new NutritionistProfileResponse(
                nutritionist.getId(),
                nutritionist.getName(),
                nutritionist.getProfessionalName(),
                nutritionist.getEmail(),
                nutritionist.getRole().name(),
                nutritionist.getCrn(),
                nutritionist.getCrnRegional(),
                nutritionist.getSpecialty(),
                nutritionist.getWhatsapp(),
                nutritionist.getEmailVerified() != null ? nutritionist.getEmailVerified() : false,
                nutritionist.getOnboardingCompleted(),
                nutritionist.getTrialEndsAt(),
                nutritionist.getSubscriptionTier(),
                nutritionist.getPatientLimit(),
                activePatientCount,
                nutritionist.getCreatedAt()
        );
    }
}
