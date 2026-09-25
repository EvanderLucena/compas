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

    @Value("${compas.seed.admin.email:${nutriai.seed.admin.email:admin@compas.app}}")
    private String adminEmail;

    @Value("${compas.seed.admin.password:${nutriai.seed.admin.password:Admin123!}}")
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
        TenantContext.executeWithBypass(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                ensureAdminUser();
                ensureInitialNutritionist();
            });
        });
    }

    private void ensureAdminUser() {
        if (nutritionistRepository.findByEmail("ops@compas.app").isEmpty()) {
            nutritionistRepository.save(Nutritionist.builder()
                    .name("Operador Compas")
                    .professionalName("Compas Ops")
                    .email("ops@compas.app")
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(UserRole.ADMIN)
                    .emailVerified(true)
                    .onboardingCompleted(true)
                    .subscriptionTier("UNLIMITED")
                    .patientLimit(9999)
                    .build());
            logger.info("Admin account ops@compas.app seeded.");
        }
    }

    private void ensureInitialNutritionist() {
        if (nutritionistRepository.findByEmail(adminEmail).isEmpty()
                && nutritionistRepository.findByEmail("admin@nutriai.com").isEmpty()) {
            nutritionistRepository.save(Nutritionist.builder()
                    .name(adminName)
                    .professionalName(adminName)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .crn("00000")
                    .crnRegional("CRN-3")
                    .role(UserRole.NUTRITIONIST)
                    .emailVerified(true)
                    .onboardingCompleted(true)
                    .subscriptionTier("UNLIMITED")
                    .patientLimit(9999)
                    .build());
            logger.info("Initial nutritionist account {} seeded.", adminEmail);
        }
    }
}
