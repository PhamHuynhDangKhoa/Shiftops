package com.shiftops.common.config;

import com.shiftops.branch.entity.Branch;
import com.shiftops.branch.repository.BranchRepository;
import com.shiftops.user.entity.Role;
import com.shiftops.user.entity.User;
import com.shiftops.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains users. Skipping data initialization.");
            return;
        }

        log.info("Initializing baseline seed data...");

        Branch mainBranch = branchRepository.save(Branch.builder()
                .name("Main Branch")
                .address("100 Central Ave")
                .timezone("UTC")
                .isActive(true)
                .build());

        Branch northBranch = branchRepository.save(Branch.builder()
                .name("North Branch")
                .address("200 North Blvd")
                .timezone("UTC")
                .isActive(true)
                .build());

        // Default Owner
        userRepository.save(User.builder()
                .email("owner@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("System Owner")
                .phone("1234567890")
                .role(Role.OWNER)
                .primaryBranch(null)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        // Default Manager for Main Branch
        userRepository.save(User.builder()
                .email("manager@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Main Branch Manager")
                .phone("1234567891")
                .role(Role.MANAGER)
                .primaryBranch(mainBranch)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        // Default Staff for Main Branch
        userRepository.save(User.builder()
                .email("staff@shiftops.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Main Branch Staff")
                .phone("1234567892")
                .role(Role.STAFF)
                .primaryBranch(mainBranch)
                .isActive(true)
                .mustChangePassword(false)
                .build());

        log.info("Baseline seed data initialized successfully: owner@shiftops.com, manager@shiftops.com, staff@shiftops.com (password: Password123!)");
    }
}
