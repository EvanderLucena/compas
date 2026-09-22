package com.compas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaRepositories(basePackages = {"com.compas.api.repository", "com.compas.api.auth"})
@EnableScheduling
public class CompasApplication {

    public static void main(String[] args) {
        SpringApplication.run(CompasApplication.class, args);
    }
}