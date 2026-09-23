package com.compas.api.auth;

import com.compas.api.auth.dto.*;
import com.compas.api.email.EmailService;
import com.compas.api.model.Nutritionist;
import com.compas.api.repository.NutritionistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger LOG = LoggerFactory.getLogger(AuthService.class);

    private final NutritionistRepository nutritionistRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(
            NutritionistRepository nutritionistRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.nutritionistRepository = nutritionistRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public SignupResult signup(SignupRequest request) {
        if (nutritionistRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "");

        Nutritionist nutritionist = Nutritionist.builder()
                .name(request.name())
                .professionalName(request.professionalName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .crn(request.crn())
                .crnRegional(request.crnRegional())
                .specialty(request.specialty())
                .whatsapp(request.whatsapp())
                .emailVerified(false)
                .emailVerificationToken(verificationToken)
                .emailVerificationExpiresAt(LocalDateTime.now().plusHours(24))
                .onboardingCompleted(false)
                .subscriptionTier("TRIAL")
                .patientLimit(15)
                .build();

        nutritionist = nutritionistRepository.save(nutritionist);

        try {
            emailService.sendVerificationEmail(
                    nutritionist.getEmail(),
                    nutritionist.getDisplayName(),
                    verificationToken
            );
        } catch (Exception e) {
            LOG.warn("Falha ao despachar e-mail de verificação para {}: {}", nutritionist.getEmail(), e.getMessage());
        }

        String accessToken = jwtService.generateAccessToken(nutritionist);
        String refreshToken = jwtService.generateRefreshToken(nutritionist);

        storeRefreshToken(refreshToken, nutritionist.getId());

        return new SignupResult(
                accessToken,
                refreshToken,
                new SignupResponse.UserDto(
                        nutritionist.getId(),
                        nutritionist.getName(),
                        nutritionist.getEmail(),
                        nutritionist.getRole().name(),
                        nutritionist.getOnboardingCompleted(),
                        nutritionist.getEmailVerified(),
                        nutritionist.isSubscriptionActive(),
                        nutritionist.isReadOnly()
                )
        );
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        Nutritionist nutritionist = nutritionistRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), nutritionist.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }

        String accessToken = jwtService.generateAccessToken(nutritionist);
        String refreshToken = jwtService.generateRefreshToken(nutritionist);

        storeRefreshToken(refreshToken, nutritionist.getId());

        return new LoginResult(
                accessToken,
                refreshToken,
                new LoginResponse.UserDto(
                        nutritionist.getId(),
                        nutritionist.getName(),
                        nutritionist.getEmail(),
                        nutritionist.getRole().name(),
                        nutritionist.getOnboardingCompleted(),
                        nutritionist.getEmailVerified(),
                        nutritionist.isSubscriptionActive(),
                        nutritionist.isReadOnly()
                )
        );
    }

    @Transactional
    public RefreshResult refresh(String refreshTokenValue) {
        // Validate JWT
        jwtService.validateToken(refreshTokenValue);

        // Extract jti and verify it exists in DB
        String jti = jwtService.extractJti(refreshTokenValue);
        String tokenHash = hashJti(jti);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido"));

        // Check not expired
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado");
        }

        // Extract nutritionist ID and load
        UUID nutritionistId = jwtService.extractNutritionistId(refreshTokenValue);
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nutricionista não encontrado"));

        // Rotation: delete old, create new
        refreshTokenRepository.delete(storedToken);

        String newAccessToken = jwtService.generateAccessToken(nutritionist);
        String newRefreshToken = jwtService.generateRefreshToken(nutritionist);

        storeRefreshToken(newRefreshToken, nutritionist.getId());

        return new RefreshResult(
                newAccessToken,
                newRefreshToken,
                new RefreshResponse.UserDto(
                        nutritionist.getId(),
                        nutritionist.getName(),
                        nutritionist.getEmail(),
                        nutritionist.getRole().name(),
                        nutritionist.getOnboardingCompleted(),
                        nutritionist.getEmailVerified(),
                        nutritionist.isSubscriptionActive(),
                        nutritionist.isReadOnly()
                )
        );
    }

    @Transactional
    public void logout(UUID nutritionistId) {
        refreshTokenRepository.deleteByNutritionistId(nutritionistId);
    }

    @Transactional
    public void completeOnboarding(UUID nutritionistId) {
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));
        nutritionist.setOnboardingCompleted(true);
        nutritionistRepository.save(nutritionist);
    }

    @Transactional
    public Map<String, Object> verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token de verificação é obrigatório");
        }

        Nutritionist nutritionist = nutritionistRepository.findByEmailVerificationToken(token.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Token de verificação inválido ou já utilizado."
                ));

        if (nutritionist.getEmailVerificationExpiresAt() != null
                && nutritionist.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token de verificação expirado. Solicite um novo link de confirmação."
            );
        }

        nutritionist.setEmailVerified(true);
        nutritionist.setEmailVerificationToken(null);
        nutritionist.setEmailVerificationExpiresAt(null);
        nutritionistRepository.save(nutritionist);

        return Map.of("success", true, "message", "E-mail confirmado com sucesso!");
    }

    @Transactional
    public Map<String, Object> resendVerification(UUID currentNutritionistId, String optionalEmail) {
        boolean isUnauthenticated = currentNutritionistId == null;
        Nutritionist nutritionist = resolveNutritionistForResend(currentNutritionistId, optionalEmail);

        if (nutritionist == null) {
            return genericResendResponse();
        }

        if (Boolean.TRUE.equals(nutritionist.getEmailVerified())) {
            if (isUnauthenticated) {
                return genericResendResponse();
            }
            return Map.of("success", true, "message", "Este e-mail já foi verificado anteriormente.");
        }

        if (isCooldownActive(nutritionist)) {
            if (isUnauthenticated) {
                return genericResendResponse();
            }
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Aguarde 1 minuto antes de solicitar um novo e-mail de confirmação."
            );
        }

        String verificationToken = getOrGenerateVerificationToken(nutritionist);

        try {
            emailService.sendVerificationEmail(
                    nutritionist.getEmail(),
                    nutritionist.getDisplayName(),
                    verificationToken
            );
        } catch (Exception e) {
            LOG.warn("Falha ao reenviar e-mail de verificação para {}: {}", nutritionist.getEmail(), e.getMessage());
        }

        if (isUnauthenticated) {
            return genericResendResponse();
        }

        return Map.of("success", true, "message", "E-mail de confirmação enviado! Verifique sua caixa de entrada.");
    }

    private Map<String, Object> genericResendResponse() {
        return Map.of(
                "success", true,
                "message", "Se o e-mail estiver cadastrado, um link de confirmação será enviado."
        );
    }

    private boolean isCooldownActive(Nutritionist nutritionist) {
        return nutritionist.getEmailVerificationExpiresAt() != null
                && nutritionist.getEmailVerificationExpiresAt()
                .isAfter(LocalDateTime.now().plusHours(23).plusMinutes(59));
    }

    private String getOrGenerateVerificationToken(Nutritionist nutritionist) {
        if (nutritionist.getEmailVerificationToken() != null
                && nutritionist.getEmailVerificationExpiresAt() != null
                && nutritionist.getEmailVerificationExpiresAt().isAfter(LocalDateTime.now())) {
            return nutritionist.getEmailVerificationToken();
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "");
        nutritionist.setEmailVerificationToken(verificationToken);
        nutritionist.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));
        nutritionistRepository.save(nutritionist);
        return verificationToken;
    }

    private Nutritionist resolveNutritionistForResend(UUID currentNutritionistId, String optionalEmail) {
        if (currentNutritionistId != null) {
            return nutritionistRepository.findById(currentNutritionistId)
                    .orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));
        }
        if (optionalEmail != null && !optionalEmail.isBlank()) {
            return nutritionistRepository.findByEmail(optionalEmail.trim().toLowerCase(Locale.ROOT))
                    .orElse(null);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail ou usuário autenticado é obrigatório");
    }

    public MeResponse getCurrentUser(UUID nutritionistId) {
        Nutritionist nutritionist = nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutricionista não encontrado"));

        return new MeResponse(
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
                nutritionist.isSubscriptionActive(),
                nutritionist.isReadOnly()
        );
    }

    private void storeRefreshToken(String refreshToken, UUID nutritionistId) {
        String jti = jwtService.extractJti(refreshToken);
        String tokenHash = hashJti(jti);

        // Parse expiration from JWT
        var claims = jwtService.validateToken(refreshToken);
        LocalDateTime expiresAt = claims.getPayload().getExpiration().toInstant()
                .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();

        RefreshToken tokenEntity = RefreshToken.builder()
                .tokenHash(tokenHash)
                .nutritionistId(nutritionistId)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(tokenEntity);
    }

    private String hashJti(String jti) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(jti.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Internal result classes for auth operations.
     */
    public record SignupResult(String accessToken, String refreshToken, SignupResponse.UserDto user) {}
    public record LoginResult(String accessToken, String refreshToken, LoginResponse.UserDto user) {}
    public record RefreshResult(String accessToken, String refreshToken, RefreshResponse.UserDto user) {}
}