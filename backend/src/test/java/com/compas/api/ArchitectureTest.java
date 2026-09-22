package com.compas.api;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class ArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void importClasses() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.compas.api");
    }

    @Test
    void controllersShouldNotDependOnRepositories() {
        ArchRuleDefinition.noClasses()
                .that().resideInAPackage("..controller..")
                .should().dependOnClassesThat()
                .resideInAPackage("..repository..")
                .because("Controllers must access data only through Services")
                .check(importedClasses);
    }

    @Test
    void servicesShouldNotDependOnControllers() {
        ArchRuleDefinition.noClasses()
                .that().resideInAPackage("..service..")
                .should().dependOnClassesThat()
                .resideInAPackage("..controller..")
                .because("Services must not depend on the web layer")
                .check(importedClasses);
    }

    @Test
    void repositoriesShouldNotDependOnServices() {
        ArchRuleDefinition.noClasses()
                .that().resideInAPackage("..repository..")
                .should().dependOnClassesThat()
                .resideInAPackage("..service..")
                .because("Repositories are data-access primitives, not business logic")
                .check(importedClasses);
    }

    @Test
    void noPackageCycles() {
        SlicesRuleDefinition.slices()
                .matching("com.compas.api.(*)..")
                .should().beFreeOfCycles()
                .check(importedClasses);
    }

    @Test
    void dtoClassesShouldNotDependOnRepositories() {
        ArchRuleDefinition.noClasses()
                .that().resideInAPackage("..dto..")
                .should().dependOnClassesThat()
                .resideInAPackage("..repository..")
                .because("DTOs are data transfer objects, not data access")
                .check(importedClasses);
    }

    @Test
    void controllersShouldBePreAuthorized() {
        ArchRuleDefinition.classes()
                .that().resideInAPackage("..controller..")
                .and().doNotHaveSimpleName("HealthController")
                .and().doNotHaveSimpleName("WebhookController")
                .should().beAnnotatedWith("org.springframework.security.access.prepost.PreAuthorize")
                .because("All controllers (except health and webhook) must have @PreAuthorize for security - defense in depth")
                .check(importedClasses);
    }
}