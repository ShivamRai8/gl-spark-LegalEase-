package com.legalease.userservice.config;

import com.legalease.userservice.entity.Role;
import com.legalease.userservice.entity.User;
import com.legalease.userservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds a default administrator account on first startup so the console
 * can be bootstrapped. Login: admin@legalease.com / admin123
 */
@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner seedDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin@legalease.com").isPresent()) {
                return;
            }
            User admin = new User();
            admin.setName("System Administrator");
            admin.setEmail("admin@legalease.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            admin.setDeleted(false);
            userRepository.save(admin);
            logger.info("Seeded default administrator: admin@legalease.com / admin123");
        };
    }
}
