package com.compas.api.config;

import com.compas.api.model.Nutritionist;
import com.compas.api.model.UserRole;
import com.compas.api.repository.NutritionistRepository;
import com.compas.api.auth.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@Profile("!dev & !test")
@Order(1)
public class ProdAccountSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ProdAccountSeeder.class);

    private final NutritionistRepository nutritionistRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    @Value("${compas.seed.admin.enabled:${COMPAS_SEED_ADMIN_ENABLED:false}}")
    private boolean seedEnabled;

    @Value("${compas.seed.admin.email:${nutriai.seed.admin.email:admin@compas.app}}")
    private String adminEmail;

    @Value("${compas.seed.admin.password:${nutriai.seed.admin.password:}}")
    private String adminPassword;

    @Value("${compas.seed.admin.name:${nutriai.seed.admin.name:Nutricionista Compas}}")
    private String adminName;

    public ProdAccountSeeder(
            NutritionistRepository nutritionistRepository,
            PasswordEncoder passwordEncoder,
            PlatformTransactionManager transactionManager
    ) {
        this.nutritionistRepository = nutritionistRepository;
        this.passwordEncoder = passwordEncoder;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (adminPassword == null || adminPassword.isBlank()) {
            logger.warn("COMPAS_SEED_ADMIN_ENABLED is true but password is empty. Skipping initial account seeding.");
            return;
        }

        TenantContext.executeWithBypass(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                ensureInitialNutritionist();
            });
        });
    }

    private void ensureInitialNutritionist() {
        if (nutritionistRepository.findByEmail(adminEmail).isEmpty()
                && nutritionistRepository.findByEmail("admin@nutriai.com").isEmpty()) {
            nutritionistRepository.save(Nutritionist.builder()
                    .name(adminName)
                    .professionalName(adminName)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(UserRole.NUTRITIONIST)
                    .emailVerified(true)
                    .onboardingCompleted(false)
                    .subscriptionTier("UNLIMITED")
                    .patientLimit(9999)
                    .build());
            logger.info("Initial nutritionist account {} seeded for first-time onboarding.", adminEmail);
        }
    }
}
