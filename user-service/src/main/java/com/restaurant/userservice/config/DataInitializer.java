package com.restaurant.userservice.config;

import com.restaurant.userservice.entity.Role;
import com.restaurant.userservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;

    @Bean
    public ApplicationRunner initializeData() {
        return args -> {
            log.info("Initializing default data...");

            // Ensure CUSTOMER role exists
            if (roleRepository.findByName("CUSTOMER").isEmpty()) {
                Role customerRole = new Role();
                customerRole.setName("CUSTOMER");
                roleRepository.save(customerRole);
                log.info("✓ Created CUSTOMER role");
            } else {
                log.info("✓ CUSTOMER role already exists");
            }

            // Ensure other default roles exist
            String[] defaultRoles = {"ADMIN", "STAFF", "KITCHEN"};
            for (String roleName : defaultRoles) {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    log.info("✓ Created {} role", roleName);
                }
            }

            log.info("Data initialization completed");
        };
    }
}
