package com.dispatch.config;

import com.dispatch.entity.User;
import com.dispatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("dev")
    CommandLineRunner initData(UserRepository userRepository) {
        return args -> {
            // 관리자 계정이 없으면 생성
            if (!userRepository.existsByEmail("admin@dispatch.com")) {
                User admin = User.builder()
                        .email("admin@dispatch.com")
                        .password(passwordEncoder.encode("admin123"))
                        .name("관리자")
                        .phone("010-0000-0000")
                        .role(User.UserRole.ADMIN)
                        .status(User.UserStatus.APPROVED)
                        .build();

                userRepository.save(admin);
                log.info("===========================================");
                log.info("Admin user created:");
                log.info("  Email: admin@dispatch.com");
                log.info("  Password: admin123");
                log.info("===========================================");
            }

            // 테스트용 직원 계정
            if (!userRepository.existsByEmail("staff@dispatch.com")) {
                User staff = User.builder()
                        .email("staff@dispatch.com")
                        .password(passwordEncoder.encode("staff123"))
                        .name("직원")
                        .phone("010-1111-1111")
                        .role(User.UserRole.STAFF)
                        .status(User.UserStatus.APPROVED)
                        .build();

                userRepository.save(staff);
                log.info("Staff user created: staff@dispatch.com / staff123");
            }
        };
    }
}
